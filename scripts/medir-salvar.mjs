#!/usr/bin/env node
/**
 * Mede o botão Salvar dos diálogos: do clique até o aviso (toast) aparecer.
 *
 *   node scripts/medir-salvar.mjs                       # contra QA_BASE (padrão localhost:3000)
 *   QA_BASE=https://app-capital-psi.vercel.app node scripts/medir-salvar.mjs --vezes 5
 *
 * Duas leituras por diálogo (cliente, fornecedor, operação):
 *
 *   sem mudança — abre, aperta Salvar sem mexer em nada
 *   com mudança — troca um campo de texto, salva; depois restaura (a restauração
 *                 não entra na conta)
 *
 * NÃO mexe em dado real: cria um cliente, um fornecedor e uma operação de teste
 * ("ZZ-MEDICAO-SALVAR"), mede neles e apaga tudo no fim — mesmo se der erro.
 *
 * Entra sem a tela /entrar (que exige ENTRADA_COM_SENHA): faz
 * `signInWithPassword` com as chaves NEXT_PUBLIC_* do .env e injeta os cookies
 * de sessão do @supabase/ssr no contexto do Playwright. Conta: primeira linha de
 * dados/credenciais-provisorias.txt (precisa ser master).
 *
 * O relógio roda dentro da página (performance.now), do clique em Salvar até o
 * `.lc-aviso` entrar no DOM — não inclui o vai-e-vem do Playwright.
 */
import fs from 'node:fs';
import { createServerClient } from '@supabase/ssr';
import { chromium } from 'playwright';

const BASE = process.env.QA_BASE ?? 'http://localhost:3000';
const VEZES = (() => {
  const i = process.argv.indexOf('--vezes');
  const n = i > -1 ? Number(process.argv[i + 1]) : NaN;
  return Number.isFinite(n) && n > 0 ? n : 5;
})();
const MARCA = 'ZZ-MEDICAO-SALVAR';

const env = Object.fromEntries(
  fs
    .readFileSync('.env', 'utf8')
    .split(/\r?\n/)
    .filter((l) => l && !l.trimStart().startsWith('#') && l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);
const [email, senha] = fs
  .readFileSync('dados/credenciais-provisorias.txt', 'utf8')
  .split(/\r?\n/)
  .find((l) => l && !l.startsWith('#'))
  .split('\t');

const mediana = (ns) => {
  const v = [...ns].sort((a, b) => a - b);
  return v.length ? Math.round(v[Math.floor(v.length / 2)]) : null;
};

/* ------------------------------------------------------------------ login -- */
const jarro = new Map();
const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  cookies: {
    getAll: () => [...jarro].map(([name, value]) => ({ name, value })),
    setAll: (lista) => lista.forEach(({ name, value }) => (value ? jarro.set(name, value) : jarro.delete(name))),
  },
});
const { data: sessao, error: erroLogin } = await supabase.auth.signInWithPassword({ email, password: senha });
if (erroLogin) throw new Error(`login falhou: ${erroLogin.message}`);
const meuId = sessao.user.id;

/* ---------------------------------------------------------- dados de teste -- */
const criados = { cliente: null, fornecedor: null, operacao: null };

async function limpar() {
  if (criados.operacao) await supabase.from('operacao').delete().eq('id', criados.operacao);
  if (criados.fornecedor) await supabase.from('fornecedor').delete().eq('id', criados.fornecedor);
  if (criados.cliente) await supabase.from('cliente').delete().eq('id', criados.cliente);
}

