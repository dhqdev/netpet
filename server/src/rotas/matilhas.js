// Matilhas (comunidades com canais) e mensagens diretas.
import { z } from 'zod';
import { transacao, um, varios, q } from '../db.js';
import { exigirLogin } from '../auth.js';
import { exigirTutor, exigirEstabelecimento, acessoNoEstabelecimento, bloqueado } from '../permissoes.js';
import { naoEncontrado, proibido, conflito, invalido } from '../erros.js';
import { notificar } from '../notificar.js';

const CANAIS_PADRAO = [
  { slug: 'avisos', nome: 'avisos', so_moderadores: true },
  { slug: 'fotos', nome: 'fotos' },
  { slug: 'dicas', nome: 'dicas' },
  { slug: 'perdidos', nome: 'perdidos', alerta: true },
  { slug: 'encontros', nome: 'encontros' },
];

async function papelNaMatilha(eu, matilhaId, db) {
  const r = await um(`select papel from matilha_membros where matilha_id = $1 and perfil_id = $2`, [matilhaId, eu], db);
  return r?.papel ?? null;
}

// Canal + matilha + meu papel. Matilha privada só para membros.
async function acessarCanal(eu, canalId, db) {
  const c = await um(`select c.*, m.publica from canais c join matilhas m on m.id = c.matilha_id where c.id = $1`, [canalId], db);
  if (!c) throw naoEncontrado('Canal');
  const papel = await papelNaMatilha(eu, c.matilha_id, db);
  if (!c.publica && !papel) throw naoEncontrado('Canal');
  return { canal: c, papel };
}

