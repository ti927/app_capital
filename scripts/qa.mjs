#!/usr/bin/env node
/**
 * QA interno: percorre as telas exercitando as funções e grava uma captura de
 * cada passo em `qa/`.
 *
 *   npm run qa              claro, 1440x900
 *   npm run qa -- --escuro  tema escuro
 *   npm run qa -- --celular 390x844
 *
 * Roda contra o servidor local. Entra com a primeira conta de
 * dados/credenciais-provisorias.txt (fora do git).
 *
 * Isto não substitui teste automatizado: é conferência visual antes de
 * entregar. Cada passo grava a captura e anota o que encontrou; no fim sai um
 * relatório com o que passou e o que falhou.
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const BASE = process.env.QA_BASE ?? 'http://localhost:3000';
const ESCURO = process.argv.includes('--escuro');
const CELULAR = process.argv.includes('--celular');
const SAIDA = path.join('qa', CELULAR ? 'celular' : ESCURO ? 'escuro' : 'claro');

fs.mkdirSync(SAIDA, { recursive: true });

/** Primeira conta master do arquivo de credenciais provisórias. */
function credenciais() {
  const arquivo = 'dados/credenciais-provisorias.txt';
  if (!fs.existsSync(arquivo)) {
    throw new Error(`${arquivo} não existe — rode scripts/criar-usuarios.mjs antes.`);
  }
  const linha = fs
    .readFileSync(arquivo, 'utf8')
    .split(/\r?\n/)
    .find((l) => l && !l.startsWith('#'));
  const [email, senha] = linha.split('\t');
  return { email, senha };
}

const resultados = [];
let n = 0;

async function passo(pagina, nome, acao) {
  n += 1;
  const rotulo = `${String(n).padStart(2, '0')}-${nome}`;
  try {
    if (acao) await acao();
    await pagina.waitForTimeout(350);
    await pagina.screenshot({ path: path.join(SAIDA, `${rotulo}.png`), fullPage: false });
    resultados.push({ rotulo, ok: true });
    console.log(`  ok    ${rotulo}`);
  } catch (erro) {
    await pagina
      .screenshot({ path: path.join(SAIDA, `${rotulo}-FALHOU.png`) })
      .catch(() => {});
    resultados.push({ rotulo, ok: false, erro: erro.message.split('\n')[0] });
    console.log(`  FALHA ${rotulo}: ${erro.message.split('\n')[0]}`);
  }
}

/** Confere que o diálogo aberto está sobreposto, e não empurrado para o fim. */
async function conferePopUp(pagina, onde) {
  const caixa = await pagina.locator('.lc-overlay').first().boundingBox();
  if (!caixa) throw new Error(`${onde}: overlay não encontrado`);

  const janela = pagina.viewportSize();
  const posicao = await pagina.locator('.lc-overlay').first().evaluate((el) => {
    const s = getComputedStyle(el);
    return { position: s.position, zIndex: s.zIndex };
  });

  if (posicao.position !== 'fixed') {
    throw new Error(`${onde}: overlay com position "${posicao.position}", esperado "fixed"`);
  }
  if (caixa.y > janela.height) {
    throw new Error(`${onde}: diálogo fora da janela (y=${Math.round(caixa.y)})`);
  }

  const dialogo = await pagina.locator('.lc-dialog').first().boundingBox();
  if (dialogo && dialogo.width > janela.width) {
    throw new Error(`${onde}: diálogo mais largo que a janela`);
  }
}

/**
 * Confere que o seletor abre um MENU ancorado no campo — e não um segundo
 * pop-up por cima do diálogo, que era o desenho antigo.
 *
 * O que se exige: o menu existe, está dentro da janela, encosta no gatilho
 * (até 24px de distância vertical) e não aumentou a contagem de `.lc-overlay`.
 */
async function confereMenu(pagina, onde, overlaysAntes) {
  const menu = pagina.locator('.lc-popover').first();
  if (!(await menu.count())) throw new Error(`${onde}: o menu não abriu`);

  const caixa = await menu.boundingBox();
  const janela = pagina.viewportSize();
  if (!caixa) throw new Error(`${onde}: menu sem caixa`);

  if (caixa.y < 0 || caixa.y + caixa.height > janela.height + 1) {
    throw new Error(
      `${onde}: menu fora da janela (y=${Math.round(caixa.y)}, altura=${Math.round(caixa.height)})`,
    );
  }
  if (caixa.x < 0 || caixa.x + caixa.width > janela.width + 1) {
    throw new Error(`${onde}: menu passa da lateral da janela`);
  }

  const gatilho = await pagina.locator('.gatilho--aberto').first().boundingBox();
  if (gatilho) {
    const distancia = Math.min(
      Math.abs(caixa.y - (gatilho.y + gatilho.height)),
      Math.abs(gatilho.y - (caixa.y + caixa.height)),
    );
    if (distancia > 24) {
      throw new Error(`${onde}: menu descolado do campo (${Math.round(distancia)}px)`);
    }
  }

  const agora = await pagina.locator('.lc-overlay').count();
  if (agora > overlaysAntes) {
    throw new Error(`${onde}: o seletor abriu mais um pop-up (${overlaysAntes} -> ${agora})`);
  }
}

