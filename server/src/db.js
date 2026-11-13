import pg from 'pg';
import { config } from './config.js';

// bigint (count) vira número comum no JS
pg.types.setTypeParser(20, (v) => Number(v));
// numeric (peso, nota) vira número
pg.types.setTypeParser(1700, (v) => (v === null ? null : Number(v)));

export const pool = new pg.Pool({ connectionString: config.bancoUrl, max: 10 });

export const q = (sql, params) => pool.query(sql, params);
export const um = async (sql, params, db = pool) => (await db.query(sql, params)).rows[0] ?? null;
export const varios = async (sql, params, db = pool) => (await db.query(sql, params)).rows;

// Roda tudo dentro de uma transação: ou tudo grava, ou nada grava.
export async function transacao(fn) {
  const cliente = await pool.connect();
  try {
    await cliente.query('begin');
    const r = await fn(cliente);
    await cliente.query('commit');
    return r;
  } catch (e) {
    await cliente.query('rollback');
    throw e;
  } finally {
    cliente.release();
  }
}
