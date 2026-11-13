// Aplica as migrações de db/migrations em ordem, uma vez cada.
// Uso: npm run db:migrar
import fs from 'node:fs/promises';
import pg from 'pg';

const url = process.env.DATABASE_URL || 'postgres://netpet:netpet@localhost:5432/netpet';
const pasta = new URL('./migrations/', import.meta.url);

export async function migrar(conexao = url, { silencioso = false } = {}) {
  const db = new pg.Client({ connectionString: conexao });
  await db.connect();
  try {
    await db.query(`create table if not exists _migracoes (nome text primary key, aplicada_em timestamptz not null default now())`);
    const feitas = new Set((await db.query(`select nome from _migracoes`)).rows.map((r) => r.nome));
    const arquivos = (await fs.readdir(pasta)).filter((f) => f.endsWith('.sql')).sort();
    for (const f of arquivos) {
      if (feitas.has(f)) continue;
      const sql = await fs.readFile(new URL(f, pasta), 'utf8');
      await db.query('begin');
      try {
        await db.query(sql);
        await db.query(`insert into _migracoes (nome) values ($1)`, [f]);
        await db.query('commit');
        if (!silencioso) console.log(`✓ ${f}`);
      } catch (e) {
        await db.query('rollback');
        throw new Error(`Falhou em ${f}: ${e.message}`);
      }
    }
    if (!silencioso) console.log('Banco em dia.');
  } finally {
    await db.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  migrar().catch((e) => { console.error(e.message); process.exit(1); });
}