const navegador = await chromium.launch();
const contexto = await navegador.newContext({
  viewport: CELULAR ? { width: 390, height: 844 } : { width: 1440, height: 900 },
  colorScheme: ESCURO ? 'dark' : 'light',
  locale: 'pt-BR',
});
const pagina = await contexto.newPage();

const errosDeConsole = [];
pagina.on('console', (m) => m.type() === 'error' && errosDeConsole.push(m.text()));
pagina.on('pageerror', (e) => errosDeConsole.push(`pageerror: ${e.message}`));

console.log(`\nQA — ${CELULAR ? 'celular' : ESCURO ? 'tema escuro' : 'tema claro'} · ${BASE}\n`);

const { email, senha } = credenciais();

// ---------------------------------------------------------------- entrada ---
await passo(pagina, 'login', async () => {
  await pagina.goto(`${BASE}/entrar`, { waitUntil: 'networkidle' });
  await pagina.waitForSelector('text=Bem vindo de volta');
});

await passo(pagina, 'login-preenchido', async () => {
  await pagina.fill('input[name="email"]', email);
  await pagina.fill('input[name="senha"]', senha);
});

await passo(pagina, 'clientes-lista', async () => {
  await pagina.click('button[type="submit"]');
  await pagina.waitForURL('**/clientes', { timeout: 20000 });
  await pagina.waitForSelector('.lista__item', { timeout: 20000 });
});

// ---------------------------------------------------------------- cliente ---
await passo(pagina, 'cliente-dialogo-pelo-nome', async () => {
  // O nome deve abrir a edição — não só o lápis.
  await pagina.locator('.lista__abrir').first().click();
  await pagina.waitForSelector('.lc-overlay', { timeout: 5000 });
  await conferePopUp(pagina, 'diálogo de cliente');
});

await passo(pagina, 'cliente-status-em-menu', async () => {
  // O status abre um menu ancorado no campo — nunca um segundo pop-up.
  const overlaysAntes = await pagina.locator('.lc-overlay').count();
  await pagina.locator('.gatilho').last().click();
  await pagina.waitForTimeout(300);
  await confereMenu(pagina, 'seletor de status', overlaysAntes);
});

await passo(pagina, 'cliente-parecer-com-respiro', async () => {
  await pagina.keyboard.press('Escape');
  await pagina.waitForTimeout(200);
  // Texto longo tem que ter padding em cima: o `.lc-field__input` do design
  // system é medida de campo de uma linha e zerava o respiro do textarea.
  const respiro = await pagina.locator('textarea.lc-field__input').first().evaluate((el) => {
    const s = getComputedStyle(el);
    return { topo: parseFloat(s.paddingTop), lado: parseFloat(s.paddingLeft) };
  });
  if (!(respiro.topo >= 8)) {
    throw new Error(`texto longo com padding-top de ${respiro.topo}px, esperado 8 ou mais`);
  }
  if (!(respiro.lado >= 8)) {
    throw new Error(`texto longo com padding lateral de ${respiro.lado}px`);
  }
});

await passo(pagina, 'cliente-fechado', async () => {
  await pagina.keyboard.press('Escape');
  await pagina.waitForTimeout(200);
  await pagina.keyboard.press('Escape');
  await pagina.waitForTimeout(300);
  if (await pagina.locator('.lc-overlay').count()) {
    throw new Error('o Esc não fechou os diálogos');
  }
});

await passo(pagina, 'cliente-busca', async () => {
  await pagina.fill('input[placeholder="Buscar clientes"]', 'agro');
  await pagina.waitForTimeout(400);
});

await passo(pagina, 'cliente-busca-limpa', async () => {
  await pagina.fill('input[placeholder="Buscar clientes"]', '');
  await pagina.waitForTimeout(300);
});

await passo(pagina, 'cliente-arquivados', async () => {
  await pagina.locator('.arquivados__cabecalho').click();
  await pagina.waitForTimeout(400);
});

// ------------------------------------------------------------- fornecedor ---
await passo(pagina, 'fornecedor-tabela', async () => {
  await pagina.click('a[href="/fornecedores"]');
  await pagina.waitForURL('**/fornecedores', { timeout: 20000 });
  await pagina.waitForSelector('.lc-table', { timeout: 20000 });
});

await passo(pagina, 'fornecedor-aba-tipos', async () => {
  await pagina.click('text=Tipo Operações');
  await pagina.waitForTimeout(500);
});

await passo(pagina, 'fornecedor-dialogo', async () => {
  await pagina.click('text=Fornecedores');
  await pagina.waitForTimeout(400);
  await pagina.locator('.celula-abrir').first().click();
  await pagina.waitForSelector('.lc-overlay', { timeout: 5000 });
  await conferePopUp(pagina, 'diálogo de fornecedor');
});

