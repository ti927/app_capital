#!/usr/bin/env node
// Extrai os data types do Bubble para dados/bruto/*.json
//   node scripts/extrair-bubble.mjs
//
// dados/ esta no .gitignore: contem dado de cliente.
//
// Nota: a exposicao da Data API para cliente, opera__o e etapas_opera__o nunca
// foi publicada em live — la esses tipos dao 404. Pelo /version-test todos
// respondem. Por isso a raiz padrao aponta para version-test.
//
// version-test e live sao bancos SEPARADOS no Bubble. Conferido em 21/09/2026:
// user e fornecedor batem linha a linha e na data de modificacao nas duas
// raizes, e funilcartao tem 18 nos dois mas com um dia a mais no live. Ou seja,
// o version-test e uma copia do live tirada por volta de 15/09/2026 — fiel,
// mas nao ao vivo.
//
// Isso importa quando um campo aparece vazio no app novo: pode ser que o dado
// nunca tenha existido, ou que tenha sido digitado no live depois da copia.
// Para tirar a duvida, exponha o data type na Data API do live
// (Settings > API, marcar o tipo) e rode com --live.
//
//   node scripts/extrair-bubble.mjs --live
import fs from 'node:fs';
import path from 'node:path';
import { buscarTipo, urlDaRaiz } from '../src/lib/bubble/api.ts';

const env = Object.fromEntries(
  fs.readFileSync('.env', 'utf8').split(/\r?\n/)
    .filter(l => l && !l.trimStart().startsWith('#') && l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));

const KEY = env.BUBBLE_API_KEY;
const APP = env.BUBBLE_APP_URL || 'https://planilha-lurecapital.bubbleapps.io';
const LIVE = process.argv.includes('--live');
const RAIZ = urlDaRaiz(APP, LIVE ? 'live' : 'version-test');
if (!KEY) { console.error('BUBBLE_API_KEY ausente no .env'); process.exit(1); }
console.log(`raiz: ${LIVE ? 'LIVE' : 'version-test'}  (${RAIZ})
`);

const TIPOS = [
  'user', 'cliente', 'fornecedor', 'opera__o', 'etapas_opera__o',
  'tbl_observa__es', 'tbl_etapas_da_opera__o__observa__es_', 'tbl_infocliente',
  'tbl_config', 'funilcartao', 'funiletapa', 'funiltag', 'funiltarefa', 'respostas',
];

const destino = 'dados/bruto';
fs.mkdirSync(destino, { recursive: true });

for (const tipo of TIPOS) {
  process.stdout.write(`${tipo.padEnd(38)} `);
  // Mesma leitura paginada do botao de sincronizacao (src/lib/bubble/api.ts).
  const r = await buscarTipo(RAIZ, KEY, tipo);
  if (!r.ok) { console.log(`HTTP ${r.status} — pulado`); continue; }
  fs.writeFileSync(path.join(destino, `${tipo}.json`), JSON.stringify(r.linhas, null, 2));
  console.log(`${String(r.linhas.length).padStart(4)} registros`);
}

