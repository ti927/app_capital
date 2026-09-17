#!/usr/bin/env node
// Cria as contas em auth.users a partir de dados/bruto/user.json, preenche
// `perfil` e os vinculos que dependem dele.
//   node scripts/criar-usuarios.mjs
//
// Idempotente: se a conta ja existe, reaproveita em vez de duplicar.
//
// As senhas do Bubble NAO sao migradas. O data type `user` guardava a senha em
// texto puro num campo comum, legivel pela Data API; copiar isso seria levar o
// problema adiante. Cada conta recebe uma senha provisoria aleatoria, gravada
// em dados/credenciais-provisorias.txt (fora do git).
//
// Google Auth: os cinco e-mails sao Gmail ou do dominio lureconsultoria.com.br.
// Ao ligar o provedor Google no Supabase, o login por Google cai na mesma conta,
// porque o vinculo e por e-mail confirmado. Nao precisa recriar nada.
import fs from 'node:fs';
import crypto from 'node:crypto';
import pg from 'pg';

const env = Object.fromEntries(
  fs.readFileSync('.env', 'utf8').split(/\r?\n/)
    .filter(l => l && !l.trimStart().startsWith('#') && l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));

const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY;
const J = t => JSON.parse(fs.readFileSync(`dados/bruto/${t}.json`, 'utf8'));

const senhaProvisoria = () => crypto.randomBytes(12).toString('base64url');

async function admin(caminho, opcoes = {}) {
  const r = await fetch(`${URL}/auth/v1/admin/${caminho}`, {
    ...opcoes,
    headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`,
               'Content-Type': 'application/json', ...(opcoes.headers || {}) },
  });
  const corpo = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${r.status} ${JSON.stringify(corpo)}`);
  return corpo;
}

// ------------------------------------------------------------------ existentes
const existentes = new Map();
for (let pagina = 1; ; pagina++) {
  const { users } = await admin(`users?page=${pagina}&per_page=200`);
  if (!users?.length) break;
  for (const u of users) existentes.set(u.email?.toLowerCase(), u.id);
  if (users.length < 200) break;
}

// ------------------------------------------------------------------ contas
const usuarios = J('user');
const authId = new Map();          // bubble _id -> uuid do auth
const credenciais = [];

for (const u of usuarios) {
  const email = u.authentication?.email?.email?.toLowerCase();
  const nome = u.Nome || email;
  if (!email) { console.log(`  ${nome}: sem e-mail, pulado`); continue; }

  if (existentes.has(email)) {
    authId.set(u._id, existentes.get(email));
    console.log(`  ${email.padEnd(38)} ja existia`);
    continue;
  }

  const senha = senhaProvisoria();
  const criado = await admin('users', {
    method: 'POST',
    body: JSON.stringify({
      email, password: senha, email_confirm: true,
      user_metadata: { nome, origem: 'migracao-bubble' },
    }),
  });
  authId.set(u._id, criado.id);
  credenciais.push(`${email}\t${senha}\t${nome}`);
  console.log(`  ${email.padEnd(38)} criado`);
}

if (credenciais.length) {
  const arquivo = 'dados/credenciais-provisorias.txt';
  fs.writeFileSync(arquivo,
    '# Senhas provisorias da migracao. Cada pessoa troca no primeiro acesso.\n' +
    '# Este arquivo esta fora do git. Apague depois de distribuir.\n' +
    '# email\tsenha\tnome\n' + credenciais.join('\n') + '\n');
  console.log(`\n${credenciais.length} senha(s) provisoria(s) em ${arquivo}`);
}

// ------------------------------------------------------------------ perfil
const c = new pg.Client({ connectionString: env.DIRECT_URL, ssl: { rejectUnauthorized: false } });
await c.connect();

const NIVEL = { Master: 'master', Indicante: 'indicante' };
let perfis = 0;
for (const u of usuarios) {
  const id = authId.get(u._id);
  const email = u.authentication?.email?.email?.toLowerCase();
  if (!id || !email) continue;
  await c.query(`
    insert into perfil (id, nome, email, cpf, cnpj, razao_social, telefone, regiao,
                        nivel_acesso, criado_em)
    values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    on conflict (id) do update set nome = excluded.nome, nivel_acesso = excluded.nivel_acesso`,
    [id, u.Nome || email, email,
     u.CPF || null, u.CNPJ || null, u['Razão Social'] || null,
     u.Telefone ? String(u.Telefone) : null, u['Região'] || null,
     NIVEL[u.NivelDeAcesso] ?? 'indicante',
     u['Created Date'] ?? new Date()]);
  perfis++;
}
console.log(`\nperfil                    ${perfis}`);

// ------------------------------------------------------------------ vinculos
const clienteId = new Map(
  (await c.query('select id, bubble_id from cliente where bubble_id is not null')).rows
    .map(r => [r.bubble_id, r.id]));
const cartaoId = new Map(
  (await c.query('select id, bubble_id from funil_cartao where bubble_id is not null')).rows
    .map(r => [r.bubble_id, r.id]));

let vis = 0, semUsuario = 0;
for (const cl of J('cliente')) {
  const cid = clienteId.get(cl._id);
  if (!cid) continue;
  for (const uid of cl['quem visualiza'] || []) {
    const pid = authId.get(uid);
    if (!pid) { semUsuario++; continue; }
    await c.query(`insert into cliente_visualizador (cliente_id, perfil_id) values ($1,$2)
                   on conflict do nothing`, [cid, pid]);
    vis++;
  }
}
console.log(`cliente_visualizador      ${vis}${semUsuario ? `  (${semUsuario} para usuario inexistente, pulados)` : ''}`);

let cartaoUsuarios = 0, semUsuarioCartao = 0;
for (const k of J('funilcartao')) {
  const kid = cartaoId.get(k._id);
  if (!kid) continue;
  for (const uid of k.Usuarios || []) {
    const pid = authId.get(uid);
    if (!pid) { semUsuarioCartao++; continue; }
    await c.query(`insert into funil_cartao_usuario (cartao_id, perfil_id) values ($1,$2)
                   on conflict do nothing`, [kid, pid]);
    cartaoUsuarios++;
  }
}
console.log(`funil_cartao_usuario      ${cartaoUsuarios}${semUsuarioCartao ? `  (${semUsuarioCartao} para usuario inexistente, pulados)` : ''}`);

await c.end();
