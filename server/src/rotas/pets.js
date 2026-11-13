// Pets: cadastro, perfil público, família e seguir.
import { z } from 'zod';
import { transacao, um, varios, q } from '../db.js';
import { exigirLogin } from '../auth.js';
import { exigirTutor, papelNoPet, bloqueado } from '../permissoes.js';
import { naoEncontrado, invalido, conflito } from '../erros.js';

const esquemaPetBase = z.object({
  nome: z.string().trim().min(1).max(40),
  usuario: z.string().toLowerCase().regex(/^[a-z0-9_.]{3,30}$/).optional(),
  especie: z.enum(['cao', 'gato', 'outro']),
  raca: z.string().max(60).optional(),
  sexo: z.enum(['macho', 'femea']).optional(),
  nascimento: z.iso.date().optional(),
  porte: z.enum(['pequeno', 'medio', 'grande']),
  pelagem: z.string().max(30).optional(),
  peso_kg: z.number().positive().max(200).optional(),
  castrado: z.boolean().optional(),
  cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  bio: z.string().max(300).optional(),
  foto_path: z.string().max(300).optional(),
  publico: z.boolean().optional(),
});
export const esquemaPet = esquemaPetBase.extend({ porte: esquemaPetBase.shape.porte.default('medio') });

const CAMPOS = Object.keys(esquemaPet.shape);

export async function criarPet(db, perfilId, dados) {
  const d = esquemaPet.parse(dados);
  const cols = CAMPOS.filter((k) => d[k] !== undefined);
  const pet = await um(
    `insert into pets (${cols.join(', ')}, criado_por) values (${cols.map((_, i) => `$${i + 1}`).join(', ')}, $${cols.length + 1}) returning *`,
    [...cols.map((k) => d[k]), perfilId], db,
  );
  await db.query(`insert into pet_tutores (pet_id, perfil_id, papel) values ($1, $2, 'dono')`, [pet.id, perfilId]);
  if (d.peso_kg) await db.query(`insert into pesagens (pet_id, peso_kg) values ($1, $2)`, [pet.id, d.peso_kg]);
  return pet;
}

