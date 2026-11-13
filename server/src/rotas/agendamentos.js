// Agendamentos: o coração do negócio.
//
// Ciclo de vida (o banco também confere, ver migração 002):
//
//   tutor pede ──► pendente ──(estabelecimento aceita)──► confirmado ──(pet chegou)──► em_andamento ──► concluido
//                     │  └──(recusa)──► recusado            │   └──(não veio)──► nao_compareceu
//                     └──(cancela)──► cancelado ◄───────────┘
//
// Se o estabelecimento tem "aceite automático", o pedido já nasce confirmado.
import { z } from 'zod';
import { transacao, um, varios } from '../db.js';
import { exigirLogin } from '../auth.js';
import { exigirTutor, exigirEstabelecimento, acessoNoEstabelecimento, papelNoPet } from '../permissoes.js';
import { naoEncontrado, invalido, conflito, proibido } from '../erros.js';
import { horariosLivres, dataLocal } from '../regras/disponibilidade.js';
import { calcularValores, precoPorPorte } from '../regras/valores.js';
import { notificar, equipeDoEstabelecimento } from '../notificar.js';
import { config } from '../config.js';

// Etapas do acompanhamento ao vivo (tela "Live").
export const ETAPAS = ['Pedido feito', 'Confirmado', 'Leva e traz a caminho', 'Chegou', 'Em atendimento', 'Pronto'];
const ETAPAS_SEM_LEVA = [0, 1, 3, 4, 5];

const ATIVOS = ['pendente', 'confirmado', 'em_andamento'];

const esquemaNovo = z.object({
  pet_id: z.uuid(),
  servico_id: z.uuid(),
  inicio: z.iso.datetime({ offset: true }),
  equipe_id: z.uuid().nullable().optional(),     // vazio = sem preferência
  adicionais: z.array(z.uuid()).max(10).default([]),
  leva_e_traz: z.boolean().default(false),
  endereco_busca: z.string().max(200).optional(),
  observacoes: z.string().max(500).optional(),
  forma_pagamento: z.enum(['pix', 'cartao', 'no_local']),
  cupom: z.string().max(20).optional(),
});

// Valida o cupom para esse tutor e esse pedido. Devolve a linha do cupom ou erro.
async function validarCupom(db, codigo, { tutorId, estabelecimentoId, subtotal }) {
  const c = await um(`select * from cupons where codigo = $1 for update`, [codigo], db);
  if (!c || !c.ativo) throw invalido('Cupom não encontrado');
  if (c.valido_ate && c.valido_ate < new Date()) throw invalido('Esse cupom expirou');
  if (c.usos_max !== null && c.usos >= c.usos_max) throw invalido('Esse cupom esgotou');
  if (c.estabelecimento_id && c.estabelecimento_id !== estabelecimentoId) throw invalido('Esse cupom não vale nesse estabelecimento');
  if (subtotal < c.minimo) throw invalido(`Esse cupom vale a partir de R$ ${(c.minimo / 100).toFixed(2).replace('.', ',')}`);
  if (c.so_primeiro) {
    const antes = await um(`select 1 from agendamentos where tutor_id = $1 and status not in ('cancelado','recusado') limit 1`, [tutorId], db);
    if (antes) throw invalido('Esse cupom é só para o primeiro agendamento');
  }
  const usei = await um(`select 1 from agendamentos where tutor_id = $1 and cupom_id = $2 and status not in ('cancelado','recusado')`, [tutorId, c.id], db);
  if (usei) throw invalido('Você já usou esse cupom');
  return c;
}

// Cria o pagamento. No modo "simulado" Pix e cartão são aprovados na hora;
// em produção, aqui entra a chamada ao gateway (Mercado Pago, Pagar.me, Stripe...)
// e o webhook /pagamentos/webhook confirma depois.
async function criarPagamento(db, ag) {
  if (ag.forma_pagamento === 'no_local') {
    return um(`insert into pagamentos (agendamento_id, perfil_id, forma, valor, status) values ($1, $2, 'no_local', $3, 'no_local') returning *`,
      [ag.id, ag.tutor_id, ag.total], db);
  }
  const simulado = config.pagamentos === 'simulado';
  return um(
    `insert into pagamentos (agendamento_id, perfil_id, forma, valor, status, gateway, gateway_ref, pix_copia_cola, pago_em)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9) returning *`,
    [ag.id, ag.tutor_id, ag.forma_pagamento, ag.total, simulado ? 'pago' : 'aguardando', config.pagamentos,
      `${config.pagamentos}-${ag.id}`, ag.forma_pagamento === 'pix' ? `00020126-netpet-${ag.codigo}` : null, simulado ? new Date() : null], db);
}