const resultado = {};
let navegador;
try {
  const cliente = await supabase
    .from('cliente')
    .insert({ nome_razao: MARCA, criado_por: meuId, demanda: 'a' })
    .select('id')
    .single();
  if (cliente.error) throw new Error(`cliente de teste: ${cliente.error.message}`);
  criados.cliente = cliente.data.id;
  await supabase.from('cliente_visualizador').insert({ cliente_id: criados.cliente, perfil_id: meuId });

  const fornecedor = await supabase.from('fornecedor').insert({ nome_fundo: MARCA, cidade: 'a' }).select('id').single();
  if (fornecedor.error) throw new Error(`fornecedor de teste: ${fornecedor.error.message}`);
  criados.fornecedor = fornecedor.data.id;
  const { data: tipos } = await supabase.from('tipo_operacao').select('id').order('id').limit(4);
  await supabase.from('fornecedor_tipo_operacao').insert([
    { fornecedor_id: criados.fornecedor, tipo_operacao_id: tipos[0].id, papel: 'atende' },
    { fornecedor_id: criados.fornecedor, tipo_operacao_id: tipos[1].id, papel: 'atende' },
    { fornecedor_id: criados.fornecedor, tipo_operacao_id: tipos[2].id, papel: 'linha_1' },
    { fornecedor_id: criados.fornecedor, tipo_operacao_id: tipos[3].id, papel: 'nao_atende' },
  ]);

  const operacao = await supabase
    .from('operacao')
    .insert({ identificador: MARCA, cliente_id: criados.cliente, pmts: 'a' })
    .select('id')
    .single();
  if (operacao.error) throw new Error(`operação de teste: ${operacao.error.message}`);
  criados.operacao = operacao.data.id;
  await supabase.from('operacao_declinio').insert({ operacao_id: criados.operacao, fornecedor_id: criados.fornecedor });

  /* ------------------------------------------------------------ navegador -- */
  navegador = await chromium.launch();
  const contexto = await navegador.newContext({ viewport: { width: 1440, height: 900 }, locale: 'pt-BR' });
  await contexto.addCookies([...jarro].map(([name, value]) => ({ name, value, url: BASE })));
  const pagina = await contexto.newPage();

  // Relógio dentro da página: clique em Salvar → aviso no DOM.
  await pagina.addInitScript(() => {
    window.__medida = { t0: 0, t1: 0 };
    document.addEventListener(
      'click',
      (e) => {
        if (e.target instanceof Element && e.target.closest('.lc-dialog__foot button[type="submit"]')) {
          window.__medida = { t0: performance.now(), t1: 0 };
        }
      },
      true,
    );
    new MutationObserver(() => {
      if (window.__medida.t0 && !window.__medida.t1 && document.querySelector('.lc-aviso')) {
        window.__medida.t1 = performance.now();
      }
    }).observe(document, { childList: true, subtree: true });
  });

  /** Requisições POST para a própria página (server actions) durante o salvar. */
  let posts = 0;
  pagina.on('request', (r) => {
    if (r.method() === 'POST' && !r.url().includes('/_next/')) posts += 1;
  });

  async function salvar() {
    await pagina.evaluate(() => (window.__medida = { t0: 0, t1: 0 }));
    posts = 0;
    await pagina.locator('.lc-dialog__foot button[type="submit"]').click();
    await pagina.waitForFunction(() => window.__medida.t1 > 0, null, { timeout: 15000 });
    const ms = await pagina.evaluate(() => window.__medida.t1 - window.__medida.t0);
    // Deixa o aviso sair e o diálogo desmontar antes da próxima abertura.
    await pagina.waitForSelector('.lc-overlay', { state: 'detached', timeout: 5000 });
    await pagina.waitForSelector('.lc-aviso', { state: 'detached', timeout: 8000 });
    return { ms, posts };
  }

  const telas = [
    {
      nome: 'cliente',
      rota: '/clientes',
      busca: 'Buscar clientes',
      abrir: '.lista__abrir',
      campo: 'input[name="demanda"]',
    },
    {
      nome: 'fornecedor',
      rota: '/fornecedores',
      busca: 'Buscar fornecedores',
      abrir: '.celula-abrir',
      campo: 'input[name="cidade"]',
    },
    {
      nome: 'operacao',
      rota: '/operacoes',
      busca: 'Buscar operações',
      abrir: '.lista__abrir',
      campo: 'input[name="pmts"]',
    },
  ];

  // `--tela cliente` mede só uma.
  const so = process.argv.includes('--tela') ? process.argv[process.argv.indexOf('--tela') + 1] : null;
  for (const tela of telas.filter((t) => !so || t.nome === so)) {
    await pagina.goto(`${BASE}${tela.rota}`, { waitUntil: 'networkidle' });
    await pagina.fill(`input[placeholder="${tela.busca}"]`, MARCA);
    await pagina.waitForTimeout(500);

    const abrir = async () => {
      await pagina.locator(tela.abrir).first().click();
      await pagina.waitForSelector('.lc-overlay', { timeout: 8000 });
      // A fotografia do formulário é tirada em seguida à montagem.
      await pagina.waitForTimeout(250);
    };

    const sem = [];
    const com = [];
    let postsSem = 0;
    let postsCom = 0;
    // A primeira volta aquece (função da Vercel, cache de módulos) e é descartada.
    for (let i = 0; i <= VEZES; i++) {
      await abrir();
      const a = await salvar();
      await abrir();
      await pagina.fill(tela.campo, `v${i}`);
      const b = await salvar();
      // Restaura (fora da conta).
      await abrir();
      await pagina.fill(tela.campo, 'a');
      await salvar();
      if (i === 0) continue;
      sem.push(a.ms);
      com.push(b.ms);
      postsSem += a.posts;
      postsCom += b.posts;
    }
    resultado[tela.nome] = {
      semMudanca: { medianaMs: mediana(sem), amostras: sem.map(Math.round), requisicoesPost: postsSem },
      comMudanca: { medianaMs: mediana(com), amostras: com.map(Math.round), requisicoesPost: postsCom },
    };
    console.log(`${tela.nome}:`, JSON.stringify(resultado[tela.nome]));
  }
} finally {
  await navegador?.close().catch(() => {});
  await limpar();
}

console.log(`\nBASE ${BASE} · ${VEZES} repetições (mediana)`);
for (const [nome, r] of Object.entries(resultado)) {
  console.log(`  ${nome.padEnd(11)} sem mudança ${String(r.semMudanca.medianaMs).padStart(5)}ms · com mudança ${String(r.comMudanca.medianaMs).padStart(5)}ms`);
}
