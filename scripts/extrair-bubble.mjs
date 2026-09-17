#!/usr/bin/env node
// Extrai os data types do Bubble para dados/bruto/*.json
//   node scripts/extrair-bubble.mjs
//
// dados/ esta no .gitignore: contem dado de cliente.
//
// Nota: a exposicao da Data API para cliente, opera__o e etapas_opera__o nunca
// foi publicada em live — la esses tipos dao 404. Pelo /version-test todos
// respondem, e o dado e o mesmo (fornecedor tem os mesmos 73 nomes nas duas
// raizes). Por isso a raiz padrao aponta para version-test.
import fs from 'node:fs';
import path from 'node:path';

const env = Object.fromEntries(
  fs.readFileSync('.env', 'utf8').split(/\r?\n/)
    .filter(l => l && !l.trimStart().startsWith('#') && l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));

const KEY  = env.BUBBLE_API_KEY;
const RAIZ = (env.BUBBLE_APP_URL || 'https://planilha-lurecapital.bubbleapps.io') + '/version-test';
if (!KEY) { console.error('BUBBLE_API_KEY ausente no .env'); process.exit(1); }

const TIPOS = [
  'user', 'cliente', 'fornecedor', 'opera__o', 'etapas_opera__o',
  'tbl_observa__es', 'tbl_etapas_da_opera__o__observa__es_', 'tbl_infocliente',
  'tbl_config', 'funilcartao', 'funiletapa', 'funiltag', 'funiltarefa', 'respostas',
];

const destino = 'dados/bruto';
fs.mkdirSync(destino, { recursive: true });

for (const tipo of TIPOS) {
  const linhas = [];
  let cursor = 0;
  process.stdout.write(`${tipo.padEnd(38)} `);
  for (;;) {
    const r = await fetch(`${RAIZ}/api/1.1/obj/${tipo}?limit=100&cursor=${cursor}`,
                          { headers: { Authorization: `Bearer ${KEY}` } });
    if (!r.ok) { console.log(`HTTP ${r.status} — pulado`); break; }
    const { response } = await r.json();
    linhas.push(...response.results);
    if (response.remaining === 0) {
      fs.writeFileSync(path.join(destino, `${tipo}.json`), JSON.stringify(linhas, null, 2));
      console.log(`${String(linhas.length).padStart(4)} registros`);
      break;
    }
    cursor += response.count;
  }
}
console.log(`\nGravado em ${destino}/ (fora do git).`);
