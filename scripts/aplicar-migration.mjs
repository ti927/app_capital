#!/usr/bin/env node
// Aplica arquivos .sql no banco, cada um em sua transação.
//   node scripts/aplicar-migration.mjs db/001_fundacao.sql db/002_dominio.sql
//
// Lê DIRECT_URL do .env (session mode, porta 5432 — DDL precisa dela, não do
// transaction mode do 6543).
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';

const env = Object.fromEntries(
  fs.readFileSync(path.resolve('.env'), 'utf8')
    .split(/\r?\n/)
    .filter(l => l && !l.trimStart().startsWith('#') && l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);

const url = env.DIRECT_URL || env.DATABASE_URL;
if (!url) {
  console.error('DIRECT_URL (ou DATABASE_URL) ausente no .env');
  process.exit(1);
}

const arquivos = process.argv.slice(2);
if (!arquivos.length) {
  console.error('uso: node scripts/aplicar-migration.mjs <arquivo.sql> [...]');
  process.exit(1);
}

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();

for (const f of arquivos) {
  const sql = fs.readFileSync(f, 'utf8');
  process.stdout.write(`${f} ... `);
  try {
    await client.query('begin');
    await client.query(sql);
    await client.query('commit');
    console.log('OK');
  } catch (e) {
    await client.query('rollback');
    console.log('FALHOU — rollback, nada deste arquivo foi aplicado');
    console.error(`  ${e.message}`);
    if (e.position) {
      const p = Number(e.position);
      console.error(`  contexto: ...${sql.slice(Math.max(0, p - 200), p + 120)}...`);
    }
    await client.end();
    process.exit(1);
  }
}

await client.end();