await passo(pagina, 'fornecedor-tipos-em-menu', async () => {
  const overlaysAntes = await pagina.locator('.lc-overlay').count();
  await pagina.locator('.gatilho').nth(1).click();
  await pagina.waitForTimeout(400);
  await confereMenu(pagina, 'seletor de tipos', overlaysAntes);
});

await passo(pagina, 'fornecedor-fechado', async () => {
  await pagina.keyboard.press('Escape');
  await pagina.waitForTimeout(200);
  await pagina.keyboard.press('Escape');
  await pagina.waitForTimeout(300);
});

// --------------------------------------------------------------- operação ---
await passo(pagina, 'operacao-aba-cliente', async () => {
  await pagina.click('a[href="/operacoes"]');
  await pagina.waitForURL('**/operacoes', { timeout: 20000 });
  await pagina.waitForSelector('.lista__item', { timeout: 20000 });
});

await passo(pagina, 'operacao-aba-fornecedor-vazia', async () => {
  await pagina.click('button[role="tab"]:has-text("Fornecedor")');
  await pagina.waitForTimeout(400);
  // Antes de escolher o fundo não há tabela — é assim em produção.
  if (await pagina.locator('.lc-table').count()) {
    throw new Error('a tabela apareceu antes de escolher o fundo');
  }
});

await passo(pagina, 'operacao-aba-status', async () => {
  await pagina.click('button[role="tab"]:has-text("Status")');
  await pagina.waitForSelector('.painel-status', { timeout: 10000 });
});

await passo(pagina, 'operacao-dialogo', async () => {
  await pagina.click('button[role="tab"]:has-text("Cliente")');
  await pagina.waitForTimeout(400);
  await pagina.locator('.lista__abrir').first().click();
  await pagina.waitForSelector('.lc-overlay', { timeout: 5000 });
  await conferePopUp(pagina, 'diálogo de operação');
});

await passo(pagina, 'operacao-fechado', async () => {
  await pagina.keyboard.press('Escape');
  await pagina.waitForTimeout(400);
});

// ---------------------------------------------------------------- esteira ---
await passo(pagina, 'esteira-lista', async () => {
  await pagina.click('a[href="/esteira"]');
  await pagina.waitForURL('**/esteira', { timeout: 20000 });
  await pagina.waitForSelector('.lista__item', { timeout: 20000 });
});

await passo(pagina, 'esteira-dialogo-checklist', async () => {
  await pagina.locator('.lista__abrir').first().click();
  await pagina.waitForSelector('.lc-overlay', { timeout: 5000 });
  await conferePopUp(pagina, 'diálogo da esteira');
  const itens = await pagina.locator('.checklist__item').count();
  if (itens !== 11) throw new Error(`checklist com ${itens} itens, esperado 11`);
});

await passo(pagina, 'esteira-fechado', async () => {
  await pagina.keyboard.press('Escape');
  await pagina.waitForTimeout(400);
});

// ------------------------------------------------------------------ funil ---
await passo(pagina, 'funil-quadro', async () => {
  await pagina.click('a[href="/funil"]');
  await pagina.waitForURL('**/funil', { timeout: 20000 });
  await pagina.waitForSelector('.funil__coluna', { timeout: 20000 });
});

await passo(pagina, 'funil-cartao-dialogo', async () => {
  await pagina.locator('.funil__cartao-corpo').first().click();
  await pagina.waitForSelector('.lc-overlay', { timeout: 5000 });
  await conferePopUp(pagina, 'diálogo do cartão');
});

await passo(pagina, 'funil-fechado', async () => {
  await pagina.keyboard.press('Escape');
  await pagina.waitForTimeout(400);
});

// ------------------------------------------------------------------ casca ---
await passo(pagina, 'configuracoes-popup', async () => {
  const botao = pagina.locator('header button:has-text("Configurações"), header a:has-text("Configurações")');
  if (await botao.count()) {
    await botao.first().click();
    await pagina.waitForSelector('.lc-overlay', { timeout: 5000 });
    await conferePopUp(pagina, 'pop-up de configurações');
  }
});

await passo(pagina, 'configuracoes-fechado', async () => {
  await pagina.keyboard.press('Escape');
  await pagina.waitForTimeout(400);
});

await passo(pagina, 'tema-alternado', async () => {
  await pagina.locator('header button[title*="tema"]').first().click();
  await pagina.waitForTimeout(500);
});

// ------------------------------------------------------------- relatório ----
await navegador.close();

const falhas = resultados.filter((r) => !r.ok);
console.log(`\n${resultados.length - falhas.length}/${resultados.length} passos ok · capturas em ${SAIDA}/`);

if (falhas.length) {
  console.log('\nFalhas:');
  for (const f of falhas) console.log(`  ${f.rotulo}: ${f.erro}`);
}

if (errosDeConsole.length) {
  const unicos = [...new Set(errosDeConsole)];
  console.log(`\n${unicos.length} erro(s) no console do navegador:`);
  for (const e of unicos.slice(0, 10)) console.log(`  ${e.slice(0, 160)}`);
}

process.exit(falhas.length ? 1 : 0);
