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

/**
 * Quantas vezes medir cada tela. `node scripts/medir-navegacao.mjs --vezes 9`.
 *
 * Uma medicao so por tela nao serve para comparar antes e depois: a mesma
 * build, medida tres vezes seguidas, deu mediana de 485ms, 360ms e 380ms. O
 * que oscila e a ida e volta ao Supabase, que vai pela internet. Com cinco
 * passadas e a MEDIANA de cada tela, a diferenca que sobra e do codigo.
 */
const VEZES = (() => {
  const i = process.argv.indexOf('--vezes');
  const n = i > -1 ? Number(process.argv[i + 1]) : NaN;
  return Number.isFinite(n) && n > 0 ? n : 5;
})();

const mediana = (ns) => {
  const v = ns.filter((n) => n !== null && n !== undefined).sort((a, b) => a - b);
  return v.length ? v[Math.floor(v.length / 2)] : null;
};

/**
 * Conteúdo de verdade, não o esqueleto de carregamento. O esqueleto reusa as
 * classes do conteúdo de propósito, para ter a mesma geometria — então quem
 * espera por seletor precisa dizer que não quer a versão cinza.
 */
const ITEM_REAL = '.lista__item:not(.lista__item--esqueleto)';
const LINHA_REAL = '.lc-table tbody tr:not(.lc-table__linha--esqueleto)';
const COLUNA_REAL = '.funil__coluna:not(.funil__coluna--esqueleto)';


/**
 * `rota` não é enfeite: a tela ANTERIOR continua no DOM até a nova renderizar,
 * e `.lista__item` existe em três delas. Sem conferir o endereço junto, a
 * esteira "media" 24ms — que era a lista de operações ainda na tela.
 */
const TELAS = [
  { rotulo: 'Funil de Clientes',       rota: '/funil',        conteudo: COLUNA_REAL },
  { rotulo: 'Fornecedor',              rota: '/fornecedores', conteudo: `${LINHA_REAL}, .lc-empty` },
  { rotulo: 'Operação',                rota: '/operacoes',    conteudo: `${ITEM_REAL}, .lc-empty` },
  { rotulo: 'Esteira de Estruturação', rota: '/esteira',      conteudo: `${ITEM_REAL}, .lc-empty` },
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
await pagina.waitForSelector(ITEM_REAL, { timeout: 30000 });

/** Uma passada por todas as telas. */
async function umaPassada() {
  const desta = [];
  for (const tela of TELAS) {
    // Sempre do mesmo ponto de partida, e sem o router guardado da visita
    // anterior — é a PRIMEIRA visita que dói.
    await pagina.goto(`${BASE}/clientes`, { waitUntil: 'networkidle' });
    await pagina.waitForSelector(ITEM_REAL, { timeout: 30000 });

    // Quanto a tela manda pelo fio: o payload do React Server Component carrega
    // TODO o dado que a página buscou. Tela que consulta a tabela inteira paga
    // isso em bytes, e o navegador paga de novo ao ler.
    let bytes = 0;
    const contar = async (r) => {
      if (!r.url().includes(tela.rota)) return;
      try {
        bytes += (await r.body()).length;
      } catch {
        /* resposta sem corpo */
      }
    };
    pagina.on('response', contar);

    const inicio = Date.now();

    // O esqueleto e o conteúdo são corridas paralelas a partir do mesmo clique.
    const esqueleto = pagina
      .waitForSelector('.lc-skel', { timeout: 30000 })
      .then(() => Date.now() - inicio)
      .catch(() => null);

    await pagina.click(`.lc-navitem:has-text("${tela.rotulo}")`);
    await pagina.waitForFunction(
      ([rota, sel]) => window.location.pathname === rota && document.querySelector(sel) !== null,
      [tela.rota, tela.conteudo],
      { timeout: 30000 },
    );
    const conteudo = Date.now() - inicio;

    pagina.off('response', contar);
    desta.push({ tela: tela.rotulo, resposta: await esqueleto, conteudo, kb: Math.round(bytes / 1024) });
  }
  return desta;
}

/**
 * A primeira passada é descartada: paga o aquecimento (rota ainda não servida
 * uma vez, conexão com o Supabase ainda não aberta) e mede o que nenhum
 * usuário de verdade vê duas vezes.
 */
await umaPassada();

const passadas = [];
for (let i = 0; i < VEZES; i += 1) passadas.push(await umaPassada());

const resultados = TELAS.map(({ rotulo }) => {
  const minhas = passadas.map((p) => p.find((r) => r.tela === rotulo)).filter(Boolean);
  return {
    tela: rotulo,
    resposta: mediana(minhas.map((r) => r.resposta)),
    conteudo: mediana(minhas.map((r) => r.conteudo)),
    kb: mediana(minhas.map((r) => r.kb)),
    pior: Math.max(...minhas.map((r) => r.conteudo)),
  };
});

console.log(`\nprimeira visita a cada tela (${BASE}) — mediana de ${VEZES} passadas\n`);
console.log('  tela                       resposta   conteúdo      pior   pelo fio');
for (const r of resultados) {
  const resposta = r.resposta === null ? '     —' : `${String(r.resposta).padStart(5)}ms`;
  console.log(
    `  ${r.tela.padEnd(24)} ${resposta}    ${String(r.conteudo).padStart(5)}ms   ` +
      `${String(r.pior).padStart(5)}ms   ${String(r.kb).padStart(4)} KB`,
  );
}
console.log(
  `\n  conteúdo, mediana: ${
    [...resultados].map((r) => r.conteudo).sort((a, b) => a - b)[Math.floor(resultados.length / 2)]
  } ms`,
);

await navegador.close();
