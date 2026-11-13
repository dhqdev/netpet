// Estabelecimentos: cadastro, vitrine (aba Serviços), equipe, horários, serviços e horários livres.
import { z } from 'zod';
import { transacao, um, varios, q } from '../db.js';
import { exigirLogin } from '../auth.js';
import { exigirEstabelecimento, acessoNoEstabelecimento } from '../permissoes.js';
import { naoEncontrado, invalido, conflito } from '../erros.js';
import { horariosLivres } from '../regras/disponibilidade.js';

const hora = z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM');
const centavos = z.number().int().min(0);

export const esquemaEstabelecimento = z.object({
  nome: z.string().trim().min(2).max(80),
  categoria: z.enum(['banho', 'vet', 'hotel', 'creche', 'adestrador', 'passeador']),
  documento: z.string().regex(/^\d{11}$|^\d{14}$/, 'CPF (11) ou CNPJ (14) só com números').optional(),
  sobre: z.string().max(600).optional(),
  telefone: z.string().max(20).optional(),
  endereco: z.string().max(200).optional(),
  bairro: z.string().max(80).optional(),
  cidade: z.string().max(80).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  atende_em_casa: z.boolean().optional(),
  raio_km: z.number().positive().max(100).optional(),
  leva_e_traz: z.boolean().optional(),
  taxa_leva_traz: centavos.optional(),
  aceite_automatico: z.boolean().optional(),
  antecedencia_min: z.number().int().min(0).max(10080).optional(),
  cancelamento_horas: z.number().int().min(0).max(168).optional(),
  faixa_preco: z.number().int().min(1).max(4).optional(),
  cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  logo_path: z.string().max(300).optional(),
  capa_path: z.string().max(300).optional(),
  // Horário padrão já no cadastro (opcional). Ex.: [{ dia_semana: 1, abre: '08:00', fecha: '19:00' }]
  horarios: z.array(z.object({ dia_semana: z.number().int().min(0).max(6), abre: hora, fecha: hora })).max(28).optional(),
});

const CAMPOS = Object.keys(esquemaEstabelecimento.shape).filter((k) => k !== 'horarios');

const slugDe = (nome) => nome.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32) || 'estabelecimento';

// Cria o estabelecimento e já coloca quem criou como dono e como profissional que atende.
export async function criarEstabelecimento(db, perfilId, nomePessoa, dados) {
  const d = esquemaEstabelecimento.parse(dados);
  const base = slugDe(d.nome);
  let slug = base;
  for (let i = 2; await um(`select 1 from estabelecimentos where slug = $1`, [slug], db); i++) slug = `${base}-${i}`;
  const cols = CAMPOS.filter((k) => d[k] !== undefined);
  const e = await um(
    `insert into estabelecimentos (slug, ${cols.join(', ')}) values ($1, ${cols.map((_, i) => `$${i + 2}`).join(', ')}) returning *`,
    [slug, ...cols.map((k) => d[k])], db);
  await db.query(
    `insert into equipe_estabelecimento (estabelecimento_id, perfil_id, acesso, nome, funcao) values ($1, $2, 'dono', $3, 'Responsável')`,
    [e.id, perfilId, nomePessoa]);
  for (const h of d.horarios ?? []) {
    await db.query(`insert into horarios (estabelecimento_id, dia_semana, abre, fecha) values ($1, $2, $3, $4)`, [e.id, h.dia_semana, h.abre, h.fecha]);
  }
  return e;
}

const esquemaServico = z.object({
  nome: z.string().trim().min(2).max(80),
  descricao: z.string().max(400).optional(),
  duracao_min: z.number().int().min(5).max(43200),
  preco_pequeno: centavos,
  preco_medio: centavos,
  preco_grande: centavos,
  especies: z.array(z.enum(['cao', 'gato', 'outro'])).min(1).optional(),
  ativo: z.boolean().optional(),
  ordem: z.number().int().optional(),
});

