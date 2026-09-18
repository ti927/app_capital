#!/usr/bin/env node
/**
 * Mede a navegação entre telas internas em duas leituras:
 *
 *   resposta  — do clique até QUALQUER coisa da tela nova aparecer
 *               (o esqueleto de carregamento, quando existe)
 *   conteúdo  — do clique até o dado de verdade aparecer
 *
 * A diferença entre as duas é o tempo em que o usuário fica olhando a tela
 * anterior sem sinal de vida. É essa a queixa de "sistema lento".
 *
 * Mede a PRIMEIRA visita a cada rota, em contexto novo: depois da primeira vez
 * o router do Next guarda o payload e a segunda navegação é instantânea, o que
 * esconde o problema.
 *
 *   node scripts/medir-navegacao.mjs
 *
 * Roda contra `QA_BASE` (padrão http://localhost:3000) e com build de produção
 * (`npm run build && npm run start`) — em `next dev` o número é o do
 * compilador, não o do usuário. Entra com a primeira conta de
 * dados/credenciais-provisorias.txt.
 */
import fs from 'node:fs';
import { chromium } from 'playwright';

const BASE = process.env.QA_BASE ?? 'http://localhost:3000';

const TELAS = [
  { rotulo: 'Funil de Clientes',      conteudo: '.funil__coluna' },
  { rotulo: 'Fornecedor',             conteudo: '.lc-table tbody tr, .lc-empty' },
  { rotulo: 'Operação',               conteudo: '.lista__item, .lc-empty' },
  { rotulo: 'Esteira de Estruturação', conteudo: '.lista__item, .lc-empty' },
];

const linha = fs
  .readFileSync('dados/credenciais-provisorias.txt', 'utf8')
  .split(/\r?\n/)
  .find((l) => l && !l.startsWith('#'));
const [email, senha] = linha.split('\t');

const navegador = await chromium.launch();
const contexto = await navegador.newContext({ viewport: { width: 1440, height: 900 } });
const pagina = await contexto.newPage();

for (let i = 0; i < 30; i += 1) {
  try {
    await pagina.goto(`${BASE}/entrar`, { waitUntil: 'domcontentloaded', timeout: 3000 });
    break;
  } catch {
    await pagina.waitForTimeout(1000);
  }
}

await pagina.fill('input[name="email"]', email);
await pagina.fill('input[name="senha"]', senha);
await pagina.click('button[type="submit"]');
await pagina.waitForURL('**/clientes', { timeout: 30000 });
await pagina.waitForSelector('.lista__item', { timeout: 30000 });

const resultados = [];

for (const tela of TELAS) {
  const inicio = Date.now();

  // O esqueleto e o conteúdo são corridas paralelas a partir do mesmo clique.
  const esqueleto = pagina
    .waitForSelector('.lc-skel, .lc-esqueleto', { timeout: 30000 })
    .then(() => Date.now() - inicio)
    .catch(() => null);

  await pagina.click(`.lc-navitem:has-text("${tela.rotulo}")`);
  await pagina.waitForSelector(tela.conteudo, { timeout: 30000 });
  const conteudo = Date.now() - inicio;

  resultados.push({ tela: tela.rotulo, resposta: await esqueleto, conteudo });
}

console.log(`\nprimeira visita a cada tela (${BASE})\n`);
console.log('  tela                       resposta   conteúdo');
for (const r of resultados) {
  const resposta = r.resposta === null ? '     —' : `${String(r.resposta).padStart(5)}ms`;
  console.log(`  ${r.tela.padEnd(24)} ${resposta}    ${String(r.conteudo).padStart(5)}ms`);
}
console.log(
  `\n  conteúdo, mediana: ${
    [...resultados].map((r) => r.conteudo).sort((a, b) => a - b)[Math.floor(resultados.length / 2)]
  } ms`,
);

await navegador.close();