// Carrega o agendamento e diz quem é a pessoa nele: 'tutor', 'estabelecimento' ou nada.
async function carregar(db, id, eu, { travar = false } = {}) {
  const a = await um(`select * from agendamentos where id = $1 ${travar ? 'for update' : ''}`, [id], db);
  if (!a) throw naoEncontrado('Agendamento');
  const comoTutor = a.tutor_id === eu || !!(await papelNoPet(eu, a.pet_id, db));
  const acesso = await acessoNoEstabelecimento(eu, a.estabelecimento_id, db);
  if (!comoTutor && !acesso) throw naoEncontrado('Agendamento');
  return { a, comoTutor, acesso };
}

async function registrarEvento(db, agId, etapa, autorId, detalhe = null, fotoPath = null) {
  await db.query(
    `insert into agendamento_eventos (agendamento_id, etapa, titulo, detalhe, foto_path, autor_id) values ($1, $2, $3, $4, $5, $6)`,
    [agId, etapa, ETAPAS[etapa], detalhe, fotoPath, autorId]);
}

async function estornar(db, agId) {
  await db.query(`update pagamentos set status = 'estornado' where agendamento_id = $1 and status = 'pago'`, [agId]);
  // em produção: chamar o estorno no gateway aqui
}

export default async function rotas(app) {
  // Prévia de valores (tela de revisão, antes de confirmar).
  app.post('/agendamentos/previa', async (req) => {
    const eu = exigirLogin(req);
    const d = esquemaNovo.partial({ inicio: true }).parse(req.body);
    return transacao(async (db) => {
      const ctx = await prepararPedido(db, eu, d);
      return { ...ctx.valores, servico: ctx.servico.nome, porte: ctx.pet.porte, cupom: ctx.cupom?.codigo ?? null };
    });
  });

  app.post('/agendamentos', async (req, reply) => {
    const eu = exigirLogin(req);
    const d = esquemaNovo.parse(req.body);
    const ag = await transacao(async (db) => {
      const { pet, servico, estab, valores, cupom, adicionais } = await prepararPedido(db, eu, d);

      const inicio = new Date(d.inicio);
      if (inicio < new Date(Date.now() + estab.antecedencia_min * 60000)) {
        throw invalido(`Agende com pelo menos ${estab.antecedencia_min} minutos de antecedência`);
      }
      // O horário precisa estar na lista de livres (mesma regra que o app mostra).
      const livres = await horariosLivres({
        estabelecimentoId: estab.id, servicoId: servico.id, data: dataLocal(inicio), equipeId: d.equipe_id ?? null,
      }, db);
      const slot = livres.find((l) => l.inicio.getTime() === inicio.getTime());
      if (!slot) throw conflito('Esse horário não está mais livre. Escolha outro.');
      // Sem preferência: fica com o primeiro profissional livre.
      const equipeId = d.equipe_id ?? slot.equipe_livre[0];
      const fim = new Date(inicio.getTime() + servico.duracao_min * 60000);

      const a = await um(
        `insert into agendamentos (tutor_id, pet_id, estabelecimento_id, servico_id, equipe_id, inicio, fim, status, etapa,
            leva_e_traz, endereco_busca, observacoes, servico_nome, porte, subtotal, desconto, taxa_leva_traz, taxa_servico,
            total, comissao, repasse, forma_pagamento, cupom_id)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23) returning *`,
        [eu, pet.id, estab.id, servico.id, equipeId, inicio, fim, estab.aceite_automatico ? 'confirmado' : 'pendente',
          estab.aceite_automatico ? 1 : 0, d.leva_e_traz, d.endereco_busca ?? null, d.observacoes ?? null, servico.nome, pet.porte,
          valores.subtotal, valores.desconto, valores.taxa_leva_traz, valores.taxa_servico, valores.total, valores.comissao,
          valores.repasse, d.forma_pagamento, cupom?.id ?? null], db);
      for (const ad of adicionais) {
        await db.query(`insert into agendamento_adicionais (agendamento_id, adicional_id, nome, preco) values ($1, $2, $3, $4)`, [a.id, ad.id, ad.nome, ad.preco]);
      }
      await registrarEvento(db, a.id, 0, eu);
      if (estab.aceite_automatico) await registrarEvento(db, a.id, 1, null, 'Confirmado automaticamente');
      const pagamento = await criarPagamento(db, a);

      // Conversa com o estabelecimento ligada ao agendamento.
      const conversa = await um(`insert into conversas (estabelecimento_id, agendamento_id) values ($1, $2) returning id`, [estab.id, a.id], db);
      await db.query(`insert into conversa_membros (conversa_id, perfil_id) values ($1, $2)`, [conversa.id, eu]);

      await notificar(db, await equipeDoEstabelecimento(db, estab.id), {
        grupo: 'agendamentos', icone: 'bell',
        titulo: estab.aceite_automatico ? `Novo agendamento: ${pet.nome}` : `Novo pedido: ${pet.nome}`,
        texto: `${servico.nome} · ${inicio.toLocaleString('pt-BR', { timeZone: config.fuso, dateStyle: 'short', timeStyle: 'short' })}`,
        destino: ['PartnerRequest', { id: a.id }],
      });
      return { ...a, adicionais, pagamento: { status: pagamento.status, pix_copia_cola: pagamento.pix_copia_cola } };
    });
    return reply.status(201).send(ag);
  });

  // Meus agendamentos (como tutor). ?quando=proximos|passados
  app.get('/agendamentos', async (req) => {
    const eu = exigirLogin(req);
    const passados = req.query.quando === 'passados';
    return varios(
      `select a.*, e.nome as estabelecimento, e.logo_path, e.cor as estabelecimento_cor, pt.nome as pet, pt.foto_path as pet_foto,
              eq.nome as profissional, av.nota as minha_nota
         from agendamentos a
         join estabelecimentos e on e.id = a.estabelecimento_id
         join pets pt on pt.id = a.pet_id
         left join equipe_estabelecimento eq on eq.id = a.equipe_id
         left join avaliacoes av on av.agendamento_id = a.id
        where (a.tutor_id = $1 or a.pet_id in (select pet_id from pet_tutores where perfil_id = $1))
          and ${passados ? `(a.status not in ('pendente','confirmado','em_andamento'))` : `a.status in ('pendente','confirmado','em_andamento')`}
        order by a.inicio ${passados ? 'desc' : 'asc'} limit 100`, [eu]);
  });

  app.get('/agendamentos/:id', async (req) => {
    const eu = exigirLogin(req);
    const { a, acesso } = await carregar(undefined, req.params.id, eu);
    const [eventos, adicionais, pagamento, estab, pet, profissional, conversa] = await Promise.all([
      varios(`select etapa, titulo, detalhe, foto_path, criado_em from agendamento_eventos where agendamento_id = $1 order by criado_em`, [a.id]),
      varios(`select nome, preco from agendamento_adicionais where agendamento_id = $1`, [a.id]),
      um(`select forma, valor, status, pix_copia_cola, pago_em from pagamentos where agendamento_id = $1 order by criado_em desc limit 1`, [a.id]),
      um(`select id, nome, endereco, bairro, telefone, logo_path, cor, cancelamento_horas from estabelecimentos where id = $1`, [a.estabelecimento_id]),
      um(`select id, nome, especie, raca, porte, foto_path, cor from pets where id = $1`, [a.pet_id]),
      a.equipe_id ? um(`select id, nome, funcao from equipe_estabelecimento where id = $1`, [a.equipe_id]) : null,
      um(`select id from conversas where agendamento_id = $1`, [a.id]),
    ]);
    // Para a equipe: o que ela precisa saber do pet (alergias).
    const alergias = acesso ? await varios(`select texto from alergias where pet_id = $1`, [a.pet_id]) : undefined;
    if (!acesso) { delete a.comissao; delete a.repasse; }
    return {
      ...a, etapas: a.leva_e_traz ? ETAPAS : ETAPAS_SEM_LEVA.map((i) => ETAPAS[i]),
      eventos, adicionais, pagamento, estabelecimento: estab, pet, profissional, conversa_id: conversa?.id ?? null, alergias,
      pode_cancelar_gratis: a.inicio.getTime() - Date.now() > estab.cancelamento_horas * 3600000,
    };
  });

  // Estabelecimento aceita ou recusa um pedido pendente.
  app.post('/agendamentos/:id/responder', async (req) => {
    const eu = exigirLogin(req);
    const d = z.object({ aceitar: z.boolean(), equipe_id: z.uuid().optional(), motivo: z.string().max(200).optional() }).parse(req.body);
    return transacao(async (db) => {
      const { a, acesso } = await carregar(db, req.params.id, eu, { travar: true });
      if (!acesso) throw proibido('Só o estabelecimento responde pedidos');
      if (a.status !== 'pendente') throw conflito('Esse pedido já foi respondido');
      if (!d.aceitar) {
        await db.query(`update agendamentos set status = 'recusado', motivo_cancelamento = $2, cancelado_por = $3 where id = $1`, [a.id, d.motivo ?? null, eu]);
        await estornar(db, a.id);
        await notificar(db, a.tutor_id, { grupo: 'agendamentos', icone: 'x', titulo: 'Pedido recusado', texto: d.motivo ?? 'O estabelecimento não pode nesse horário. O valor foi estornado.', destino: ['BookingDetail', { id: a.id }] });
      } else {
        if (d.equipe_id) {
          const m = await um(`select 1 from equipe_estabelecimento where id = $1 and estabelecimento_id = $2 and ativo`, [d.equipe_id, a.estabelecimento_id], db);
          if (!m) throw invalido('Profissional não é desse estabelecimento');
        }
        await db.query(`update agendamentos set status = 'confirmado', etapa = 1, equipe_id = coalesce($2, equipe_id) where id = $1`, [a.id, d.equipe_id ?? null]);
        await registrarEvento(db, a.id, 1, eu);
        await notificar(db, a.tutor_id, { grupo: 'agendamentos', icone: 'check', titulo: 'Agendamento confirmado', texto: a.servico_nome, destino: ['BookingDetail', { id: a.id }] });
      }
      return um(`select * from agendamentos where id = $1`, [a.id], db);
    });
  });

  // Estabelecimento avança o acompanhamento ao vivo (uma etapa por vez).
  app.post('/agendamentos/:id/avancar', async (req) => {
    const eu = exigirLogin(req);
    const d = z.object({ detalhe: z.string().max(200).optional(), foto_path: z.string().max(300).optional() }).parse(req.body ?? {});
    return transacao(async (db) => {
      const { a, acesso } = await carregar(db, req.params.id, eu, { travar: true });
      if (!acesso) throw proibido('Só o estabelecimento atualiza o atendimento');
      if (!['confirmado', 'em_andamento'].includes(a.status)) throw conflito('O atendimento não está em andamento');
      let prox = a.etapa + 1;
      if (prox === 2 && !a.leva_e_traz) prox = 3; // sem leva e traz pula "a caminho"
      const status = prox >= 5 ? 'concluido' : 'em_andamento';
      await db.query(`update agendamentos set etapa = $2, status = $3 where id = $1`, [a.id, prox, status]);
      await registrarEvento(db, a.id, prox, eu, d.detalhe ?? null, d.foto_path ?? null);
      if (status === 'concluido') {
        // Entra no histórico da carteirinha do pet.
        await db.query(
          `insert into registros_saude (pet_id, data, titulo, estabelecimento_id, agendamento_id, registrado_por)
           values ($1, ($2::timestamptz at time zone $5)::date, $3, $4, $6, $7)`,
          [a.pet_id, a.inicio, a.servico_nome, a.estabelecimento_id, config.fuso, a.id, eu]);
      }
      const pet = await um(`select nome from pets where id = $1`, [a.pet_id], db);
      await notificar(db, a.tutor_id, {
        grupo: 'agendamentos', icone: 'drop',
        titulo: status === 'concluido' ? `${pet.nome} está pronto!` : `${pet.nome}: ${ETAPAS[prox].toLowerCase()}`,
        texto: d.detalhe ?? (status === 'concluido' ? 'Conte como foi e avalie o atendimento.' : null),
        destino: status === 'concluido' ? ['Review', { id: a.id }] : ['Live', { id: a.id }],
      });
      return um(`select * from agendamentos where id = $1`, [a.id], db);
    });
  });

  // Cancelar. Tutor: grátis até X horas antes (definido pelo estabelecimento); depois disso,
  // o valor pago não volta. Estabelecimento: pode cancelar sempre, e o tutor recebe tudo de volta.
  app.post('/agendamentos/:id/cancelar', async (req) => {
    const eu = exigirLogin(req);
    const d = z.object({ motivo: z.string().max(200).optional() }).parse(req.body ?? {});
    return transacao(async (db) => {
      const { a, comoTutor, acesso } = await carregar(db, req.params.id, eu, { travar: true });
      if (!['pendente', 'confirmado'].includes(a.status)) throw conflito('Esse agendamento não pode mais ser cancelado');
      const estab = await um(`select nome, cancelamento_horas from estabelecimentos where id = $1`, [a.estabelecimento_id], db);
      const pelaLoja = !!acesso && !comoTutor;
      if (pelaLoja && !d.motivo) throw invalido('Conte ao tutor o motivo do cancelamento');
      const noPrazo = a.status === 'pendente' || a.inicio.getTime() - Date.now() > estab.cancelamento_horas * 3600000;
      const reembolso = pelaLoja || noPrazo;
      await db.query(`update agendamentos set status = 'cancelado', motivo_cancelamento = $2, cancelado_por = $3 where id = $1`, [a.id, d.motivo ?? null, eu]);
      await registrarEvento(db, a.id, a.etapa, eu, `Cancelado${d.motivo ? `: ${d.motivo}` : ''}`);
      if (reembolso) await estornar(db, a.id);
      if (pelaLoja) {
        await notificar(db, a.tutor_id, { grupo: 'agendamentos', icone: 'x', titulo: `${estab.nome} cancelou o agendamento`, texto: d.motivo, destino: ['BookingDetail', { id: a.id }] });
      } else {
        await notificar(db, await equipeDoEstabelecimento(db, a.estabelecimento_id), { grupo: 'agendamentos', icone: 'x', titulo: 'Agendamento cancelado pelo tutor', texto: a.servico_nome, destino: ['PartnerRequest', { id: a.id }] });
      }
      return { ok: true, reembolso };
    });
  });

  // Tutor não apareceu (só depois do horário marcado).
  app.post('/agendamentos/:id/nao-compareceu', async (req) => {
    const eu = exigirLogin(req);
    return transacao(async (db) => {
      const { a, acesso } = await carregar(db, req.params.id, eu, { travar: true });
      if (!acesso) throw proibido();
      if (a.status !== 'confirmado') throw conflito('Só agendamentos confirmados');
      if (a.inicio > new Date()) throw conflito('Espere o horário marcado');
      await db.query(`update agendamentos set status = 'nao_compareceu' where id = $1`, [a.id]);
      return { ok: true };
    });
  });

  // Remarcar = cancelar este (sem custo, se no prazo) e criar outro. O app faz as duas chamadas.

  // Avaliar (tutor, uma vez, depois de concluído).
  app.post('/agendamentos/:id/avaliar', async (req, reply) => {
    const eu = exigirLogin(req);
    const d = z.object({ nota: z.number().int().min(1).max(5), texto: z.string().max(1000).optional() }).parse(req.body);
    const r = await transacao(async (db) => {
      const { a, comoTutor } = await carregar(db, req.params.id, eu);
      if (!comoTutor) throw proibido('Só o tutor avalia');
      if (a.status !== 'concluido') throw conflito('Avalie depois do atendimento');
      return um(`insert into avaliacoes (agendamento_id, estabelecimento_id, autor_id, nota, texto) values ($1, $2, $3, $4, $5) returning *`,
        [a.id, a.estabelecimento_id, eu, d.nota, d.texto ?? null], db);
    });
    return reply.status(201).send(r);
  });

  app.post('/avaliacoes/:id/responder', async (req) => {
    const eu = exigirLogin(req);
    const { resposta } = z.object({ resposta: z.string().min(1).max(600) }).parse(req.body);
    const av = await um(`select * from avaliacoes where id = $1`, [req.params.id]);
    if (!av) throw naoEncontrado('Avaliação');
    await exigirEstabelecimento(eu, av.estabelecimento_id, 'admin');
    return um(`update avaliacoes set resposta = $2, respondida_em = now() where id = $1 returning *`, [av.id, resposta]);
  });

  // Agenda do estabelecimento num dia (aba Hoje / Agenda do modo parceiro).
  app.get('/estabelecimentos/:id/agenda', async (req) => {
    const eu = exigirLogin(req);
    await exigirEstabelecimento(eu, req.params.id, 'equipe');
    const data = z.iso.date().optional().parse(req.query.data) ?? dataLocal(new Date());
    return varios(
      `select a.id, a.codigo, a.inicio, a.fim, a.status, a.etapa, a.servico_nome, a.observacoes, a.leva_e_traz, a.total,
              a.forma_pagamento, a.equipe_id, eq.nome as profissional,
              pt.id as pet_id, pt.nome as pet, pt.foto_path as pet_foto, pt.porte, pr.nome as tutor,
              (select string_agg(texto, ' · ') from alergias al where al.pet_id = pt.id) as alergias
         from agendamentos a
         join pets pt on pt.id = a.pet_id join perfis pr on pr.id = a.tutor_id
         left join equipe_estabelecimento eq on eq.id = a.equipe_id
        where a.estabelecimento_id = $1 and (a.inicio at time zone $3)::date = $2::date
          and a.status not in ('cancelado', 'recusado')
        order by a.inicio`, [req.params.id, data, config.fuso]);
  });

  // Pedidos aguardando resposta.
  app.get('/estabelecimentos/:id/pedidos', async (req) => {
    const eu = exigirLogin(req);
    await exigirEstabelecimento(eu, req.params.id, 'equipe');
    return varios(
      `select a.id, a.inicio, a.servico_nome, a.observacoes, a.subtotal, a.criado_em, pt.nome as pet, pt.foto_path as pet_foto, pr.nome as tutor
         from agendamentos a join pets pt on pt.id = a.pet_id join perfis pr on pr.id = a.tutor_id
        where a.estabelecimento_id = $1 and a.status = 'pendente' order by a.inicio`, [req.params.id]);
  });
}