export default async function rotas(app) {
  // Minhas matilhas com canais e não lidas.
  app.get('/matilhas', async (req) => {
    const eu = exigirLogin(req);
    return varios(
      `select m.*, mm.papel,
              (select json_agg(json_build_object('id', c.id, 'slug', c.slug, 'nome', c.nome, 'so_moderadores', c.so_moderadores, 'alerta', c.alerta,
                 'nao_lidas', (select count(*) from mensagens_canal x where x.canal_id = c.id and x.autor_id <> $1
                                 and x.criado_em > coalesce((select lido_em from leituras_canal l where l.canal_id = c.id and l.perfil_id = $1), mm.criado_em)))
                 order by c.ordem) from canais c where c.matilha_id = m.id) as canais
         from matilha_membros mm join matilhas m on m.id = mm.matilha_id
        where mm.perfil_id = $1 order by mm.criado_em`, [eu]);
  });

  // Descobrir matilhas públicas em que não estou. ?tipo=raca|bairro|interesse&busca=
  app.get('/matilhas/descobrir', async (req) => {
    const eu = exigirLogin(req);
    return varios(
      `select m.* from matilhas m
        where m.publica and not exists (select 1 from matilha_membros mm where mm.matilha_id = m.id and mm.perfil_id = $1)
          and ($2::tipo_matilha is null or m.tipo = $2) and ($3::text is null or m.nome ilike '%' || $3 || '%')
        order by m.membros desc limit 30`, [eu, req.query.tipo ?? null, req.query.busca ?? null]);
  });

  app.post('/matilhas', async (req, reply) => {
    const eu = exigirLogin(req);
    const d = z.object({
      nome: z.string().trim().min(3).max(50), tipo: z.enum(['raca', 'bairro', 'interesse']),
      descricao: z.string().max(300).optional(), cor: z.string().optional(), publica: z.boolean().default(true),
    }).parse(req.body);
    const base = d.nome.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const m = await transacao(async (db) => {
      let slug = base;
      for (let i = 2; await um(`select 1 from matilhas where slug = $1`, [slug], db); i++) slug = `${base}-${i}`;
      const mt = await um(`insert into matilhas (slug, nome, tipo, descricao, cor, publica, criado_por) values ($1,$2,$3,$4,$5,$6,$7) returning *`,
        [slug, d.nome, d.tipo, d.descricao ?? null, d.cor ?? null, d.publica, eu], db);
      await db.query(`insert into matilha_membros (matilha_id, perfil_id, papel) values ($1, $2, 'dono')`, [mt.id, eu]);
      for (const [i, c] of CANAIS_PADRAO.entries()) {
        await db.query(`insert into canais (matilha_id, slug, nome, so_moderadores, alerta, ordem) values ($1,$2,$3,$4,$5,$6)`,
          [mt.id, c.slug, c.nome, !!c.so_moderadores, !!c.alerta, i]);
      }
      return mt;
    });
    return reply.status(201).send(m);
  });

  app.post('/matilhas/:id/entrar', async (req) => {
    const eu = exigirLogin(req);
    const m = await um(`select * from matilhas where id = $1`, [req.params.id]);
    if (!m || !m.publica) throw naoEncontrado('Matilha'); // privada: só por convite de moderador
    await q(`insert into matilha_membros (matilha_id, perfil_id) values ($1, $2) on conflict do nothing`, [m.id, eu]);
    return { ok: true };
  });

  app.post('/matilhas/:id/sair', async (req) => {
    const eu = exigirLogin(req);
    const papel = await papelNaMatilha(eu, req.params.id);
    if (papel === 'dono') throw conflito('Passe a matilha para outra pessoa antes de sair');
    await q(`delete from matilha_membros where matilha_id = $1 and perfil_id = $2`, [req.params.id, eu]);
    return { ok: true };
  });

  // Moderação: dono/moderador convida, promove ou remove membros.
  app.put('/matilhas/:id/membros/:perfil', async (req) => {
    const eu = exigirLogin(req);
    const meu = await papelNaMatilha(eu, req.params.id);
    if (!['dono', 'moderador'].includes(meu)) throw proibido('Só moderadores');
    const { papel } = z.object({ papel: z.enum(['moderador', 'membro']) }).parse(req.body);
    if (papel === 'moderador' && meu !== 'dono') throw proibido('Só o dono nomeia moderadores');
    await q(`insert into matilha_membros (matilha_id, perfil_id, papel) values ($1, $2, $3)
             on conflict (matilha_id, perfil_id) do update set papel = excluded.papel where matilha_membros.papel <> 'dono'`,
      [req.params.id, req.params.perfil, papel]);
    return { ok: true };
  });

  app.delete('/matilhas/:id/membros/:perfil', async (req) => {
    const eu = exigirLogin(req);
    const meu = await papelNaMatilha(eu, req.params.id);
    const alvo = await papelNaMatilha(req.params.perfil, req.params.id);
    if (!['dono', 'moderador'].includes(meu) || alvo === 'dono' || (alvo === 'moderador' && meu !== 'dono')) throw proibido();
    await q(`delete from matilha_membros where matilha_id = $1 and perfil_id = $2`, [req.params.id, req.params.perfil]);
    return { ok: true };
  });

  // Mensagens de um canal (mais novas primeiro). ?antes=<data> para paginar, ?fio=<id> para respostas.
  app.get('/canais/:id/mensagens', async (req) => {
    const eu = exigirLogin(req);
    await acessarCanal(eu, req.params.id);
    const antes = req.query.antes ? new Date(req.query.antes) : new Date(Date.now() + 1000);
    return varios(
      `select mc.*, pr.nome as autor_nome, pt.nome as pet_nome, pt.foto_path as pet_foto,
              e.nome as estabelecimento_nome, e.verificado as estabelecimento_verificado, mm.papel as autor_papel,
              (select count(*) from mensagens_canal r where r.resposta_a = mc.id) as respostas,
              coalesce((select json_agg(json_build_object('emoji', emoji, 'total', n, 'eu', eu)) from (
                 select emoji, count(*) n, bool_or(perfil_id = $1) eu from reacoes where mensagem_id = mc.id group by emoji) r), '[]') as reacoes
         from mensagens_canal mc join perfis pr on pr.id = mc.autor_id
         join canais c on c.id = mc.canal_id
         left join matilha_membros mm on mm.matilha_id = c.matilha_id and mm.perfil_id = mc.autor_id
         left join pets pt on pt.id = mc.pet_id left join estabelecimentos e on e.id = mc.estabelecimento_id
        where mc.canal_id = $2 and mc.criado_em < $3
          and ${req.query.fio ? 'mc.resposta_a = $4' : 'mc.resposta_a is null and ($4::uuid is null)'}
          and not exists (select 1 from bloqueios b where (b.quem = $1 and b.bloqueado = mc.autor_id) or (b.quem = mc.autor_id and b.bloqueado = $1))
        order by mc.criado_em desc limit 50`, [eu, req.params.id, antes, req.query.fio ?? null]);
  });

  app.post('/canais/:id/mensagens', async (req, reply) => {
    const eu = exigirLogin(req);
    const d = z.object({
      texto: z.string().trim().max(4000).optional(), foto_path: z.string().max(300).optional(),
      pet_id: z.uuid().optional(), estabelecimento_id: z.uuid().optional(), resposta_a: z.uuid().optional(),
    }).parse(req.body);
    if (!d.texto && !d.foto_path) throw invalido('Mensagem vazia');
    const { canal, papel } = await acessarCanal(eu, req.params.id);
    if (!papel) throw proibido('Entre na matilha para conversar');
    if (canal.so_moderadores && !['dono', 'moderador'].includes(papel)) throw proibido('Só moderadores postam em #' + canal.nome);
    if (d.pet_id) await exigirTutor(eu, d.pet_id);
    // Falar "como estabelecimento" mostra o selo de verificado (ex.: veterinária).
    if (d.estabelecimento_id) await exigirEstabelecimento(eu, d.estabelecimento_id, 'equipe');
    const m = await um(
      `insert into mensagens_canal (canal_id, autor_id, pet_id, estabelecimento_id, resposta_a, texto, foto_path) values ($1,$2,$3,$4,$5,$6,$7) returning *`,
      [canal.id, eu, d.pet_id ?? null, d.estabelecimento_id ?? null, d.resposta_a ?? null, d.texto ?? null, d.foto_path ?? null]);
    if (canal.alerta) {
      const membros = await varios(`select perfil_id from matilha_membros where matilha_id = $1 and perfil_id <> $2`, [canal.matilha_id, eu]);
      await notificar(undefined, membros.map((x) => x.perfil_id), { grupo: 'perdidos', icone: 'alert', titulo: `#${canal.nome}`, texto: d.texto?.slice(0, 100), destino: ['Channel', { canal: canal.id }] });
    }
    return reply.status(201).send(m);
  });

  app.post('/mensagens-canal/:id/fixar', async (req) => {
    const eu = exigirLogin(req);
    const m = await um(`select mc.id, c.matilha_id from mensagens_canal mc join canais c on c.id = mc.canal_id where mc.id = $1`, [req.params.id]);
    if (!m) throw naoEncontrado('Mensagem');
    if (!['dono', 'moderador'].includes(await papelNaMatilha(eu, m.matilha_id))) throw proibido('Só moderadores fixam mensagens');
    const { fixada } = z.object({ fixada: z.boolean() }).parse(req.body);
    await q(`update mensagens_canal set fixada = $2 where id = $1`, [m.id, fixada]);
    return { ok: true };
  });

  app.delete('/mensagens-canal/:id', async (req) => {
    const eu = exigirLogin(req);
    const m = await um(`select mc.id, mc.autor_id, c.matilha_id from mensagens_canal mc join canais c on c.id = mc.canal_id where mc.id = $1`, [req.params.id]);
    if (!m) throw naoEncontrado('Mensagem');
    if (m.autor_id !== eu && !['dono', 'moderador'].includes(await papelNaMatilha(eu, m.matilha_id))) throw proibido();
    await q(`delete from mensagens_canal where id = $1`, [m.id]);
    return { ok: true };
  });

  app.post('/mensagens-canal/:id/reacoes', async (req) => {
    const eu = exigirLogin(req);
    const { emoji } = z.object({ emoji: z.string().min(1).max(16) }).parse(req.body);
    const m = await um(`select canal_id from mensagens_canal where id = $1`, [req.params.id]);
    if (!m) throw naoEncontrado('Mensagem');
    const { papel } = await acessarCanal(eu, m.canal_id);
    if (!papel) throw proibido('Entre na matilha para reagir');
    // Toque de novo tira a reação.
    const r = await q(`delete from reacoes where mensagem_id = $1 and perfil_id = $2 and emoji = $3`, [req.params.id, eu, emoji]);
    if (!r.rowCount) await q(`insert into reacoes (mensagem_id, perfil_id, emoji) values ($1, $2, $3)`, [req.params.id, eu, emoji]);
    return { ok: true, reagiu: !r.rowCount };
  });

  app.post('/canais/:id/lido', async (req) => {
    const eu = exigirLogin(req);
    await acessarCanal(eu, req.params.id);
    await q(`insert into leituras_canal (canal_id, perfil_id) values ($1, $2) on conflict (canal_id, perfil_id) do update set lido_em = now()`, [req.params.id, eu]);
    return { ok: true };
  });

  // ───────────── Mensagens diretas ─────────────
  // Conversa com pessoa (perfil_id) ou com estabelecimento (estabelecimento_id).
  // Na conversa com estabelecimento, toda a equipe com acesso responde.

  async function acessarConversa(eu, id, db) {
    const c = await um(`select * from conversas where id = $1`, [id], db);
    if (!c) throw naoEncontrado('Conversa');
    const membro = await um(`select 1 from conversa_membros where conversa_id = $1 and perfil_id = $2`, [id, eu], db);
    const equipe = c.estabelecimento_id ? await acessoNoEstabelecimento(eu, c.estabelecimento_id, db) : null;
    if (!membro && !equipe) throw naoEncontrado('Conversa');
    return { conversa: c, comoEquipe: !membro && !!equipe };
  }

  app.get('/conversas', async (req) => {
    const eu = exigirLogin(req);
    // ?estabelecimento=<id> lista as conversas da caixa do estabelecimento (modo parceiro).
    if (req.query.estabelecimento) await exigirEstabelecimento(eu, req.query.estabelecimento, 'equipe');
    return varios(
      `select c.id, c.estabelecimento_id, c.agendamento_id, c.ultima_em,
              e.nome as estabelecimento_nome, e.logo_path, e.verificado,
              (select json_agg(json_build_object('id', p.id, 'nome', p.nome, 'foto_path', p.foto_path))
                 from conversa_membros cm join perfis p on p.id = cm.perfil_id where cm.conversa_id = c.id and cm.perfil_id <> $1) as pessoas,
              (select json_build_object('texto', m.texto, 'autor_id', m.autor_id, 'criado_em', m.criado_em)
                 from mensagens m where m.conversa_id = c.id order by m.criado_em desc limit 1) as ultima,
              (select count(*) from mensagens m where m.conversa_id = c.id and m.autor_id <> $1
                  and m.criado_em > coalesce((select lido_em from conversa_membros where conversa_id = c.id and perfil_id = $1), '-infinity')) as nao_lidas
         from conversas c left join estabelecimentos e on e.id = c.estabelecimento_id
        where ${req.query.estabelecimento ? 'c.estabelecimento_id = $2' : 'exists (select 1 from conversa_membros cm where cm.conversa_id = c.id and cm.perfil_id = $1) and $2::uuid is null'}
          and exists (select 1 from mensagens m where m.conversa_id = c.id)
        order by c.ultima_em desc limit 100`, [eu, req.query.estabelecimento ?? null]);
  });

  // Abre (ou reaproveita) uma conversa.
  app.post('/conversas', async (req) => {
    const eu = exigirLogin(req);
    const d = z.object({ perfil_id: z.uuid().optional(), estabelecimento_id: z.uuid().optional() }).parse(req.body);
    if (!d.perfil_id === !d.estabelecimento_id) throw invalido('Escolha uma pessoa OU um estabelecimento');
    if (d.perfil_id === eu) throw invalido('Conversa com você mesmo?');
    if (d.perfil_id && (await bloqueado(eu, d.perfil_id))) throw naoEncontrado('Perfil');
    return transacao(async (db) => {
      const existente = d.estabelecimento_id
        ? await um(`select c.id from conversas c join conversa_membros m on m.conversa_id = c.id and m.perfil_id = $1
                     where c.estabelecimento_id = $2 and c.agendamento_id is null limit 1`, [eu, d.estabelecimento_id], db)
        : await um(`select c.id from conversas c where c.estabelecimento_id is null
                     and exists (select 1 from conversa_membros where conversa_id = c.id and perfil_id = $1)
                     and exists (select 1 from conversa_membros where conversa_id = c.id and perfil_id = $2)`, [eu, d.perfil_id], db);
      if (existente) return existente;
      const c = await um(`insert into conversas (estabelecimento_id) values ($1) returning id`, [d.estabelecimento_id ?? null], db);
      await db.query(`insert into conversa_membros (conversa_id, perfil_id) values ($1, $2)`, [c.id, eu]);
      if (d.perfil_id) await db.query(`insert into conversa_membros (conversa_id, perfil_id) values ($1, $2)`, [c.id, d.perfil_id]);
      return c;
    });
  });

  app.get('/conversas/:id/mensagens', async (req) => {
    const eu = exigirLogin(req);
    const { conversa, comoEquipe } = await acessarConversa(eu, req.params.id);
    if (!comoEquipe) await q(`update conversa_membros set lido_em = now() where conversa_id = $1 and perfil_id = $2`, [conversa.id, eu]);
    const antes = req.query.antes ? new Date(req.query.antes) : new Date(Date.now() + 1000);
    return varios(
      `select m.*, p.nome as autor_nome, (m.autor_id = $1) as minha,
              exists (select 1 from equipe_estabelecimento e where e.estabelecimento_id = $3 and e.perfil_id = m.autor_id and e.acesso is not null) as da_equipe
         from mensagens m join perfis p on p.id = m.autor_id
        where m.conversa_id = $2 and m.criado_em < $4 order by m.criado_em desc limit 50`,
      [eu, conversa.id, conversa.estabelecimento_id, antes]);
  });

  app.post('/conversas/:id/mensagens', async (req, reply) => {
    const eu = exigirLogin(req);
    const d = z.object({ texto: z.string().trim().max(4000).optional(), midia_path: z.string().max(300).optional() }).parse(req.body);
    if (!d.texto && !d.midia_path) throw invalido('Mensagem vazia');
    const { conversa, comoEquipe } = await acessarConversa(eu, req.params.id);
    const outros = await varios(`select perfil_id from conversa_membros where conversa_id = $1 and perfil_id <> $2`, [conversa.id, eu]);
    for (const o of outros) if (await bloqueado(eu, o.perfil_id)) throw proibido('Não é possível enviar para essa pessoa');
    const m = await um(`insert into mensagens (conversa_id, autor_id, texto, midia_path) values ($1,$2,$3,$4) returning *`,
      [conversa.id, eu, d.texto ?? null, d.midia_path ?? null]);
    const remetente = comoEquipe
      ? (await um(`select nome from estabelecimentos where id = $1`, [conversa.estabelecimento_id])).nome
      : (await um(`select nome from perfis where id = $1`, [eu])).nome;
    let destinatarios = outros.map((o) => o.perfil_id);
    if (!comoEquipe && conversa.estabelecimento_id) {
      const eq = await varios(`select perfil_id from equipe_estabelecimento where estabelecimento_id = $1 and acesso is not null and ativo and perfil_id <> $2`, [conversa.estabelecimento_id, eu]);
      destinatarios = destinatarios.concat(eq.map((x) => x.perfil_id));
    }
    await notificar(undefined, destinatarios, { grupo: 'comentarios', icone: 'chat', titulo: remetente, texto: d.texto?.slice(0, 100) ?? 'Foto', destino: ['DM', { id: conversa.id }] });
    return reply.status(201).send(m);
  });
}
