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
import pg from 'pg';
import { chromium } from 'playwright';

const BASE = process.env.QA_BASE ?? 'http://localhost:3000';

/**
 * Conteúdo de verdade, não o esqueleto de carregamento. O esqueleto reusa as
 * classes do conteúdo de propósito, para ter a mesma geometria — então quem
 * espera por seletor precisa dizer que não quer a versão cinza.
 */
const ITEM_REAL = '.lista__item:not(.lista__item--esqueleto)';
const LINHA_REAL = '.lc-table tbody tr:not(.lc-table__linha--esqueleto)';
const COLUNA_REAL = '.funil__coluna:not(.funil__coluna--esqueleto)';

const ESCURO = process.argv.includes('--escuro');
const CELULAR = process.argv.includes('--celular');
const SAIDA = path.join('qa', CELULAR ? 'celular' : ESCURO ? 'escuro' : 'claro');

// Limpa a pasta antes: `39-...-FALHOU.png` de uma corrida velha continuava lá
// depois de o passo voltar a passar, e quem abre as capturas via o erro antigo.
fs.rmSync(SAIDA, { recursive: true, force: true });
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

/**
 * Roda um SQL no banco de dev (DIRECT_URL do .env, só leitura do arquivo).
 * Usado só para desfazer a marca de "notas vistas" da conta de QA.
 */
