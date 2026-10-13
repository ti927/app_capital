#!/usr/bin/env node
/**
 * Teste de fumaça do MCP do sistema (specs/12).
 *
 *   node scripts/testar-mcp.mjs              contra http://localhost:3000
 *   QA_BASE=https://… node scripts/testar-mcp.mjs
 *
 * Confere a descoberta do OAuth, que sem token a resposta é 401 com o
 * `WWW-Authenticate` certo, e — entrando com a primeira conta de
 * dados/credenciais-provisorias.txt, como o QA — conversa com /api/mcp como
 * um cliente MCP: initialize, tools/list e algumas ferramentas de leitura.
 * Sem flag, não escreve nada.
 *
 *   node scripts/testar-mcp.mjs --escrita
 *
 * Também exercita o acesso total do master (gravar, excluir, registrar_reuniao,
 * cadastrar_pessoa) em registros de teste "ZZ-MCP-TESTE", apagados no fim —
 * mesmo se der erro. A pessoa de teste usa um e-mail @example.com.
 */
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const BASE = process.env.QA_BASE ?? 'http://localhost:3000';
const env = Object.fromEntries(
  fs
    .readFileSync('.env', 'utf8')
    .split(/\r?\n/)
    .filter((l) => l && !l.trimStart().startsWith('#') && l.includes('='))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const falhas = [];
const conferir = (ok, rotulo, detalhe = '') => {
  console.log(`${ok ? 'ok   ' : 'FALHA'} ${rotulo}${detalhe ? ` — ${detalhe}` : ''}`);
  if (!ok) falhas.push(rotulo);
};

const desc = await fetch(`${BASE}/.well-known/oauth-protected-resource/api/mcp`).then((r) => r.json());
conferir(desc.resource === `${BASE}/api/mcp` && desc.authorization_servers?.[0]?.endsWith('/auth/v1'), 'descoberta', JSON.stringify(desc));

const semToken = await fetch(`${BASE}/api/mcp`, { method: 'POST', body: '{}' });
conferir(
  semToken.status === 401 && (semToken.headers.get('www-authenticate') ?? '').includes('resource_metadata='),
  'sem token dá 401',
  `${semToken.status}`,
);

const linha = fs
  .readFileSync('dados/credenciais-provisorias.txt', 'utf8')
  .split(/\r?\n/)
  .find((l) => l && !l.startsWith('#'));
const [email, senha] = linha.split('\t');
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
if (error) throw new Error(`login: ${error.message}`);
const token = data.session.access_token;

let id = 0;
async function rpc(method, params) {
  const r = await fetch(`${BASE}/api/mcp`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: ++id, method, params }),
  });
  const texto = await r.text();
  try {
    return JSON.parse(texto);
  } catch {
    return { status: r.status, texto: texto.slice(0, 300) };
  }
}
const ferramenta = async (name, args = {}) => (await rpc('tools/call', { name, arguments: args })).result;

const ini = await rpc('initialize', {
  protocolVersion: '2025-06-18',
  capabilities: {},
  clientInfo: { name: 'testar-mcp', version: '0' },
});
conferir(ini.result?.serverInfo?.name === 'lure-capital', 'initialize', JSON.stringify(ini.result?.serverInfo ?? ini));

const lista = await rpc('tools/list', {});
const nomes = lista.result?.tools?.map((t) => t.name) ?? [];
const MASTER = ['consultar', 'gravar', 'excluir', 'listar_pessoas', 'cadastrar_pessoa', 'atualizar_pessoa'];
conferir(
  nomes.length >= 20 && [...MASTER, 'registrar_reuniao'].every((n) => nomes.includes(n)),
  'tools/list (master, com acesso total)',
  nomes.join(', '),
);
conferir(Boolean(ini.result?.instructions), 'instruções do servidor', (ini.result?.instructions ?? '').slice(0, 80));

const eu = await ferramenta('quem_sou_eu');
conferir(!eu?.isError, 'quem_sou_eu', eu?.content?.[0]?.text?.replace(/\s+/g, ' '));

const funil = await ferramenta('listar_funil');
const colunas = JSON.parse(funil?.content?.[0]?.text ?? '[]');
conferir(Array.isArray(colunas) && colunas.length > 0, 'listar_funil', colunas.map((c) => `${c.coluna}(${c.cartoes.length})`).join(' · '));

const busca = await ferramenta('buscar_clientes', { termo: 'agro, (x)', limite: 3 });
conferir(!busca?.isError, 'buscar_clientes com vírgula e parênteses');

const tarefas = await ferramenta('listar_tarefas', { apenas_minhas: false });
conferir(!tarefas?.isError, 'listar_tarefas');

const texto = (r) => r?.content?.[0]?.text ?? '';
const json = (r) => {
  try {
    return JSON.parse(texto(r));
  } catch {
    return null;
  }
};

