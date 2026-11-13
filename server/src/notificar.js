// Cria a notificação no banco e, se ligado, manda push pelo Expo.
// Respeita o que a pessoa desligou em Ajustes > Notificações.
import { config } from './config.js';
import { varios } from './db.js';

export async function notificar(db, perfilIds, { grupo, titulo, texto, icone, destino }) {
  const ids = [...new Set([perfilIds].flat().filter(Boolean))];
  if (!ids.length) return;
  const alvos = await varios(
    `insert into notificacoes (perfil_id, grupo, titulo, texto, icone, destino)
     select p.id, $2, $3, $4, $5, $6 from perfis p
      where p.id = any($1) and coalesce((p.notificacoes ->> $2)::boolean, true)
     returning perfil_id`,
    [ids, grupo, titulo, texto ?? null, icone ?? null, destino ? JSON.stringify(destino) : null], db,
  );
  if (!config.enviarPush || !alvos.length) return;
  const tokens = await varios(`select push_token from dispositivos where perfil_id = any($1)`, [alvos.map((a) => a.perfil_id)], db);
  if (!tokens.length) return;
  // Sem await: push não pode travar o pedido.
  fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(tokens.map((t) => ({ to: t.push_token, title: titulo, body: texto, data: { destino } }))),
  }).catch(() => {});
}

// Todo mundo da equipe com acesso ao app (para avisar de pedido novo, cancelamento...).
export async function equipeDoEstabelecimento(db, estabId) {
  const r = await varios(
    `select perfil_id from equipe_estabelecimento where estabelecimento_id = $1 and ativo and acesso is not null and perfil_id is not null`,
    [estabId], db,
  );
  return r.map((x) => x.perfil_id);
}
