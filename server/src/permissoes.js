// Quem pode o quê. Toda rota passa por aqui antes de ler ou mudar dados.
import { um } from './db.js';
import { proibido, naoEncontrado } from './erros.js';

// Papel da pessoa no pet: 'dono', 'familia' ou null.
export async function papelNoPet(perfilId, petId, db) {
  const r = await um(`select papel from pet_tutores where pet_id = $1 and perfil_id = $2`, [petId, perfilId], db);
  return r?.papel ?? null;
}

export async function exigirTutor(perfilId, petId, { soDono = false } = {}, db) {
  const papel = await papelNoPet(perfilId, petId, db);
  if (!papel) throw proibido('Esse pet não é seu');
  if (soDono && papel !== 'dono') throw proibido('Só o dono do pet pode fazer isso');
  return papel;
}

// Acesso da pessoa no estabelecimento: 'dono', 'admin', 'equipe' ou null.
export async function acessoNoEstabelecimento(perfilId, estabId, db) {
  if (!perfilId) return null;
  const r = await um(
    `select acesso from equipe_estabelecimento where estabelecimento_id = $1 and perfil_id = $2 and ativo and acesso is not null`,
    [estabId, perfilId], db,
  );
  return r?.acesso ?? null;
}

const NIVEL = { equipe: 1, admin: 2, dono: 3 };

// nivel 'equipe' = opera a agenda; 'admin' = muda serviços, preços e horários; 'dono' = equipe e dados bancários.
export async function exigirEstabelecimento(perfilId, estabId, nivel = 'equipe', db) {
  const e = await um(`select id from estabelecimentos where id = $1`, [estabId], db);
  if (!e) throw naoEncontrado('Estabelecimento');
  const acesso = await acessoNoEstabelecimento(perfilId, estabId, db);
  if (!acesso || NIVEL[acesso] < NIVEL[nivel]) throw proibido('Você não faz parte da equipe desse estabelecimento com esse nível de acesso');
  return acesso;
}

// O estabelecimento atendeu (ou vai atender) esse pet? Libera ver e lançar na carteirinha.
export async function estabelecimentoAtendePet(perfilId, petId, db) {
  const r = await um(
    `select a.estabelecimento_id
       from agendamentos a
       join equipe_estabelecimento e on e.estabelecimento_id = a.estabelecimento_id
      where a.pet_id = $1 and e.perfil_id = $2 and e.ativo and e.acesso is not null
        and a.status in ('confirmado', 'em_andamento', 'concluido')
        and a.inicio > now() - interval '365 days'
      order by a.inicio desc limit 1`,
    [petId, perfilId], db,
  );
  return r?.estabelecimento_id ?? null;
}

export async function bloqueado(a, b, db) {
  const r = await um(`select 1 from bloqueios where (quem = $1 and bloqueado = $2) or (quem = $2 and bloqueado = $1)`, [a, b], db);
  return !!r;
}