async function sql(consulta, valores = []) {
  const env = Object.fromEntries(
    fs
      .readFileSync('.env', 'utf8')
      .split(/\r?\n/)
      .filter((l) => l && !l.trimStart().startsWith('#') && l.includes('='))
      .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
  );
  const cliente = new pg.Client({
    connectionString: env.DIRECT_URL || env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await cliente.connect();
  try {
    return await cliente.query(consulta, valores);
  } finally {
    await cliente.end();
  }
}

/**
 * As três formas do QA rodam juntas com a MESMA conta, e "notas vistas" é um
 * estado da conta: sem ordem, uma abriria o sino enquanto a outra espera a
 * bolinha. A trava é um diretório (mkdir é atômico).
 */
const TRAVA_NOTAS = path.join('qa', '.trava-notas');
async function pegaTravaDasNotas() {
  for (let i = 0; i < 240; i++) {
    try {
      fs.mkdirSync(TRAVA_NOTAS);
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error('trava das notas de versão não liberou em 2 minutos');
}
const soltaTravaDasNotas = () => fs.rmSync(TRAVA_NOTAS, { recursive: true, force: true });

// Uma marca por forma: as três corridas rodam juntas na mesma operação.
const MARCA_ETAPA = `QA-TESTE-${path.basename(SAIDA)}`;

const resultados = [];
let n = 0;

async function passo(pagina, nome, acao) {
  n += 1;
  const rotulo = `${String(n).padStart(2, '0')}-${nome}`;
  try {
    if (acao) await acao();
    // 180ms cobre a animacao mais longa do sistema (saida de dialogo,
    // 140ms) com folga. Eram 350ms, de antes de a animacao existir e ser
    // medida: 170ms x 42 passos x 3 formas de espera a toa.
    await pagina.waitForTimeout(180);
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


/**
 * Segura as gravações (server actions) por `ms`, para dar tempo de fotografar
 * o spinner. Só as POSTs das telas; o resto passa direto.
 */
async function seguraGravacoes(pagina, ms) {
  await pagina.route(
    (url) => !url.pathname.startsWith('/_next/'),
    async (rota) => {
      if (rota.request().method() === 'POST') await new Promise((r) => setTimeout(r, ms));
      await rota.continue();
    },
  );
}

/**
 * Salvar um diálogo sem mudar nada — grava os mesmos dados — e conferir o
 * feedback inteiro: spinner no botão, toast no canto, toast que some sozinho,
 * e (o bug de 08/10) o diálogo que abre de novo depois de salvar.
 */
async function feedbackDeSalvar(pagina, { nome, abrir, aviso }) {
  await passo(pagina, `${nome}-salvar-spinner`, async () => {
    await abrir();
    await pagina.waitForSelector('.lc-overlay', { timeout: 5000 });
    await seguraGravacoes(pagina, 1200);
    const botao = pagina.locator('.lc-dialog__foot button[type="submit"]');
    await botao.click();
    await pagina.waitForSelector('.lc-dialog__foot .lc-spinner', { timeout: 3000 });
    if (!(await botao.isDisabled())) throw new Error('o botão de salvar não ficou desabilitado');
    if ((await botao.getAttribute('aria-busy')) !== 'true') throw new Error('o botão não marcou aria-busy');
  });

  await passo(pagina, `${nome}-salvar-toast`, async () => {
    await pagina.waitForSelector('.lc-aviso', { timeout: 8000 });
    await pagina.unroute(() => true).catch(() => {});
    // Espera a entrada (340ms) assentar antes de medir.
    await pagina.waitForTimeout(450);
    const texto = await pagina.locator('.lc-aviso').last().innerText();
    if (!texto.includes(aviso)) throw new Error(`aviso inesperado: "${texto}"`);
    const caixa = await pagina.locator('.lc-aviso').last().boundingBox();
    const janela = pagina.viewportSize();
    if (
      !caixa ||
      caixa.x < 0 ||
      caixa.x + caixa.width > janela.width + 1 ||
      caixa.y < 0 ||
      caixa.y + caixa.height > janela.height + 1
    ) {
      throw new Error('o aviso não cabe na janela');
    }
    if (await pagina.locator('.lc-overlay:not(.lc-overlay--saindo)').count()) {
      throw new Error('o diálogo não fechou depois de salvar');
    }
  });

  await passo(pagina, `${nome}-salvar-reabre`, async () => {
    // O bug: depois de salvar uma vez, o diálogo não abria mais.
    await abrir();
    await pagina.waitForTimeout(900);
    if (!(await pagina.locator('.lc-overlay:not(.lc-overlay--saindo)').count())) {
      throw new Error('o diálogo não abriu de novo depois de salvar');
    }
  });

  await passo(pagina, `${nome}-salvar-toast-some`, async () => {
    await pagina.keyboard.press('Escape');
    await pagina.waitForSelector('.lc-aviso', { state: 'detached', timeout: 6000 });
  });
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
  if (!(await pagina.locator('input[name="senha"]').count())) {
    throw new Error('sem formulário de senha — ponha ENTRADA_COM_SENHA=1 no .env e reinicie o servidor');
  }
  await pagina.fill('input[name="email"]', email);
  await pagina.fill('input[name="senha"]', senha);
});

await passo(pagina, 'clientes-lista', async () => {
  await pagina.click('button[type="submit"]');
  await pagina.waitForURL('**/clientes', { timeout: 20000 });
  await pagina.waitForSelector(ITEM_REAL, { timeout: 20000 });
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

await passo(pagina, 'cliente-esc-fecha-so-o-menu', async () => {
  // Esc no menu fecha o menu e deixa o diálogo de pé. Já fechou os dois.
  await pagina.keyboard.press('Escape');
  await pagina.waitForTimeout(250);
  if (await pagina.locator('.lc-popover').count()) throw new Error('o Esc não fechou o menu');
  if (!(await pagina.locator('.lc-dialog').count())) {
    throw new Error('o Esc fechou o diálogo junto com o menu');
  }
});

await passo(pagina, 'cliente-parecer-com-respiro', async () => {
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

await feedbackDeSalvar(pagina, {
  nome: 'cliente',
  aviso: 'Cliente salvo',
  abrir: () => pagina.locator('.lista__abrir').first().click(),
});

await passo(pagina, 'cliente-brilho-no-salvo', async () => {
  // O brilho dura ~1,2s: salva de novo e olha já na volta.
  await pagina.locator('.lista__abrir').first().click();
  await pagina.waitForSelector('.lc-overlay', { timeout: 5000 });
  await pagina.locator('.lc-dialog__foot button[type="submit"]').click();
  await pagina.waitForSelector('.lista__item.lc-salvo', { timeout: 8000 });
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
  await pagina.waitForSelector(LINHA_REAL, { timeout: 20000 });
});

await passo(pagina, 'fornecedor-aba-tipos', async () => {
  await pagina.click('text=Tipo Operações');
  await pagina.waitForTimeout(500);
});

await passo(pagina, 'fornecedor-tipos-sem-reticencias', async () => {
  // 1º e 2º Linha mostram todos os fundos, quebrando linha — sem reticências.
  const r = await pagina.evaluate(() => {
    const celulas = [...document.querySelectorAll('.matriz td.matriz__celula')];
    const cortadas = celulas.filter((td) => {
      const estilo = getComputedStyle(td);
      return estilo.textOverflow === 'ellipsis' || estilo.whiteSpace === 'nowrap' || td.scrollWidth > td.clientWidth + 1;
    });
    const nomes = [...document.querySelectorAll('.matriz__nome')];
    const largos = nomes.filter((n) => n.scrollWidth > n.clientWidth + 1);
    const maior = [...document.querySelectorAll('.matriz__nomes')].sort(
      (a, b) => b.children.length - a.children.length,
    )[0];
    maior?.scrollIntoView({ block: 'center' });
    return { cortadas: cortadas.length, largos: largos.length, total: nomes.length };
  });
  if (!r.total) throw new Error('nenhum nome em 1º/2º Linha para conferir');
  if (r.cortadas || r.largos) throw new Error(`nomes cortados: ${r.cortadas} células, ${r.largos} nomes`);
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

await feedbackDeSalvar(pagina, {
  nome: 'fornecedor',
  aviso: 'Fundo salvo',
  abrir: () => pagina.locator('.celula-abrir').first().click(),
});

// --------------------------------------------------------------- operação ---
await passo(pagina, 'operacao-aba-cliente', async () => {
  await pagina.click('a[href="/operacoes"]');
  await pagina.waitForURL('**/operacoes', { timeout: 20000 });
  await pagina.waitForSelector(ITEM_REAL, { timeout: 20000 });
});

await passo(pagina, 'operacao-aba-fornecedor-vazia', async () => {
  await pagina.click('button[role="tab"]:has-text("Fornecedor")');
  await pagina.waitForTimeout(400);
  // Antes de escolher o fundo não há tabela — é assim em produção.
  if (await pagina.locator('.lc-table').count()) {
    throw new Error('a tabela apareceu antes de escolher o fundo');
  }
});

await passo(pagina, 'operacao-aba-fornecedor-tabela', async () => {
  await pagina.click('.lc-field:has-text("Fundo parceiro") .gatilho');
  await pagina.waitForSelector('.lc-popover .opcoes__item', { timeout: 5000 });
  await pagina.locator('.lc-popover .opcoes__item').first().click();
  // Espera o conteúdo: o filtro de status no cabeçalho só existe com a tabela.
  await pagina.waitForSelector('.lc-table .th-filtro .gatilho', { timeout: 10000 });
});

await passo(pagina, 'operacao-aba-fornecedor-filtro-status', async () => {
  await pagina.click('.th-filtro .gatilho');
  await pagina.waitForSelector('.lc-popover .opcoes__item', { timeout: 5000 });
  // O gatilho mora num <th> com overflow:hidden — o menu não pode sair cortado.
  await confereMenu(pagina, 'filtro de status da aba Fornecedor', 0);
});

await passo(pagina, 'operacao-aba-fornecedor-filtrada', async () => {
  // A segunda opção é o primeiro status de verdade (a primeira é "Todos").
  await pagina.locator('.lc-popover .opcoes__item').nth(1).click();
  await pagina.waitForSelector('.lc-popover', { state: 'detached', timeout: 5000 });
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

await passo(pagina, 'operacao-dialogo-ordem', async () => {
  // Ordem pedida em 05/10: Observações → Declínios → Limites → Lista de Fornecedores.
  if (!(await pagina.locator('text=Lista de Fornecedores').count())) return;
  const topo = async (texto) =>
    (await pagina.locator(`.lc-dialog >> text="${texto}"`).first().boundingBox())?.y ?? -1;
  await pagina.locator('.lc-dialog >> text="Declínios"').first().scrollIntoViewIfNeeded();
  const [obs, dec, lim, lista] = [
    await topo('Observações'),
    await topo('Declínios'),
    await topo('Limites/fundos assinados'),
    await topo('Lista de Fornecedores'),
  ];
  if (!(obs < dec && dec < lim && lim < lista)) {
    throw new Error(`ordem errada: obs ${obs}, declínios ${dec}, limites ${lim}, lista ${lista}`);
  }
});

await passo(pagina, 'operacao-linha-inclusao-ordem', async () => {
  // Pedido de 08/10: na linha de inclusão, primeiro "Fundo", depois "Tipo de operação".
  if (!(await pagina.locator('.criar-etapa').count())) return;
  const rotulos = await pagina
    .locator('.criar-etapa .gatilho')
    .evaluateAll((els) => els.map((el) => el.innerText.trim()));
  if (rotulos[0] !== 'Fundo' || rotulos[1] !== 'Tipo de operação') {
    throw new Error(`ordem da linha de inclusão: ${rotulos.slice(0, 2).join(' | ')}`);
  }
  await pagina.locator('.criar-etapa').scrollIntoViewIfNeeded();
});

await passo(pagina, 'operacao-etapa-incluir-e-alterar', async () => {
  // O bug de 08/10 ("depois que registra um fundo, ao alterar o pop-up não abre"):
  // inclui uma etapa de teste, abre o lápis e os seletores da linha, e apaga.
  if (!(await pagina.locator('.criar-etapa').count())) return;
  const escolher = async (indice) => {
    await pagina.locator('.criar-etapa .gatilho').nth(indice).click();
    await pagina.waitForSelector('.lc-popover', { timeout: 3000 });
    await pagina.locator('.lc-popover .opcoes__item').first().click();
    await pagina.waitForTimeout(150);
  };
  const linha = pagina.locator('.tabela-etapas tbody tr', { hasText: MARCA_ETAPA });
  try {
    await escolher(0); // Fundo
    await escolher(1); // Tipo de operação
    await pagina.locator('.criar-etapa textarea').fill(MARCA_ETAPA);
    await seguraGravacoes(pagina, 900);
    await pagina.locator('button[aria-label="Adicionar etapa"]').click();
    await pagina.waitForSelector('.criar-etapa .lc-spinner', { timeout: 3000 });
    await pagina.waitForSelector('.lc-aviso', { timeout: 8000 });
    await pagina.unroute(() => true).catch(() => {});
    await linha.first().waitFor({ timeout: 8000 });

    // A linha de inclusão volta limpa e seus seletores continuam abrindo.
    await pagina.locator('.criar-etapa .gatilho').first().click();
    await pagina.waitForSelector('.lc-popover', { timeout: 3000 });
    await pagina.keyboard.press('Escape');
    await pagina.waitForTimeout(200);

    // Lápis da linha recém-incluída: os três seletores abrem o menu.
    await linha.first().locator('button[aria-label="Editar"]').click();
    for (let i = 0; i < 3; i += 1) {
      await linha.first().locator('.gatilho').nth(i).click();
      await pagina.waitForSelector('.lc-popover', { timeout: 3000 });
      await pagina.keyboard.press('Escape');
      await pagina.waitForTimeout(200);
    }
    await linha.first().locator('button[aria-label="Cancelar"]').click();
  } finally {
    await pagina.unroute(() => true).catch(() => {});
    if (await linha.count()) {
      await linha.first().locator('button[aria-label="Deletar"]').click();
      await linha.first().waitFor({ state: 'detached', timeout: 8000 }).catch(() => {});
    }
  }
});

await passo(pagina, 'operacao-email', async () => {
  // Abre o envio e confere que carregou os destinatários (ou diz que não há)
  // e as três chaves. Não envia nada (specs/13).
  const botao = pagina.locator('.lc-dialog__foot button:has-text("Enviar Email")');
  if (!(await botao.count())) return; // operação sem cliente não tem envio
  await botao.click();
  await pagina.waitForSelector('text=Envio de Email', { timeout: 5000 });
  await pagina.waitForSelector('text=Carregando os e-mails do cliente', { state: 'detached', timeout: 15000 });
  await pagina.waitForSelector('text=Fundos (Resumido)', { timeout: 5000 });
  // O texto padrão do Bubble já vem no campo, editável (specs/13).
  const textoDoEmail = await pagina.locator('.email-status textarea').last().inputValue();
  if (!textoDoEmail.startsWith('Olá, segue atualizações') || !textoDoEmail.includes('att. Lure Capital')) {
    throw new Error(`o texto padrão do e-mail não veio: ${textoDoEmail.slice(0, 60)}`);
  }
});

await passo(pagina, 'operacao-email-previa', async () => {
  // Marcar cada chave já mostra o print como vai no e-mail (specs/13) — sem
  // botão de prévia — e a página não muda de tema durante o print.
  if (!(await pagina.locator('text=Envio de Email').count())) return;
  const temaAntes = await pagina.evaluate(() => document.documentElement.getAttribute('data-theme'));
  for (const rotulo of ['Observação', 'Fundos', 'Fundos (Resumido)']) {
    await pagina.locator(`.email-status label.interruptor:has-text("${rotulo}") input`).first().check();
  }
  if (await pagina.locator('button:has-text("Ver prévia")').count()) throw new Error('voltou o botão de prévia');
  await pagina.waitForFunction(
    () => document.querySelectorAll('.email-status__print').length === 3 && !document.body.innerText.includes('Preparando o print'),
    null,
    { timeout: 20000 },
  );
  const temaDepois = await pagina.evaluate(() => document.documentElement.getAttribute('data-theme'));
  if (temaAntes !== temaDepois) throw new Error(`o tema da página mudou durante o print (${temaAntes} -> ${temaDepois})`);
  await pagina.locator('.email-status__previa').scrollIntoViewIfNeeded();
});

await passo(pagina, 'operacao-email-fechado', async () => {
  if (!(await pagina.locator('text=Envio de Email').count())) return;
  await pagina.locator('.lc-dialog__foot button:has-text("Cancelar")').last().click();
  await pagina.waitForTimeout(400);
  if (await pagina.locator('text=Envio de Email').count()) throw new Error('o envio não fechou');
  if (!(await pagina.locator('text=Editar operação').count())) throw new Error('fechar o envio fechou a operação');
});

await passo(pagina, 'operacao-salvar-spinner', async () => {
  await seguraGravacoes(pagina, 1200);
  await pagina.locator('.lc-dialog__foot button[type="submit"]').click();
  await pagina.waitForSelector('.lc-dialog__foot .lc-spinner', { timeout: 3000 });
});

await passo(pagina, 'operacao-salvar-toast', async () => {
  await pagina.waitForSelector('.lc-aviso', { timeout: 8000 });
  await pagina.unroute(() => true).catch(() => {});
  const texto = await pagina.locator('.lc-aviso').last().innerText();
  if (!texto.includes('Operação salva')) throw new Error(`aviso inesperado: "${texto}"`);
});

await passo(pagina, 'operacao-brilho-no-salvo', async () => {
  // A lista dá o brilho na operação salva (a classe dura ~1,2s).
  if (!(await pagina.locator('.lista__item.lc-salvo').count())) {
    throw new Error('nenhuma linha de operação recebeu o brilho');
  }
});

await passo(pagina, 'operacao-salvar-reabre', async () => {
  await pagina.waitForSelector('.lc-aviso', { state: 'detached', timeout: 6000 });
  await pagina.locator('.lista__abrir').first().click();
  await pagina.waitForTimeout(700);
  if (!(await pagina.locator('.lc-overlay:not(.lc-overlay--saindo)').count())) {
    throw new Error('a operação não abriu de novo depois de salvar');
  }
});

await passo(pagina, 'operacao-fechado', async () => {
  await pagina.keyboard.press('Escape');
  await pagina.waitForTimeout(400);
});

await passo(pagina, 'operacao-nova-faturamento-do-cliente', async () => {
  // Escolher o cliente numa operação nova traz o faturamento do cadastro dele
  // (pedido de 08/10/2026). Escolhe clientes até achar um com faturamento;
  // não salva nada — fecha com Esc.
  const nova = pagina.locator('button:has-text("Nova Operação")').first();
  if (!(await nova.count())) return;
  await nova.click();
  await pagina.waitForSelector('text=Escolher cliente', { timeout: 5000 });
  const campo = pagina.locator('.lc-dialog input[name="faturamento_anual"]');
  for (let i = 0; i < 12 && !(await campo.inputValue()); i += 1) {
    await pagina.locator('.lc-dialog .lc-field:has-text("Escolher cliente") .gatilho').click();
    const opcoes = pagina.locator('.opcoes__item:visible');
    if (i >= (await opcoes.count())) break;
    await opcoes.nth(i).click();
    await pagina.waitForTimeout(150);
  }
  if (!(await campo.inputValue())) throw new Error('nenhum cliente trouxe o faturamento para a operação');
  await campo.scrollIntoViewIfNeeded();
});

await passo(pagina, 'operacao-nova-fechada', async () => {
  if (!(await pagina.locator('text=Escolher cliente').count())) return;
  await pagina.keyboard.press('Escape');
  await pagina.waitForTimeout(400);
});

// ---------------------------------------------------------------- esteira ---
await passo(pagina, 'esteira-lista', async () => {
  await pagina.click('a[href="/esteira"]');
  await pagina.waitForURL('**/esteira', { timeout: 20000 });
  await pagina.waitForSelector(ITEM_REAL, { timeout: 20000 });
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
  await pagina.waitForSelector(COLUNA_REAL, { timeout: 20000 });
});

let arrastando = false;
await passo(pagina, 'funil-arrastando', async () => {
  // Pega o primeiro cartão e o segura sobre a segunda coluna: a captura sai
  // no meio do arrasto — cartão pendurado e inclinado, vaga pontilhada na
  // coluna de destino (arrastar.ts). O passo seguinte cancela com Esc: o QA
  // não muda cartão de lugar.
  const colunas = pagina.locator('.funil__coluna[data-etapa]');
  if ((await colunas.count()) < 2) return;
  const cartao = colunas.nth(0).locator('[data-cartao]').first();
  if (!(await cartao.count())) return;
  await cartao.scrollIntoViewIfNeeded();
  const de = await cartao.boundingBox();
  const destino = colunas.nth(1);
  await destino.scrollIntoViewIfNeeded();
  const para = await destino.boundingBox();
  if (!de || !para) return;
  await pagina.mouse.move(de.x + de.width / 2, de.y + 30);
  await pagina.mouse.down();
  arrastando = true;
  const passos = 14;
  for (let i = 1; i <= passos; i += 1) {
    await pagina.mouse.move(
      de.x + de.width / 2 + ((para.x + para.width / 2 - (de.x + de.width / 2)) * i) / passos,
      de.y + 30 + ((para.y + 140 - (de.y + 30)) * i) / passos,
    );
    await pagina.waitForTimeout(16);
  }
  await pagina.waitForSelector('.funil__flutuante', { timeout: 3000 });
  await pagina.waitForSelector('.funil__coluna--alvo .funil__vaga', { timeout: 3000 });
});

await passo(pagina, 'funil-arrasto-cancelado', async () => {
  if (!arrastando) return;
  await pagina.keyboard.press('Escape');
  await pagina.mouse.up();
  await pagina.waitForTimeout(300);
  if (await pagina.locator('.funil__flutuante, .funil__vaga').count()) {
    throw new Error('Esc não cancelou o arrasto');
  }
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

// --------------------------------------------- funil: tarefas (frente A) ---
// Acrescentado no fim do roteiro, depois do bloco da casca (specs/08a, A6).
// O passo do tema deixou o tema trocado — desfaz antes, senão as capturas
// destes passos saem no tema errado na rodada clara e na escura.
await passo(pagina, 'tema-de-volta', async () => {
  await pagina.locator('header button[title*="tema"]').first().click();
  await pagina.waitForTimeout(500);
});

await passo(pagina, 'funil-aba-tarefas', async () => {
  await pagina.goto(`${BASE}/funil`);
  await pagina.waitForSelector('.abas__item', { timeout: 20000 });
  await pagina.locator('.abas__item:has-text("Tarefas")').click();
  await pagina.waitForSelector('.tarefas__corpo', { timeout: 10000 });
  if (!new URL(pagina.url()).searchParams.get('aba')) {
    throw new Error('a aba não foi espelhada em ?aba=tarefas');
  }
});

await passo(pagina, 'funil-calendario-dia', async () => {
  // Filtrar por um dia é o que o calendário faz de útil: tem que sair na captura.
  await pagina.locator('.cal__dia:not(.cal__dia--fora)').nth(10).click();
  await pagina.waitForSelector('.cal__dia--escolhido', { timeout: 5000 });
});

/** Hoje em `yyyy-mm-dd` local — o `toISOString` seria UTC e erraria o dia. */
function hojeISO() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/**
 * O título leva a forma no fim porque as três corridas rodam em paralelo
 * (`npm run qa:tudo`) contra o MESMO banco: com título igual, uma corrida
 * enxergava a tarefa da outra e o clique batia em dois elementos.
 */
const TITULO_QA = `QA — tarefa de teste ${CELULAR ? 'celular' : ESCURO ? 'escuro' : 'claro'}`;
let tarefaCriada = false;

await passo(pagina, 'funil-tarefa-nova', async () => {
  await pagina.locator('.cal__limpar').click();
  const botao = pagina.locator('.tarefas__filtro-acao button');
  if (await botao.isDisabled()) {
    // Sem cartão no quadro não há tarefa possível — a tela tem que dizer por quê.
    await pagina.waitForSelector('.tarefas__aviso', { timeout: 5000 });
    return;
  }
  await botao.click();
  await pagina.waitForSelector('.lc-overlay', { timeout: 5000 });
  await conferePopUp(pagina, 'diálogo de nova tarefa');

  // Preenche de verdade: lista vazia não mostra agrupamento nem vencida.
  await pagina.locator('#forma-tarefa .lc-field:has-text("Cartão") .gatilho').click();
  // A opção pelo item visível, e não por `.lc-overlay`: o seletor pode deixar
  // de ser pop-up e virar menu ancorado sem que este passo precise mudar.
  await pagina.locator('.opcoes__item:visible').first().click();
  await pagina.fill('#titulo', TITULO_QA);
  await pagina.fill('#prazo', hojeISO());
  await pagina.waitForTimeout(200);
});

await passo(pagina, 'funil-tarefa-reuniao-convite', async () => {
  // Tipo "Reunião" mostra a situação na agenda e o interruptor de convite;
  // ligar o interruptor mostra o e-mail (specs/11). Sem hora, nenhum evento
  // nasce no Google quando a tarefa de teste for criada no passo seguinte.
  if (!(await pagina.locator('#forma-tarefa').count())) return;
  await pagina.locator('#forma-tarefa .lc-field:has-text("Tipo") .gatilho').click();
  await pagina.locator('.opcoes__item:visible:has-text("Reunião")').first().click();
  const interruptor = pagina.locator('#forma-tarefa label:has-text("Convidar o contato do cliente") input');
  await interruptor.waitFor({ timeout: 5000 });
  await interruptor.check();
  await pagina.waitForSelector('#forma-tarefa input[name="email_convidado"]', { timeout: 5000 });
  await conferePopUp(pagina, 'diálogo de reunião com convite');
});

await passo(pagina, 'funil-tarefa-criada', async () => {
  const criar = pagina.locator('.lc-dialog__foot button:has-text("Criar tarefa")');
  if (!(await criar.count())) return;
  await criar.click();
  await pagina.waitForSelector(`.tarefas__linha:has-text("${TITULO_QA}")`, { timeout: 15000 });
  tarefaCriada = true;
  // A tarefa de hoje tem que cair no grupo "Hoje", com a contagem ao lado.
  await pagina.waitForSelector('.tarefas__grupo-topo:has-text("Hoje")', { timeout: 5000 });
});

await passo(pagina, 'funil-tarefa-concluida', async () => {
  if (!tarefaCriada) return;
  await pagina.locator(`.tarefas__linha:has-text("${TITULO_QA}") .caixa`).click();
  await pagina.waitForSelector('.tarefas__grupo-topo:has-text("Concluídas")', { timeout: 15000 });
});

await passo(pagina, 'funil-tarefa-no-cartao', async () => {
  if (!tarefaCriada) return;
  // Concluídas nasce recolhido: abre o grupo antes de procurar a linha.
  await pagina.locator('.tarefas__grupo-topo:has-text("Concluídas")').click();
  await pagina.locator(`.tarefas__linha:has-text("${TITULO_QA}") .tarefas__cartao`).first().click();
  await pagina.waitForSelector('.lc-overlay', { timeout: 5000 });
  await conferePopUp(pagina, 'cartão aberto pela tarefa');
});

await passo(pagina, 'funil-tarefa-excluida', async () => {
  if (!tarefaCriada) {
    await pagina.keyboard.press('Escape');
    return;
  }
  // Limpa o que o QA criou: a base não fica com lixo de teste. Escopo no
  // diálogo aberto — a mesma linha existe no painel atrás dele. Em laço, para
  // varrer também o que uma rodada anterior interrompida tenha deixado.
  const lixo = () =>
    pagina.locator(`.lc-dialog .lista__item:has-text("${TITULO_QA}") button[title="Excluir tarefa"]`);
  // Espera a linha sumir em vez de um tempo fixo: com as três formas rodando
  // juntas (`qa:tudo`) o servidor local demora mais que 1,5s para excluir, e
  // a espera fixa dava "sobrou tarefa" com a exclusão ainda a caminho.
  for (let i = 0; i < 5 && (await lixo().count()); i += 1) {
    const antes = await lixo().count();
    await lixo().first().click();
    for (let t = 0; t < 40 && (await lixo().count()) >= antes; t += 1) await pagina.waitForTimeout(250);
  }
  if (await lixo().count()) throw new Error('sobrou tarefa de teste no cartão');
  await pagina.keyboard.press('Escape');
  await pagina.waitForTimeout(600);
});

await passo(pagina, 'funil-virar-cliente', async () => {
  await pagina.locator('.abas__item:has-text("Quadro")').click();
  const acao = pagina.locator('.funil__cartao-acao').first();
  if (!(await acao.count())) return;
  await acao.click();
  await pagina.waitForSelector('.lc-overlay', { timeout: 5000 });
  await conferePopUp(pagina, 'confirmação de cadastrar como cliente');
});

await passo(pagina, 'funil-virar-cliente-fechado', async () => {
  await pagina.keyboard.press('Escape');
  await pagina.waitForTimeout(400);
});

await passo(pagina, 'clientes-puxar-do-funil', async () => {
  await pagina.goto(`${BASE}/clientes`);
  await pagina.locator('button:has-text("Novo Cliente")').click();
  await pagina.waitForSelector('.lc-overlay', { timeout: 5000 });
  const puxar = pagina.locator('.lc-field:has-text("Puxar do funil")');
  if (!(await puxar.count())) throw new Error('"Puxar do funil" não apareceu no cliente novo');
  await conferePopUp(pagina, 'diálogo de cliente novo');
});

await passo(pagina, 'clientes-puxar-do-funil-fechado', async () => {
  await pagina.keyboard.press('Escape');
  await pagina.waitForTimeout(400);
});

// ------------------------------------- cliente novo com "Quem visualiza" ---
const NOME_QA_CLIENTE = `QA-TESTE-visualizadores-${path.basename(SAIDA)}`;

/** Apaga o cliente de teste pela tela, se existir (sobra de corrida que caiu). */
async function apagaClienteDeTeste(pagina) {
  const item = () => pagina.locator(`.lista__item:has-text("${NOME_QA_CLIENTE}")`);
  for (let tentativa = 0; tentativa < 4; tentativa++) {
    await pagina.goto(`${BASE}/clientes`);
    await pagina.waitForSelector(ITEM_REAL, { timeout: 20000 });
    await pagina.fill('input[placeholder="Buscar clientes"]', NOME_QA_CLIENTE);
    await pagina.waitForTimeout(300);
    if (!(await item().count())) return;
    await item().first().locator('button[title="Deletar"]').click();
    await pagina.locator('.lc-dialog__foot button:has-text("Deletar")').click();
    await pagina.waitForTimeout(1500);
  }
  throw new Error('não consegui apagar o cliente de teste');
}

await passo(pagina, 'clientes-novo-quem-visualiza', async () => {
  await apagaClienteDeTeste(pagina);
  await pagina.locator('button:has-text("Novo Cliente")').click();
  await pagina.waitForSelector('.lc-overlay', { timeout: 5000 });
  const campo = pagina.locator('.lc-field:has-text("Quem visualiza")');
  if (!(await campo.count())) throw new Error('"Quem visualiza" não apareceu no cliente novo');
  if (await campo.locator('button.gatilho').isDisabled()) {
    throw new Error('"Quem visualiza" está desabilitado para master no cliente novo');
  }
  await campo.scrollIntoViewIfNeeded();
});

await passo(pagina, 'clientes-novo-com-dois-visualizadores', async () => {
  await pagina.fill('input[name="nome_razao"]', NOME_QA_CLIENTE);
  await pagina.locator('.lc-field:has-text("Quem visualiza") button.gatilho').click();
  await pagina.waitForSelector('.lc-popover', { timeout: 5000 });
  const opcoes = pagina.locator('.lc-popover .opcoes__item');
  if ((await opcoes.count()) < 2) throw new Error('menos de duas pessoas para escolher');
  await opcoes.nth(0).click();
  await opcoes.nth(1).click();
  await pagina.locator('.lc-popover__pe button:has-text("Pronto")').click();
  await pagina.waitForSelector('.lc-popover', { state: 'detached', timeout: 3000 });
  const fichas = await pagina.locator('.lc-field:has-text("Quem visualiza") .ficha').count();
  if (fichas !== 2) throw new Error(`esperava 2 fichas, vi ${fichas}`);
  await pagina.locator('.lc-dialog__foot button[type="submit"]').click();
  await pagina.waitForSelector('.lc-aviso', { timeout: 8000 });
});

await passo(pagina, 'clientes-novo-visualizadores-gravados', async () => {
  await pagina.waitForSelector('.lc-overlay', { state: 'detached', timeout: 5000 });
  await pagina.fill('input[placeholder="Buscar clientes"]', NOME_QA_CLIENTE);
  await pagina.waitForTimeout(300);
  await pagina.locator(`.lista__item:has-text("${NOME_QA_CLIENTE}") .lista__abrir`).click();
  await pagina.waitForSelector('.lc-overlay', { timeout: 5000 });
  await pagina.waitForTimeout(300);
  // Os dois escolhidos, mais quem cadastrou (se não for um dos dois).
  const campo = pagina.locator('.lc-field:has-text("Quem visualiza")');
  const fichas = (await campo.locator('.ficha').count()) + ((await campo.locator('.apoio').count()) ? 1 : 0);
  if (fichas < 2) throw new Error(`os vínculos não foram gravados (fichas: ${fichas})`);
});

await passo(pagina, 'clientes-novo-teste-apagado', async () => {
  await pagina.keyboard.press('Escape');
  await pagina.waitForTimeout(400);
  await apagaClienteDeTeste(pagina);
  if (await pagina.locator(`.lista__item:has-text("${NOME_QA_CLIENTE}")`).count()) {
    throw new Error('o cliente de teste não foi apagado');
  }
});

// ------------------------------------------------ sino de notas de versão ---
// Exige NOTAS_DE_VERSAO_EMAILS com o e-mail da conta de QA no servidor de dev.
const SINO = 'button[title="Notas de versão"]';
let travaDasNotas = false;
try {
  await passo(pagina, 'notas-sino-com-bolinha', async () => {
    await pegaTravaDasNotas();
    travaDasNotas = true;
    await sql('update perfil set notas_vistas = null where lower(email) = lower($1)', [email]);
    await pagina.goto(`${BASE}/clientes`);
    await pagina.waitForSelector(SINO, { timeout: 20000 }).catch(() => {
      throw new Error('sem sino — suba o dev com NOTAS_DE_VERSAO_EMAILS=<email da conta de QA>');
    });
    await pagina.waitForSelector(`${SINO} [data-testid="notas-bolinha"]`, { timeout: 5000 });
  });

  await passo(pagina, 'notas-painel-aberto', async () => {
    await pagina.locator(SINO).click();
    await pagina.waitForSelector('.lc-notas', { timeout: 5000 });
    await pagina.waitForTimeout(250);
    if (await pagina.locator('.lc-overlay').count()) throw new Error('o painel abriu como diálogo, com véu');
    if (!(await pagina.locator('.lc-notas__rodada').count())) throw new Error('o painel abriu sem notas');
    const caixa = await pagina.locator('.lc-notas').boundingBox();
    const janela = pagina.viewportSize();
    if (!caixa || caixa.x < 0 || caixa.x + caixa.width > janela.width + 1 || caixa.y + caixa.height > janela.height + 1) {
      throw new Error('o painel não cabe na janela');
    }
    if (await pagina.locator('[data-testid="notas-bolinha"]').count()) {
      throw new Error('a bolinha continuou depois de abrir');
    }
  });

  await passo(pagina, 'notas-fecha-clicando-fora', async () => {
    // Canto vazio da barra de cima: no celular o painel cobre o resto.
    await pagina.mouse.click(4, 4);
    await pagina.waitForSelector('.lc-notas', { state: 'detached', timeout: 3000 });
  });

  await passo(pagina, 'notas-fecha-com-esc-e-fica-visto', async () => {
    await pagina.locator(SINO).click();
    await pagina.waitForSelector('.lc-notas', { timeout: 3000 });
    await pagina.keyboard.press('Escape');
    await pagina.waitForSelector('.lc-notas', { state: 'detached', timeout: 3000 });
    // Visto vale no banco: espera a gravação (a primeira chamada compila a
    // ação no dev) e confere que recarregar não traz a bolinha de volta.
    for (let i = 0; i < 40; i++) {
      const { rows } = await sql('select notas_vistas from perfil where lower(email) = lower($1)', [email]);
      if (rows[0]?.notas_vistas) break;
      await pagina.waitForTimeout(500);
    }
    await pagina.reload();
    await pagina.waitForSelector(SINO, { timeout: 20000 });
    if (await pagina.locator('[data-testid="notas-bolinha"]').count()) {
      throw new Error('a bolinha voltou depois de recarregar — o visto não foi gravado');
    }
  });
} finally {
  if (travaDasNotas) {
    // A conta de QA volta a "não viu": a próxima corrida precisa da bolinha.
    await sql('update perfil set notas_vistas = null where lower(email) = lower($1)', [email]).catch(() => {});
    soltaTravaDasNotas();
  }
}


// ------------------------------------------------------------- relatório ----
// ------------------------------------------------- funil: painéis e cartão ---
await passo(pagina, 'funil-painel-tags', async () => {
  await pagina.click('a[href="/funil"]');
  await pagina.waitForURL('**/funil', { timeout: 20000 });
  await pagina.waitForSelector(COLUNA_REAL, { timeout: 20000 });
  await pagina.locator('.tela__acoes button:has-text("Tags")').click();
  await pagina.waitForSelector('.lc-dialog', { timeout: 5000 });
  if (!(await pagina.locator('.gestao__linha').count())) {
    throw new Error('o painel de tags abriu vazio');
  }
  await conferePopUp(pagina, 'painel de tags');
});
await passo(pagina, 'funil-painel-colunas', async () => {
  await pagina.keyboard.press('Escape');
  await pagina.waitForTimeout(300);
  await pagina.locator('.tela__acoes button:has-text("Colunas no fluxo")').click();
  await pagina.waitForSelector('.lc-dialog', { timeout: 5000 });
  if (!(await pagina.locator('.gestao__linha .interruptor').count())) {
    throw new Error('o painel de colunas abriu sem os interruptores');
  }
});
await passo(pagina, 'funil-cartao-sem-rolagem', async () => {
  await pagina.keyboard.press('Escape');
  await pagina.waitForTimeout(300);
  await pagina.locator('.funil__cartao-corpo').first().click();
  await pagina.waitForSelector('.lc-dialog', { timeout: 5000 });
  await pagina.waitForTimeout(250);
  // A promessa do cartão em tela cheia: tudo à vista, sem barra de rolagem.
  // No celular não vale — lá a tela é estreita e rolar é o normal.
  if (CELULAR) return;
  const sobra = await pagina.locator('.lc-dialog__body').evaluate((el) => el.scrollHeight - el.clientHeight);
  if (sobra > 8) throw new Error(`o cartão precisa rolar ${sobra}px para mostrar tudo`);
});
await passo(pagina, 'funil-cartao-cheio-fechado', async () => {
  await pagina.keyboard.press('Escape');
  await pagina.waitForTimeout(300);
});
// -------------------------------------------- esteira: só os instrumentos ---
await passo(pagina, 'esteira-instrumentos-da-esteira', async () => {
  await pagina.click('a[href="/esteira"]');
  await pagina.waitForURL('**/esteira', { timeout: 20000 });
  await pagina.waitForSelector(ITEM_REAL, { timeout: 20000 });
  await pagina.locator('.lista__abrir').first().click();
  await pagina.waitForSelector('.lc-dialog', { timeout: 5000 });
  // Oito instrumentos, não os 31 tipos de operação: CRA, CRI, CR, FIDC
  // Proprietário, FIAGRO, FII, SLB e Debêntures.
  const quantos = await pagina.locator('.tipos__lista--instrumentos .tipos__tag').count();
  if (quantos !== 8) throw new Error(`a esteira ofereceu ${quantos} instrumentos, esperado 8`);
});
await passo(pagina, 'esteira-instrumento-escolhido', async () => {
  await pagina.locator('.tipos__lista--instrumentos .tipos__tag:has-text("CRA")').first().click();
  await pagina.waitForTimeout(400);
  // Escolher o instrumento abre o bloco de campos daquele instrumento.
  if (!(await pagina.locator('.lc-dialog').getByText('CRA, CRI, CR').count())) {
    throw new Error('o bloco do instrumento não apareceu');
  }
});
await passo(pagina, 'esteira-fechada-de-novo', async () => {
  await pagina.keyboard.press('Escape');
  await pagina.waitForTimeout(400);
});

// ------------------------------------------------------------- oauth (MCP) ---
await passo(pagina, 'oauth-consent-sem-pedido', async () => {
  // Sem authorization_id a tela tem que explicar, não ficar em branco nem
  // oferecer "Permitir" (specs/12). O fluxo completo só se testa pelo Claude.
  await pagina.goto(`${BASE}/oauth/consent`, { waitUntil: 'networkidle' });
  await pagina.waitForSelector('text=veio sem identificador', { timeout: 15000 });
  if (await pagina.locator('button:has-text("Permitir")').count()) {
    throw new Error('ofereceu "Permitir" sem pedido de autorização');
  }
});

// ----------------------------------------------------------------- agenda ---
await passo(pagina, 'conta-agenda', async () => {
  await pagina.goto(`${BASE}/conta/agenda`, { waitUntil: 'networkidle' });
  // Conectada ou não, a tela tem que dizer qual dos dois e oferecer a ação.
  await pagina.waitForSelector(
    'button:has-text("Conectar Google Agenda"), button:has-text("Reconectar Google Agenda"), button:has-text("Desconectar")',
    { timeout: 15000 },
  );
});

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
