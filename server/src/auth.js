import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { config } from './config.js';
import { um, q } from './db.js';
import { ErroApp } from './erros.js';

const chave = new TextEncoder().encode(config.jwtSegredo);
const ACESSO_MIN = 15;          // token de acesso dura 15 minutos
const SESSAO_DIAS = 60;         // o celular fica logado por 60 dias sem uso

export const gerarHash = (senha) => bcrypt.hash(senha, 10);
export const conferirSenha = (senha, hash) => bcrypt.compare(senha, hash);
const sha = (t) => crypto.createHash('sha256').update(t).digest('hex');

// Abre uma sessão: token curto (JWT) + token de renovação guardado como hash.
export async function abrirSessao(contaId, db = { query: q }) {
  const renovacao = crypto.randomBytes(32).toString('base64url');
  await db.query(
    `insert into sessoes (conta_id, token_hash, expira_em) values ($1, $2, now() + make_interval(days => $3))`,
    [contaId, sha(renovacao), SESSAO_DIAS],
  );
  const acesso = await new SignJWT({}).setProtectedHeader({ alg: 'HS256' }).setSubject(contaId)
    .setIssuedAt().setExpirationTime(`${ACESSO_MIN}m`).sign(chave);
  return { acesso, renovacao, expira_em_s: ACESSO_MIN * 60 };
}

// Troca o token de renovação por um novo par (o antigo deixa de valer).
export async function renovarSessao(renovacao) {
  const s = await um(`delete from sessoes where token_hash = $1 returning conta_id, expira_em`, [sha(renovacao)]);
  if (!s || s.expira_em < new Date()) throw new ErroApp(401, 'Sessão expirada. Entre de novo.', 'sessao_expirada');
  return abrirSessao(s.conta_id);
}

export const fecharSessao = (renovacao) => q(`delete from sessoes where token_hash = $1`, [sha(renovacao)]);

// Plugin: lê "Authorization: Bearer <token>" e coloca req.eu = id do perfil.
export async function lerUsuario(req) {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) return;
  try {
    const { payload } = await jwtVerify(h.slice(7), chave);
    req.eu = payload.sub;
  } catch {
    throw new ErroApp(401, 'Sessão expirada. Entre de novo.', 'sessao_expirada');
  }
}

export function exigirLogin(req) {
  if (!req.eu) throw new ErroApp(401, 'Entre na sua conta para continuar', 'login');
  return req.eu;
}
