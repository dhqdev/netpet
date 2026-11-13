// Prepara um banco de teste limpo e a API, e dá atalhos para chamar as rotas.
import pg from 'pg';

const base = process.env.DATABASE_URL_TESTE || 'postgres://postgres@localhost:5432/postgres';

export async function preparar() {
  const nome = `netpet_teste_${process.pid}`;
  const admin = new pg.Client({ connectionString: base });
  await admin.connect();
  await admin.query(`drop database if exists ${nome}`);
  await admin.query(`create database ${nome}`);
  await admin.end();
  const u = new URL(base);
  u.pathname = `/${nome}`;
  process.env.DATABASE_URL = u.toString();
  process.env.PASTA_UPLOADS = `/tmp/${nome}-uploads/`;
  const { migrar } = await import('../db/migrar.js');
  await migrar(process.env.DATABASE_URL, { silencioso: true });
  const { criarApp } = await import('../src/app.js');
  const { pool } = await import('../src/db.js');
  const app = await criarApp({ logger: false });

  const chamar = async (metodo, url, { token, corpo, headers = {} } = {}) => {
    const r = await app.inject({
      method: metodo, url, payload: corpo,
      headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...headers },
    });
    const json = r.body ? JSON.parse(r.body) : null;
    return { ...((json && typeof json === 'object' && !Array.isArray(json)) ? json : {}), status: r.statusCode, lista: Array.isArray(json) ? json : undefined, corpo: json };
  };

  const fechar = async () => {
    await app.close();
    await pool.end();
    const a = new pg.Client({ connectionString: base });
    await a.connect();
    await a.query(`drop database if exists ${nome}`);
    await a.end();
  };
  return { app, chamar, pool, fechar };
}

// Próximo dia (AAAA-MM-DD) a partir de amanhã, em São Paulo.
export function diaFuturo(dias = 2) {
  const d = new Date(Date.now() + dias * 86400000);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(d);
}