export default async function rotas(app) {
  // Uma pessoa que já é tutora abre um estabelecimento (vira parceira também).
  app.post('/estabelecimentos', async (req, reply) => {
    const eu = exigirLogin(req);
    const perfil = await um(`select nome from perfis where id = $1`, [eu]);
    const e = await transacao((db) => criarEstabelecimento(db, eu, perfil.nome, req.body));
    return reply.status(201).send(e);
  });

  // Vitrine da aba Serviços. Destaques pagos primeiro, depois nota e quantidade de avaliações.
  app.get('/estabelecimentos', async (req) => {
    const { categoria, busca, bairro, cidade, lat, lng, aberto } = req.query;
    const temPosicao = lat && lng;
    return varios(
      `select e.id, e.slug, e.nome, e.categoria, e.verificado, e.bairro, e.cidade, e.nota_media, e.avaliacoes,
              e.faixa_preco, e.leva_e_traz, e.atende_em_casa, e.cor, e.logo_path, e.capa_path, e.plano,
              exists (select 1 from impulsionamentos i where i.estabelecimento_id = e.id and i.ativo and i.post_id is null
                        and i.periodo @> now()) as destaque,
              ${temPosicao ? `case when e.latitude is null then null else round((6371 * acos(least(1, cos(radians($6)) * cos(radians(e.latitude)) * cos(radians(e.longitude) - radians($7))
                     + sin(radians($6)) * sin(radians(e.latitude)))))::numeric, 1) end` : 'null::numeric'} as distancia_km,
              ${req.eu ? `exists (select 1 from favoritos f where f.estabelecimento_id = e.id and f.perfil_id = $8)` : 'false'} as favorito
         from estabelecimentos e
        where e.ativo
          and ($1::text is null or e.categoria = $1)
          and ($2::text is null or e.nome ilike '%' || $2 || '%' or e.sobre ilike '%' || $2 || '%')
          and ($3::text is null or e.bairro ilike $3)
          and ($4::text is null or e.cidade ilike $4)
          and (not $5::boolean or exists (
                select 1 from horarios h where h.estabelecimento_id = e.id and h.equipe_id is null
                   and h.dia_semana = extract(dow from now() at time zone 'America/Sao_Paulo')
                   and (now() at time zone 'America/Sao_Paulo')::time between h.abre and h.fecha))
          and ($6::float8 is null or $7::float8 is not null) and ($8::uuid is null or true)
        order by destaque desc, ${temPosicao ? 'distancia_km asc nulls last,' : ''} e.nota_media desc, e.avaliacoes desc
        limit 50`,
      [categoria ?? null, busca ?? null, bairro ?? null, cidade ?? null, aberto === '1',
        temPosicao ? Number(lat) : null, temPosicao ? Number(lng) : null, req.eu ?? null],
    );
  });

  // Página do estabelecimento (por id ou slug).
  app.get('/estabelecimentos/:id', async (req) => {
    const ehUuid = /^[0-9a-f-]{36}$/i.test(req.params.id);
    const e = await um(`select * from estabelecimentos where ${ehUuid ? 'id' : 'slug'} = $1`, [req.params.id]);
    if (!e) throw naoEncontrado('Estabelecimento');
    const acesso = await acessoNoEstabelecimento(req.eu, e.id);
    if (!e.ativo && !acesso) throw naoEncontrado('Estabelecimento');
    if (!acesso) delete e.documento; // CPF/CNPJ só a equipe vê
    const [servicos, adicionais, equipe, horarios, avaliacoes] = await Promise.all([
      varios(`select * from servicos where estabelecimento_id = $1 ${acesso ? '' : 'and ativo'} order by ordem, nome`, [e.id]),
      varios(`select * from adicionais where estabelecimento_id = $1 ${acesso ? '' : 'and ativo'} order by nome`, [e.id]),
      varios(`select id, nome, funcao, cor, atende ${acesso ? ', perfil_id, acesso, ativo' : ''} from equipe_estabelecimento
               where estabelecimento_id = $1 ${acesso ? '' : 'and ativo and atende'} order by criado_em`, [e.id]),
      varios(`select dia_semana, abre, fecha, equipe_id from horarios where estabelecimento_id = $1 order by dia_semana, abre`, [e.id]),
      varios(`select a.nota, a.texto, a.resposta, a.criado_em, p.nome as autor, pt.nome as pet
                from avaliacoes a join perfis p on p.id = a.autor_id
                join agendamentos ag on ag.id = a.agendamento_id join pets pt on pt.id = ag.pet_id
               where a.estabelecimento_id = $1 order by a.criado_em desc limit 10`, [e.id]),
    ]);
    const favorito = req.eu ? !!(await um(`select 1 from favoritos where perfil_id = $1 and estabelecimento_id = $2`, [req.eu, e.id])) : false;
    return { ...e, servicos, adicionais, equipe, horarios, avaliacoes_recentes: avaliacoes, favorito, meu_acesso: acesso };
  });

  app.patch('/estabelecimentos/:id', async (req) => {
    const eu = exigirLogin(req);
    await exigirEstabelecimento(eu, req.params.id, 'admin');
    const d = esquemaEstabelecimento.omit({ horarios: true }).partial().extend({ ativo: z.boolean() }).partial().parse(req.body);
    const ks = Object.keys(d).filter((k) => d[k] !== undefined);
    if (!ks.length) throw invalido('Nada para mudar');
    return um(`update estabelecimentos set ${ks.map((k, i) => `${k} = $${i + 2}`).join(', ')} where id = $1 returning *`,
      [req.params.id, ...ks.map((k) => d[k])]);
  });

  // ───── Equipe ─────

  app.post('/estabelecimentos/:id/equipe', async (req, reply) => {
    const eu = exigirLogin(req);
    const d = z.object({
      nome: z.string().trim().min(1).max(60),
      funcao: z.string().max(60).optional(),
      cor: z.string().optional(),
      atende: z.boolean().default(true),
      // Para dar acesso ao app: e-mail de uma conta existente e o nível.
      email: z.email().optional(),
      acesso: z.enum(['admin', 'equipe']).optional(),
    }).parse(req.body);
    // Só o dono dá acesso de admin; admin cadastra profissionais.
    await exigirEstabelecimento(eu, req.params.id, d.acesso === 'admin' ? 'dono' : 'admin');
    let perfilId = null;
    if (d.email) {
      const c = await um(`select id from contas where email = $1 and ativa`, [d.email]);
      if (!c) throw naoEncontrado('Conta com esse e-mail');
      perfilId = c.id;
    }
    const m = await um(
      `insert into equipe_estabelecimento (estabelecimento_id, perfil_id, acesso, nome, funcao, cor, atende)
       values ($1, $2, $3, $4, $5, $6, $7) returning *`,
      [req.params.id, perfilId, perfilId ? (d.acesso ?? 'equipe') : null, d.nome, d.funcao ?? null, d.cor ?? null, d.atende]);
    return reply.status(201).send(m);
  });

  app.patch('/estabelecimentos/:id/equipe/:membro', async (req) => {
    const eu = exigirLogin(req);
    const meu = await exigirEstabelecimento(eu, req.params.id, 'admin');
    const d = z.object({
      nome: z.string().trim().min(1).max(60), funcao: z.string().max(60).nullable(), cor: z.string().nullable(),
      atende: z.boolean(), ativo: z.boolean(), acesso: z.enum(['admin', 'equipe']).nullable(),
    }).partial().parse(req.body);
    const alvo = await um(`select * from equipe_estabelecimento where id = $1 and estabelecimento_id = $2`, [req.params.membro, req.params.id]);
    if (!alvo) throw naoEncontrado('Membro da equipe');
    if (alvo.acesso === 'dono' && (d.acesso !== undefined || d.ativo === false)) throw conflito('Não dá para tirar o acesso do dono');
    if ('acesso' in d && meu !== 'dono') throw conflito('Só o dono muda o acesso da equipe');
    const ks = Object.keys(d);
    if (!ks.length) throw invalido('Nada para mudar');
    return um(`update equipe_estabelecimento set ${ks.map((k, i) => `${k} = $${i + 2}`).join(', ')} where id = $1 returning *`,
      [alvo.id, ...ks.map((k) => d[k])]);
  });

  // ───── Horários de funcionamento (substitui todos de uma vez) ─────

  app.put('/estabelecimentos/:id/horarios', async (req) => {
    const eu = exigirLogin(req);
    await exigirEstabelecimento(eu, req.params.id, 'admin');
    const lista = z.array(z.object({
      dia_semana: z.number().int().min(0).max(6), abre: hora, fecha: hora, equipe_id: z.uuid().nullable().optional(),
    })).max(200).parse(req.body);
    for (const h of lista) if (h.fecha <= h.abre) throw invalido(`Horário de ${h.abre} a ${h.fecha} não fecha depois de abrir`);
    return transacao(async (db) => {
      await db.query(`delete from horarios where estabelecimento_id = $1`, [req.params.id]);
      for (const h of lista) {
        await db.query(`insert into horarios (estabelecimento_id, equipe_id, dia_semana, abre, fecha) values ($1, $2, $3, $4, $5)`,
          [req.params.id, h.equipe_id ?? null, h.dia_semana, h.abre, h.fecha]);
      }
      return varios(`select * from horarios where estabelecimento_id = $1 order by dia_semana, abre`, [req.params.id], db);
    });
  });

  // Folga, almoço, feriado. Sem equipe_id fecha o estabelecimento inteiro no período.
  app.post('/estabelecimentos/:id/bloqueios', async (req, reply) => {
    const eu = exigirLogin(req);
    await exigirEstabelecimento(eu, req.params.id, 'equipe');
    const d = z.object({ inicio: z.iso.datetime({ offset: true }), fim: z.iso.datetime({ offset: true }), equipe_id: z.uuid().optional(), motivo: z.string().max(80).optional() }).parse(req.body);
    if (new Date(d.fim) <= new Date(d.inicio)) throw invalido('O fim precisa ser depois do início');
    const b = await um(
      `insert into bloqueios_agenda (estabelecimento_id, equipe_id, periodo, motivo) values ($1, $2, tstzrange($3, $4), $5) returning *`,
      [req.params.id, d.equipe_id ?? null, d.inicio, d.fim, d.motivo ?? null]);
    return reply.status(201).send(b);
  });

  app.delete('/estabelecimentos/:id/bloqueios/:b', async (req) => {
    const eu = exigirLogin(req);
    await exigirEstabelecimento(eu, req.params.id, 'equipe');
    await q(`delete from bloqueios_agenda where id = $1 and estabelecimento_id = $2`, [req.params.b, req.params.id]);
    return { ok: true };
  });

  // ───── Serviços e adicionais ─────

  app.post('/estabelecimentos/:id/servicos', async (req, reply) => {
    const eu = exigirLogin(req);
    await exigirEstabelecimento(eu, req.params.id, 'admin');
    const d = esquemaServico.parse(req.body);
    const ks = Object.keys(d).filter((k) => d[k] !== undefined);
    const s = await um(
      `insert into servicos (estabelecimento_id, ${ks.join(', ')}) values ($1, ${ks.map((_, i) => `$${i + 2}`).join(', ')}) returning *`,
      [req.params.id, ...ks.map((k) => d[k])]);
    return reply.status(201).send(s);
  });

  // Mudar o preço não muda agendamentos já feitos (eles guardam o valor da época).
  app.patch('/servicos/:id', async (req) => {
    const eu = exigirLogin(req);
    const s = await um(`select estabelecimento_id from servicos where id = $1`, [req.params.id]);
    if (!s) throw naoEncontrado('Serviço');
    await exigirEstabelecimento(eu, s.estabelecimento_id, 'admin');
    const d = esquemaServico.partial().parse(req.body);
    const ks = Object.keys(d).filter((k) => d[k] !== undefined);
    if (!ks.length) throw invalido('Nada para mudar');
    return um(`update servicos set ${ks.map((k, i) => `${k} = $${i + 2}`).join(', ')} where id = $1 returning *`, [req.params.id, ...ks.map((k) => d[k])]);
  });

  app.post('/estabelecimentos/:id/adicionais', async (req, reply) => {
    const eu = exigirLogin(req);
    await exigirEstabelecimento(eu, req.params.id, 'admin');
    const d = z.object({ nome: z.string().trim().min(2).max(60), preco: centavos }).parse(req.body);
    return reply.status(201).send(await um(
      `insert into adicionais (estabelecimento_id, nome, preco) values ($1, $2, $3) returning *`, [req.params.id, d.nome, d.preco]));
  });

  app.post('/estabelecimentos/:id/cupons', async (req, reply) => {
    const eu = exigirLogin(req);
    const e = await um(`select plano from estabelecimentos where id = $1`, [req.params.id]);
    await exigirEstabelecimento(eu, req.params.id, 'admin');
    if (e.plano !== 'pro') throw conflito('Cupons e campanhas fazem parte do Parceiro Pro');
    const d = z.object({
      codigo: z.string().toUpperCase().regex(/^[A-Z0-9]{4,20}$/), descricao: z.string().max(80),
      percentual: z.number().int().min(1).max(100).optional(), valor_fixo: centavos.positive().optional(),
      minimo: centavos.default(0), so_primeiro: z.boolean().default(false), usos_max: z.number().int().positive().optional(),
      valido_ate: z.iso.datetime({ offset: true }).optional(),
    }).parse(req.body);
    if (!d.percentual === !d.valor_fixo) throw invalido('Escolha percentual OU valor fixo');
    return reply.status(201).send(await um(
      `insert into cupons (codigo, descricao, estabelecimento_id, percentual, valor_fixo, minimo, so_primeiro, usos_max, valido_ate)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9) returning *`,
      [d.codigo, d.descricao, req.params.id, d.percentual ?? null, d.valor_fixo ?? null, d.minimo, d.so_primeiro, d.usos_max ?? null, d.valido_ate ?? null]));
  });

  // ───── Horários livres para agendar ─────
  // GET /estabelecimentos/:id/horarios-livres?servico=<id>&data=2026-11-14&equipe=<id opcional>
  app.get('/estabelecimentos/:id/horarios-livres', async (req) => {
    const p = z.object({ servico: z.uuid(), data: z.iso.date(), equipe: z.uuid().optional() }).parse(req.query);
    const livres = await horariosLivres({ estabelecimentoId: req.params.id, servicoId: p.servico, data: p.data, equipeId: p.equipe ?? null });
    return livres.map((l) => ({ inicio: l.inicio, fim: l.fim, equipe_livre: l.equipe_livre }));
  });

  // ───── Favoritos ─────

  app.post('/estabelecimentos/:id/favorito', async (req) => {
    const eu = exigirLogin(req);
    await q(`insert into favoritos (perfil_id, estabelecimento_id) values ($1, $2) on conflict do nothing`, [eu, req.params.id]);
    return { ok: true };
  });

  app.delete('/estabelecimentos/:id/favorito', async (req) => {
    const eu = exigirLogin(req);
    await q(`delete from favoritos where perfil_id = $1 and estabelecimento_id = $2`, [eu, req.params.id]);
    return { ok: true };
  });

  // ───── Painel do parceiro ─────

  // Clientes: pets já atendidos, com quantidade de visitas e a última.
  app.get('/estabelecimentos/:id/clientes', async (req) => {
    const eu = exigirLogin(req);
    await exigirEstabelecimento(eu, req.params.id, 'equipe');
    return varios(
      `select pt.id as pet_id, pt.nome as pet, pt.foto_path, p.nome as tutor,
              count(*) filter (where a.status = 'concluido') as visitas,
              max(a.inicio) filter (where a.status = 'concluido') as ultima,
              min(a.inicio) filter (where a.status in ('pendente','confirmado') and a.inicio > now()) as proxima
         from agendamentos a join pets pt on pt.id = a.pet_id join perfis p on p.id = a.tutor_id
        where a.estabelecimento_id = $1
        group by pt.id, p.nome order by ultima desc nulls last`, [req.params.id]);
  });

  // Financeiro do mês: bruto, comissão, líquido e repasses.
  app.get('/estabelecimentos/:id/financeiro', async (req) => {
    const eu = exigirLogin(req);
    await exigirEstabelecimento(eu, req.params.id, 'admin');
    const mes = z.string().regex(/^\d{4}-\d{2}$/).optional().parse(req.query.mes) ?? new Date().toISOString().slice(0, 7);
    const resumo = await um(
      `select coalesce(sum(subtotal - case when c.estabelecimento_id is not null then a.desconto else 0 end), 0) as bruto,
              coalesce(sum(comissao), 0) as comissao,
              coalesce(sum(repasse), 0) as a_receber_pelo_app,
              coalesce(sum(subtotal) filter (where forma_pagamento = 'no_local'), 0) as recebido_no_local,
              count(*) as atendimentos
         from agendamentos a left join cupons c on c.id = a.cupom_id
        where a.estabelecimento_id = $1 and a.status = 'concluido'
          and to_char(a.inicio at time zone 'America/Sao_Paulo', 'YYYY-MM') = $2`, [req.params.id, mes]);
    const repasses = await varios(`select * from repasses where estabelecimento_id = $1 order by previsto_para desc limit 12`, [req.params.id]);
    return { mes, ...resumo, repasses };
  });
}