const contagem = await ferramenta('consultar', {
  tabela: 'operacao',
  colunas: 'id, identificador, cliente(nome_razao), status_operacao(rotulo)',
  filtros: [{ coluna: 'arquivado', operador: 'eq', valor: false }],
  limite: 2,
});
conferir(!contagem?.isError && typeof json(contagem)?.total === 'number', 'consultar com tabela ligada', `total=${json(contagem)?.total}`);

const injecao = await ferramenta('consultar', { tabela: 'cliente', filtros: [{ coluna: 'id;drop', operador: 'eq', valor: 'x' }] });
conferir(injecao?.isError, 'consultar recusa coluna inválida');

const tokens = await rpc('tools/call', { name: 'consultar', arguments: { tabela: 'google_conexao' } });
conferir(Boolean(tokens.error || tokens.result?.isError), 'consultar não lê tokens do Google');

if (process.argv.includes('--escrita')) {
  const MARCA = 'ZZ-MCP-TESTE';
  const EMAIL_TESTE = 'zz-mcp-teste@example.com';
  const limpar = [];
  try {
    const criado = json(await ferramenta('gravar', { tabela: 'cliente', campos: { nome_razao: MARCA, cidade: 'a' } }))?.criado;
    conferir(Boolean(criado?.id) && criado.criado_por, 'gravar cria cliente (com criado_por)');
    if (criado?.id) limpar.push(['cliente', criado.id]);

    const alterado = json(await ferramenta('gravar', { tabela: 'cliente', id: criado?.id, campos: { cidade: 'b' } }))?.alterado;
    conferir(alterado?.cidade === 'b', 'gravar altera cliente');

    const semConfirmar = await rpc('tools/call', { name: 'excluir', arguments: { tabela: 'cliente', chave: { id: criado?.id } } });
    conferir(Boolean(semConfirmar.error || semConfirmar.result?.isError), 'excluir sem confirmação é recusado');

    const reuniao = json(
      await ferramenta('registrar_reuniao', {
        empresa: MARCA,
        resumo: 'Teste automático do MCP.',
        participantes: ['Fulano'],
        proximos_passos: [{ titulo: 'Mandar proposta (teste)', prazo: '2099-01-01' }],
      }),
    );
    conferir(reuniao?.cartao_criado_agora && reuniao?.tarefas_criadas === 1, 'registrar_reuniao cria cartão e tarefa');
    if (reuniao?.cartao_id) limpar.push(['funil_cartao', reuniao.cartao_id]);
    const card = json(await ferramenta('detalhar_cartao', { id: reuniao?.cartao_id }));
    conferir((card?.historico ?? '').includes('Teste automático do MCP.'), 'reunião anotada no histórico');

    const pessoa = json(await ferramenta('cadastrar_pessoa', { email: EMAIL_TESTE, nome: 'ZZ Teste MCP' }));
    conferir(Boolean(pessoa?.id) && pessoa.nivel_acesso === 'indicante', 'cadastrar_pessoa', pessoa?.como_entrar ?? '');
    if (pessoa?.id) limpar.push(['pessoa', pessoa.id]);
    const desativada = json(await ferramenta('atualizar_pessoa', { id: pessoa?.id, ativo: false }));
    conferir(desativada?.ativo === false, 'atualizar_pessoa desativa');
    const eu2 = json(await ferramenta('listar_pessoas', {}))?.find?.((p) => p.nome === json(eu)?.nome);
    const auto = await ferramenta('atualizar_pessoa', { id: eu2?.id, ativo: false });
    conferir(auto?.isError, 'master não tira o próprio acesso');
  } finally {
    // Ordem inversa: tarefas e cartão antes do cliente; pessoa pelo admin.
    for (const [tabela, id] of limpar.reverse()) {
      if (tabela === 'pessoa') {
        const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
        await admin.from('perfil').delete().eq('id', id);
        const { error } = await admin.auth.admin.deleteUser(id);
        conferir(!error, 'limpeza: pessoa de teste apagada');
        continue;
      }
      if (tabela === 'funil_cartao') {
        const tarefas = json(await ferramenta('consultar', { tabela: 'funil_tarefa', filtros: [{ coluna: 'cartao_id', operador: 'eq', valor: id }] }));
        for (const t of tarefas?.linhas ?? []) {
          await ferramenta('excluir', { tabela: 'funil_tarefa', chave: { id: t.id }, pessoa_confirmou: true });
        }
      }
      const r = await ferramenta('excluir', { tabela, chave: { id }, pessoa_confirmou: true });
      conferir(!r?.isError, `limpeza: excluir ${tabela}`, texto(r).slice(0, 80));
    }
  }
}

console.log(falhas.length ? `\n${falhas.length} falha(s)` : '\ntudo ok');
process.exit(falhas.length ? 1 : 0);
