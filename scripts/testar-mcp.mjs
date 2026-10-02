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
 * Não escreve nada.
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
conferir(nomes.length >= 15 && !nomes.some((n) => n.startsWith('excluir')), 'tools/list', nomes.join(', '));

const eu = await ferramenta('quem_sou_eu');
conferir(!eu?.isError, 'quem_sou_eu', eu?.content?.[0]?.text?.replace(/\s+/g, ' '));

const funil = await ferramenta('listar_funil');
const colunas = JSON.parse(funil?.content?.[0]?.text ?? '[]');
conferir(Array.isArray(colunas) && colunas.length > 0, 'listar_funil', colunas.map((c) => `${c.coluna}(${c.cartoes.length})`).join(' · '));

const busca = await ferramenta('buscar_clientes', { termo: 'agro, (x)', limite: 3 });
conferir(!busca?.isError, 'buscar_clientes com vírgula e parênteses');

const tarefas = await ferramenta('listar_tarefas', { apenas_minhas: false });
conferir(!tarefas?.isError, 'listar_tarefas');

console.log(falhas.length ? `\n${falhas.length} falha(s)` : '\ntudo ok');
process.exit(falhas.length ? 1 : 0);