export default async function rotas(app) {
  app.post('/pets', async (req, reply) => {
    const eu = exigirLogin(req);
    const pet = await transacao((db) => criarPet(db, eu, req.body));
    return reply.status(201).send(pet);
  });

  // Perfil do pet. Pet privado só aparece para quem cuida dele e para seguidores.
  app.get('/pets/:id', async (req) => {
    const pet = await um(`select * from pets where id = $1`, [req.params.id]);
    if (!pet) throw naoEncontrado('Pet');
    const papel = req.eu ? await papelNoPet(req.eu, pet.id) : null;
    const sigo = req.eu ? !!(await um(`select 1 from seguidores where perfil_id = $1 and pet_id = $2`, [req.eu, pet.id])) : false;
    if (!pet.publico && !papel && !sigo) throw naoEncontrado('Pet');
    if (req.eu && !papel) {
      const dono = await um(`select perfil_id from pet_tutores where pet_id = $1 and papel = 'dono' limit 1`, [pet.id]);
      if (dono && (await bloqueado(req.eu, dono.perfil_id))) throw naoEncontrado('Pet');
    }
    const tutores = await varios(
      `select p.id, p.nome, p.usuario, p.foto_path, t.papel from pet_tutores t join perfis p on p.id = t.perfil_id where t.pet_id = $1`, [pet.id]);
    const selos = await varios(`select s.* from pet_selos ps join selos s on s.slug = ps.selo where ps.pet_id = $1`, [pet.id]);
    return { ...pet, tutores, selos, meu: !!papel, papel, sigo };
  });

  app.patch('/pets/:id', async (req) => {
    const eu = exigirLogin(req);
    await exigirTutor(eu, req.params.id);
    const d = esquemaPetBase.partial().extend({ status: z.string().max(30).nullable() }).parse(req.body);
    const ks = Object.keys(d).filter((k) => d[k] !== undefined);
    if (!ks.length) throw invalido('Nada para mudar');
    return transacao(async (db) => {
      const pet = await um(
        `update pets set ${ks.map((k, i) => `${k} = $${i + 2}`).join(', ')} where id = $1 returning *`,
        [req.params.id, ...ks.map((k) => d[k])], db);
      if (d.peso_kg) {
        await db.query(
          `insert into pesagens (pet_id, peso_kg) values ($1, $2) on conflict (pet_id, medido_em) do update set peso_kg = excluded.peso_kg`,
          [pet.id, d.peso_kg]);
      }
      return pet;
    });
  });

  app.delete('/pets/:id', async (req) => {
    const eu = exigirLogin(req);
    await exigirTutor(eu, req.params.id, { soDono: true });
    const aberto = await um(
      `select 1 from agendamentos where pet_id = $1 and status in ('pendente','confirmado','em_andamento')`, [req.params.id]);
    if (aberto) throw conflito('Esse pet tem agendamentos em aberto. Cancele antes de remover.');
    // Com histórico de agendamento o pet é só escondido (o estabelecimento precisa do registro).
    const historico = await um(`select 1 from agendamentos where pet_id = $1`, [req.params.id]);
    if (historico) {
      await q(`update pets set publico = false where id = $1`, [req.params.id]);
      await q(`delete from pet_tutores where pet_id = $1`, [req.params.id]);
    } else {
      await q(`delete from pets where id = $1`, [req.params.id]);
    }
    return { ok: true };
  });

  // Família: o dono adiciona alguém (pelo e-mail da conta) para cuidar junto.
  app.post('/pets/:id/familia', async (req, reply) => {
    const eu = exigirLogin(req);
    await exigirTutor(eu, req.params.id, { soDono: true });
    const { email, papel } = z.object({ email: z.email(), papel: z.enum(['dono', 'familia']).default('familia') }).parse(req.body);
    const conta = await um(`select id from contas where email = $1 and ativa`, [email]);
    if (!conta) throw naoEncontrado('Conta com esse e-mail');
    await q(
      `insert into pet_tutores (pet_id, perfil_id, papel) values ($1, $2, $3)
       on conflict (pet_id, perfil_id) do update set papel = excluded.papel`, [req.params.id, conta.id, papel]);
    return reply.status(201).send({ ok: true });
  });

  app.delete('/pets/:id/familia/:perfil', async (req) => {
    const eu = exigirLogin(req);
    // O dono tira alguém, ou a própria pessoa sai.
    if (req.params.perfil !== eu) await exigirTutor(eu, req.params.id, { soDono: true });
    const donos = await um(`select count(*) n from pet_tutores where pet_id = $1 and papel = 'dono' and perfil_id <> $2`, [req.params.id, req.params.perfil]);
    if (donos.n === 0) throw conflito('O pet precisa de pelo menos um dono');
    await q(`delete from pet_tutores where pet_id = $1 and perfil_id = $2`, [req.params.id, req.params.perfil]);
    return { ok: true };
  });

  app.post('/pets/:id/seguir', async (req) => {
    const eu = exigirLogin(req);
    const pet = await um(`select id from pets where id = $1`, [req.params.id]);
    if (!pet) throw naoEncontrado('Pet');
    await q(`insert into seguidores (perfil_id, pet_id) values ($1, $2) on conflict do nothing`, [eu, pet.id]);
    return { ok: true };
  });

  app.delete('/pets/:id/seguir', async (req) => {
    const eu = exigirLogin(req);
    await q(`delete from seguidores where perfil_id = $1 and pet_id = $2`, [eu, req.params.id]);
    return { ok: true };
  });

  // Busca de pets por nome ou @ (para marcar, seguir, convidar).
  app.get('/pets', async (req) => {
    const termo = String(req.query.busca || '').trim();
    if (termo.length < 2) return [];
    return varios(
      `select id, nome, usuario, especie, raca, foto_path, cor, seguidores from pets
        where publico and (nome ilike $1 or usuario::text ilike $1) order by seguidores desc limit 20`, [`%${termo}%`]);
  });
}
