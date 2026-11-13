// Carteirinha do pet: vacinas, remédios, peso, alergias, histórico, documentos e rotina.
//
// Quem vê: os tutores (dono e família); o estabelecimento que atendeu o pet no último ano
// (se a privacidade do dono permitir "parceiros"); todo mundo se o dono escolher "todos".
// Quem lança: os tutores; e o estabelecimento que atendeu — nesse caso a vacina sai "verificada".
import { z } from 'zod';
import { um, varios, q } from '../db.js';
import { exigirLogin } from '../auth.js';
import { papelNoPet, estabelecimentoAtendePet } from '../permissoes.js';
import { naoEncontrado, proibido } from '../erros.js';

async function acessoCarteirinha(eu, petId, { escrever = false } = {}) {
  const pet = await um(`select id, nome from pets where id = $1`, [petId]);
  if (!pet) throw naoEncontrado('Pet');
  if (await papelNoPet(eu, petId)) return { tutor: true, estab: null };
  const estab = await estabelecimentoAtendePet(eu, petId);
  const dono = await um(`select p.privacidade ->> 'carteirinha' as nivel from pet_tutores t join perfis p on p.id = t.perfil_id
                          where t.pet_id = $1 and t.papel = 'dono' limit 1`, [petId]);
  const nivel = dono?.nivel ?? 'familia';
  // O estabelecimento que atende sempre pode LANÇAR (vacina aplicada, consulta); ver o histórico depende da privacidade.
  if (estab && (escrever || nivel !== 'familia')) return { tutor: false, estab };
  if (!escrever && nivel === 'todos') return { tutor: false, estab: null };
  throw proibido('A carteirinha desse pet é privada');
}