// Junta e valida tudo o que um pedido precisa (usado na prévia e na criação).
async function prepararPedido(db, eu, d) {
  await exigirTutor(eu, d.pet_id, {}, db);
  const pet = await um(`select * from pets where id = $1`, [d.pet_id], db);
  const servico = await um(`select * from servicos where id = $1 and ativo`, [d.servico_id], db);
  if (!servico) throw naoEncontrado('Serviço');
  const estab = await um(`select * from estabelecimentos where id = $1 and ativo`, [servico.estabelecimento_id], db);
  if (!estab) throw naoEncontrado('Estabelecimento');
  if (!servico.especies.includes(pet.especie)) throw invalido(`Esse serviço não atende ${pet.especie === 'gato' ? 'gatos' : 'essa espécie'}`);
  if (d.leva_e_traz && !estab.leva_e_traz) throw invalido('Esse estabelecimento não tem leva e traz');
  if (d.leva_e_traz && !d.endereco_busca) {
    const p = await um(`select endereco from perfis where id = $1`, [eu], db);
    if (!p.endereco) throw invalido('Informe o endereço para o leva e traz');
    d.endereco_busca = p.endereco;
  }
  if (d.equipe_id) {
    const m = await um(`select 1 from equipe_estabelecimento where id = $1 and estabelecimento_id = $2 and atende and ativo`, [d.equipe_id, estab.id], db);
    if (!m) throw invalido('Esse profissional não atende aqui');
  }
  const adicionais = d.adicionais?.length
    ? await varios(`select id, nome, preco from adicionais where id = any($1) and estabelecimento_id = $2 and ativo`, [d.adicionais, estab.id], db)
    : [];
  if (adicionais.length !== (d.adicionais?.length ?? 0)) throw invalido('Algum adicional não existe nesse estabelecimento');
  const subtotal = precoPorPorte(servico, pet.porte) + adicionais.reduce((s, a) => s + a.preco, 0);
  const cupom = d.cupom ? await validarCupom(db, d.cupom.toUpperCase(), { tutorId: eu, estabelecimentoId: estab.id, subtotal }) : null;
  const plus = await um(`select 1 from assinaturas where perfil_id = $1 and plano = 'netpet_plus' and status = 'ativa'`, [eu], db);
  const valores = calcularValores({
    servico, porte: pet.porte, adicionais, cupom, levaETraz: d.leva_e_traz ? estab.taxa_leva_traz : 0,
    assinantePlus: !!plus, planoParceiro: estab.plano, forma: d.forma_pagamento ?? 'pix',
  });
  return { pet, servico, estab, adicionais, cupom, valores };
}