export default async function rotas(app) {
  app.get('/pets/:id/carteirinha', async (req) => {
    const eu = exigirLogin(req);
    const { tutor } = await acessoCarteirinha(eu, req.params.id);
    const id = req.params.id;
    const [vacinas, medicamentos, pesagens, alergias, historico, documentos, rotinas] = await Promise.all([
      varios(`select v.*, e.nome as estabelecimento,
                     case when v.proxima_em is null then 'ok'
                          when v.proxima_em < current_date then 'atrasada'
                          when v.proxima_em < current_date + 30 then 'em_breve' else 'ok' end as situacao
                from vacinas v left join estabelecimentos e on e.id = v.estabelecimento_id where v.pet_id = $1 order by v.proxima_em nulls last`, [id]),
      varios(`select * from medicamentos where pet_id = $1 and ativo order by proxima_em nulls last`, [id]),
      varios(`select medido_em, peso_kg from pesagens where pet_id = $1 order by medido_em desc limit 24`, [id]),
      varios(`select id, texto from alergias where pet_id = $1`, [id]),
      varios(`select r.*, e.nome as estabelecimento from registros_saude r left join estabelecimentos e on e.id = r.estabelecimento_id
               where r.pet_id = $1 order by r.data desc limit 50`, [id]),
      tutor ? varios(`select * from documentos_pet where pet_id = $1 order by criado_em desc`, [id]) : [],
      tutor ? varios(`select * from rotinas where pet_id = $1 order by criado_em`, [id]) : [],
    ]);
    return { vacinas, medicamentos, pesagens, alergias, historico, documentos, rotinas };
  });

  app.post('/pets/:id/vacinas', async (req, reply) => {
    const eu = exigirLogin(req);
    const { estab } = await acessoCarteirinha(eu, req.params.id, { escrever: true });
    const d = z.object({
      nome: z.string().max(60), aplicada_em: z.iso.date().optional(), proxima_em: z.iso.date().optional(),
      lote: z.string().max(40).optional(), agendamento_id: z.uuid().optional(),
    }).parse(req.body);
    return reply.status(201).send(await um(
      `insert into vacinas (pet_id, nome, aplicada_em, proxima_em, lote, estabelecimento_id, agendamento_id, registrado_por, verificada)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning *`,
      [req.params.id, d.nome, d.aplicada_em ?? null, d.proxima_em ?? null, d.lote ?? null, estab, d.agendamento_id ?? null, eu, !!estab]));
  });

  app.post('/pets/:id/registros', async (req, reply) => {
    const eu = exigirLogin(req);
    const { estab } = await acessoCarteirinha(eu, req.params.id, { escrever: true });
    const d = z.object({ data: z.iso.date().optional(), titulo: z.string().max(80), descricao: z.string().max(2000).optional(), agendamento_id: z.uuid().optional() }).parse(req.body);
    return reply.status(201).send(await um(
      `insert into registros_saude (pet_id, data, titulo, descricao, estabelecimento_id, agendamento_id, registrado_por)
       values ($1, coalesce($2::date, current_date), $3, $4, $5, $6, $7) returning *`,
      [req.params.id, d.data ?? null, d.titulo, d.descricao ?? null, estab, d.agendamento_id ?? null, eu]));
  });

  app.post('/pets/:id/pesagens', async (req, reply) => {
    const eu = exigirLogin(req);
    await acessoCarteirinha(eu, req.params.id, { escrever: true });
    const d = z.object({ peso_kg: z.number().positive().max(200), medido_em: z.iso.date().optional() }).parse(req.body);
    const p = await um(
      `insert into pesagens (pet_id, peso_kg, medido_em) values ($1, $2, coalesce($3::date, current_date))
       on conflict (pet_id, medido_em) do update set peso_kg = excluded.peso_kg returning *`, [req.params.id, d.peso_kg, d.medido_em ?? null]);
    // O peso atual do perfil é sempre a pesagem mais recente.
    await q(`update pets set peso_kg = (select peso_kg from pesagens where pet_id = $1 order by medido_em desc limit 1) where id = $1`, [req.params.id]);
    return reply.status(201).send(p);
  });

  // Daqui para baixo, só os tutores.
  const soTutor = async (eu, petId) => {
    if (!(await papelNoPet(eu, petId))) throw proibido('Esse pet não é seu');
  };

  app.post('/pets/:id/medicamentos', async (req, reply) => {
    const eu = exigirLogin(req);
    await soTutor(eu, req.params.id);
    const d = z.object({ nome: z.string().max(60), dose: z.string().max(60).optional(), frequencia: z.string().max(60).optional(), proxima_em: z.iso.datetime({ offset: true }).optional() }).parse(req.body);
    return reply.status(201).send(await um(`insert into medicamentos (pet_id, nome, dose, frequencia, proxima_em) values ($1,$2,$3,$4,$5) returning *`,
      [req.params.id, d.nome, d.dose ?? null, d.frequencia ?? null, d.proxima_em ?? null]));
  });

  app.post('/pets/:id/alergias', async (req, reply) => {
    const eu = exigirLogin(req);
    await soTutor(eu, req.params.id);
    const { texto } = z.object({ texto: z.string().min(2).max(100) }).parse(req.body);
    return reply.status(201).send(await um(`insert into alergias (pet_id, texto) values ($1, $2) returning *`, [req.params.id, texto]));
  });

  app.delete('/pets/:id/alergias/:a', async (req) => {
    const eu = exigirLogin(req);
    await soTutor(eu, req.params.id);
    await q(`delete from alergias where id = $1 and pet_id = $2`, [req.params.a, req.params.id]);
    return { ok: true };
  });

  app.post('/pets/:id/documentos', async (req, reply) => {
    const eu = exigirLogin(req);
    await soTutor(eu, req.params.id);
    const d = z.object({ nome: z.string().max(80), path: z.string().max(300), tipo: z.string().max(20).optional() }).parse(req.body);
    if (!d.path.startsWith(`documentos/${eu}/`)) throw proibido('Arquivo de outra pessoa');
    return reply.status(201).send(await um(`insert into documentos_pet (pet_id, nome, path, tipo) values ($1,$2,$3,$4) returning *`,
      [req.params.id, d.nome, d.path, d.tipo ?? null]));
  });

  const esquemaRotina = z.object({
    icone: z.string().max(30), titulo: z.string().max(60), a_cada_dias: z.number().int().positive().max(730).optional(),
    horario: z.string().regex(/^\d{2}:\d{2}$/).optional(), proxima_em: z.iso.datetime({ offset: true }).optional(),
    estabelecimento_id: z.uuid().optional(), ligada: z.boolean().optional(),
  });

  app.post('/pets/:id/rotinas', async (req, reply) => {
    const eu = exigirLogin(req);
    await soTutor(eu, req.params.id);
    const d = esquemaRotina.parse(req.body);
    const ks = Object.keys(d);
    return reply.status(201).send(await um(
      `insert into rotinas (pet_id, ${ks.join(', ')}) values ($1, ${ks.map((_, i) => `$${i + 2}`).join(', ')}) returning *`,
      [req.params.id, ...ks.map((k) => d[k])]));
  });

  app.patch('/rotinas/:id', async (req) => {
    const eu = exigirLogin(req);
    const r = await um(`select pet_id from rotinas where id = $1`, [req.params.id]);
    if (!r) throw naoEncontrado('Rotina');
    await soTutor(eu, r.pet_id);
    const d = esquemaRotina.partial().parse(req.body);
    const ks = Object.keys(d);
    if (!ks.length) return r;
    return um(`update rotinas set ${ks.map((k, i) => `${k} = $${i + 2}`).join(', ')} where id = $1 returning *`, [req.params.id, ...ks.map((k) => d[k])]);
  });

  // Agenda do pet (semana): tarefas + agendamentos.
  app.get('/pets/:id/agenda', async (req) => {
    const eu = exigirLogin(req);
    await soTutor(eu, req.params.id);
    const de = z.iso.date().optional().parse(req.query.de) ?? new Date().toISOString().slice(0, 10);
    const tarefas = await varios(`select * from tarefas_pet where pet_id = $1 and quando >= $2::date and quando < $2::date + 7 order by quando`, [req.params.id, de]);
    const agendamentos = await varios(
      `select a.id, a.inicio, a.servico_nome, a.status, e.nome as estabelecimento, e.bairro from agendamentos a join estabelecimentos e on e.id = a.estabelecimento_id
        where a.pet_id = $1 and a.inicio >= $2::date and a.inicio < $2::date + 7 and a.status not in ('cancelado','recusado') order by a.inicio`, [req.params.id, de]);
    return { tarefas, agendamentos };
  });

  app.post('/pets/:id/tarefas', async (req, reply) => {
    const eu = exigirLogin(req);
    await soTutor(eu, req.params.id);
    const d = z.object({ titulo: z.string().max(60), icone: z.string().max(30).optional(), quando: z.iso.datetime({ offset: true }), feito: z.boolean().default(false), nota: z.string().max(200).optional(), rotina_id: z.uuid().optional() }).parse(req.body);
    return reply.status(201).send(await um(
      `insert into tarefas_pet (pet_id, rotina_id, icone, titulo, quando, feito_em, nota) values ($1,$2,$3,$4,$5,$6,$7) returning *`,
      [req.params.id, d.rotina_id ?? null, d.icone ?? null, d.titulo, d.quando, d.feito ? new Date() : null, d.nota ?? null]));
  });

  app.post('/tarefas/:id/feito', async (req) => {
    const eu = exigirLogin(req);
    const t = await um(`select pet_id from tarefas_pet where id = $1`, [req.params.id]);
    if (!t) throw naoEncontrado('Tarefa');
    await soTutor(eu, t.pet_id);
    return um(`update tarefas_pet set feito_em = case when feito_em is null then now() end where id = $1 returning *`, [req.params.id]);
  });

  app.get('/pets/:id/marcos', async (req) => {
    exigirLogin(req);
    return varios(`select * from marcos_pet where pet_id = $1 order by data`, [req.params.id]);
  });

  app.post('/pets/:id/marcos', async (req, reply) => {
    const eu = exigirLogin(req);
    await soTutor(eu, req.params.id);
    const d = z.object({ titulo: z.string().max(60), data: z.iso.date(), nota: z.string().max(200).optional(), foto_path: z.string().optional() }).parse(req.body);
    return reply.status(201).send(await um(`insert into marcos_pet (pet_id, titulo, data, nota, foto_path) values ($1,$2,$3,$4,$5) returning *`,
      [req.params.id, d.titulo, d.data, d.nota ?? null, d.foto_path ?? null]));
  });
}
