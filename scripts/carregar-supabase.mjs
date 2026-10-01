#!/usr/bin/env node
// Carrega dados/bruto/*.json no Postgres.
//   node scripts/carregar-supabase.mjs [--limpar]
//
// Idempotente por bubble_id: rodar de novo atualiza em vez de duplicar.
// NAO carrega: perfil e os vinculos que dependem dele (cliente_visualizador,
// funil_cartao_usuario) — exigem contas em auth.users, decisao em aberto.
//
// O de-para Bubble -> colunas mora em src/lib/bubble/mapeamento.ts, o mesmo
// que o botao "Sincronizar com o Bubble" usa (specs/10-sincronizacao-bubble.md).
// Aqui fica so o SQL e o ON CONFLICT de cada tabela. O Node importa o .ts
// direto (type stripping, Node >= 23.6).
import fs from 'node:fs';
import pg from 'pg';
import * as m from '../src/lib/bubble/mapeamento.ts';

const env = Object.fromEntries(
  fs.readFileSync('.env', 'utf8').split(/\r?\n/)
    .filter(l => l && !l.trimStart().startsWith('#') && l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));

const c = new pg.Client({ connectionString: env.DIRECT_URL, ssl: { rejectUnauthorized: false } });
await c.connect();

const J = t => JSON.parse(fs.readFileSync(`dados/bruto/${t}.json`, 'utf8'));
const avisos = [];

/** INSERT a partir de uma linha do de-para; `sufixo` e o ON CONFLICT. */
const inserir = (tabela, linha, sufixo = '') => {
  const colunas = Object.keys(linha);
  return c.query(
    `insert into ${tabela} (${colunas.join(', ')})
     values (${colunas.map((_, i) => `$${i + 1}`).join(', ')}) ${sufixo}`,
    Object.values(linha));
};

const mapa = async (tabela, coluna) => {
  const r = await c.query(`select id, ${coluna} from ${tabela}`);
  return new Map(r.rows.map(x => [x[coluna], x.id]));
};
const cat = {
  statusEtapa: await mapa('status_etapa', 'rotulo'),
  tipoOp: await mapa('tipo_operacao', 'rotulo'),
  statusOp: await mapa('status_operacao', 'rotulo'),
};

if (process.argv.includes('--limpar')) {
  await c.query(`truncate funil_cartao_tag, funil_cartao, funil_tag, funil_etapa, funil_quadro,
                          etapa_checklist_item, etapa_instrumento, etapa_observacao, etapa_operacao,
                          operacao_declinio, operacao_observacao, operacao,
                          cliente_email, cliente_visualizador, cliente,
                          fornecedor_tipo_operacao, fornecedor, evento restart identity cascade`);
  console.log('tabelas limpas.\n');
}

// ------------------------------------------------------------------ fornecedor
const fornecedorId = new Map();
for (const f of J('fornecedor')) {
  const r = await inserir('fornecedor', m.fornecedor(f),
    'on conflict (bubble_id) do update set nome_fundo = excluded.nome_fundo returning id');
  const fid = r.rows[0].id;
  fornecedorId.set(f._id, fid);

  for (const v of m.fornecedorTipos(f, cat.tipoOp, avisos)) {
    await inserir('fornecedor_tipo_operacao', { fornecedor_id: fid, ...v }, 'on conflict do nothing');
  }
}
console.log(`fornecedor                ${fornecedorId.size}`);

// ------------------------------------------------------------------ cliente
const clienteId = new Map();
for (const cl of J('cliente')) {
  const r = await inserir('cliente', m.cliente(cl),
    'on conflict (bubble_id) do update set nome_razao = excluded.nome_razao returning id');
  clienteId.set(cl._id, r.rows[0].id);
}
console.log(`cliente                   ${clienteId.size}`);

let emails = 0;
for (const i of J('tbl_infocliente')) {
  if (!clienteId.get(i.qualcliente)) avisos.push('tbl_infocliente sem cliente correspondente');
  const linha = m.clienteEmail(i, clienteId);
  if (!linha) continue;
  await inserir('cliente_email', linha, 'on conflict do nothing');
  emails++;
}
console.log(`cliente_email             ${emails}`);

// ------------------------------------------------------------------ operacao
const operacaoId = new Map();
let obs = 0, declinios = 0;
for (const o of J('opera__o')) {
  const r = await inserir('operacao', m.operacao(o, clienteId, cat),
    'on conflict (bubble_id) do update set identificador = excluded.identificador returning id');
  const oid = r.rows[0].id;
  operacaoId.set(o._id, oid);

  for (const texto of m.operacaoObservacoes(o)) {
    await inserir('operacao_observacao', { operacao_id: oid, texto });
    obs++;
  }
  for (const fornecedor_id of m.operacaoDeclinios(o, fornecedorId, avisos)) {
    await inserir('operacao_declinio', { operacao_id: oid, fornecedor_id }, 'on conflict do nothing');
    declinios++;
  }
}
console.log(`operacao                  ${operacaoId.size}`);

for (const t of J('tbl_observa__es')) {
  if (!operacaoId.get(t['cpo.qualoperação'])) avisos.push('observacao sem operacao correspondente');
  const linha = m.observacaoAvulsa(t, operacaoId);
  if (!linha) continue;
  await inserir('operacao_observacao', linha);
  obs++;
}
console.log(`operacao_observacao       ${obs}`);
console.log(`operacao_declinio         ${declinios}`);

// ------------------------------------------------------------------ etapa
let etapas = 0, instr = 0, itens = 0, semOperacao = 0;
for (const e of J('etapas_opera__o')) {
  const oid = operacaoId.get(m.operacaoDaEtapa(e));
  if (!oid) { semOperacao++; continue; }
  const r = await inserir('etapa_operacao', m.etapa(e, oid, { clienteId, fornecedorId }, cat), `
    on conflict (bubble_id) do update set
      operacao_id       = excluded.operacao_id,
      -- Recarga PREENCHE, nunca apaga. O que já foi digitado na nossa tela
      -- ganha do Bubble (coalesce com o nosso valor na frente), e o que está
      -- vazio aqui recebe o que veio de lá. Sem isto, rodar a carga de novo
      -- sobrescreveria o trabalho de quem usa o sistema com os campos vazios
      -- do Bubble — e este do-update só tocava operacao_id, então a recarga
      -- também não trazia nada de novo.
      dt_inicio         = coalesce(etapa_operacao.dt_inicio,         excluded.dt_inicio),
      volume            = coalesce(etapa_operacao.volume,            excluded.volume),
      administrador     = coalesce(etapa_operacao.administrador,     excluded.administrador),
      assessoria_legal  = coalesce(etapa_operacao.assessoria_legal,  excluded.assessoria_legal),
      gestor            = coalesce(etapa_operacao.gestor,            excluded.gestor),
      dtvm              = coalesce(etapa_operacao.dtvm,              excluded.dtvm),
      securitizadora    = coalesce(etapa_operacao.securitizadora,    excluded.securitizadora),
      agente_fiduciario = coalesce(etapa_operacao.agente_fiduciario, excluded.agente_fiduciario),
      custodiante       = coalesce(etapa_operacao.custodiante,       excluded.custodiante),
      emissor           = coalesce(etapa_operacao.emissor,           excluded.emissor),
      estruturador      = coalesce(etapa_operacao.estruturador,      excluded.estruturador),
      demais            = coalesce(etapa_operacao.demais,            excluded.demais),
      -- Booleano é not null default false, então coalesce não serve: o OR
      -- liga o que o Bubble tem ligado e nunca desliga o que já está.
      ts_assinado       = etapa_operacao.ts_assinado  or excluded.ts_assinado,
      op_de_pe          = etapa_operacao.op_de_pe     or excluded.op_de_pe,
      fee_recebido      = etapa_operacao.fee_recebido or excluded.fee_recebido
    returning id`);
  const eid = r.rows[0].id;
  etapas++;

  for (const tipo_operacao_id of m.etapaInstrumentos(e, cat.tipoOp, avisos)) {
    await inserir('etapa_instrumento', { etapa_id: eid, tipo_operacao_id }, 'on conflict do nothing');
    instr++;
  }

  for (const item of m.etapaChecklist(e)) {
    await inserir('etapa_checklist_item', { etapa_id: eid, ...item }, 'on conflict (etapa_id, chave) do nothing');
    itens++;
  }
}
console.log(`etapa_operacao            ${etapas}${semOperacao ? `  (${semOperacao} sem operacao, puladas)` : ''}`);
console.log(`etapa_instrumento         ${instr}`);
console.log(`etapa_checklist_item      ${itens}`);

// ------------------------------------------------------------------ funil
const quadroId = new Map();
for (const nome of m.quadrosDoFunil(J('funilcartao'), J('funiletapa'), J('funiltag'))) {
  const r = await c.query(`insert into funil_quadro (nome) values ($1)
                           on conflict (nome) do update set nome = excluded.nome
                           returning id`, [nome]);
  quadroId.set(nome, r.rows[0].id);
}
const quadroPadrao = [...quadroId.values()][0] ?? null;

const etapaFunilId = new Map();
for (const e of J('funiletapa')) {
  const r = await inserir('funil_etapa', m.funilEtapa(e, quadroId, quadroPadrao),
    'on conflict (bubble_id) do update set nome = excluded.nome returning id');
  etapaFunilId.set(e._id, r.rows[0].id);
}

const tagId = new Map();
for (const t of J('funiltag')) {
  const r = await inserir('funil_tag', m.funilTag(t, quadroId, quadroPadrao),
    'on conflict (bubble_id) do update set nome = excluded.nome returning id');
  tagId.set(t._id, r.rows[0].id);
}

let cartoes = 0, cartaoTags = 0;
for (const k of J('funilcartao')) {
  const r = await inserir('funil_cartao', m.funilCartao(k, quadroId, quadroPadrao, etapaFunilId),
    'on conflict (bubble_id) do update set empresa = excluded.empresa returning id');
  cartoes++;
  for (const tag_id of m.funilCartaoTags(k, tagId)) {
    await inserir('funil_cartao_tag', { cartao_id: r.rows[0].id, tag_id }, 'on conflict do nothing');
    cartaoTags++;
  }
}
console.log(`funil_quadro              ${quadroId.size}`);
console.log(`funil_etapa               ${etapaFunilId.size}`);
console.log(`funil_tag                 ${tagId.size}`);
console.log(`funil_cartao              ${cartoes}`);
console.log(`funil_cartao_tag          ${cartaoTags}`);

if (avisos.length) {
  const cont = {};
  for (const a of avisos) cont[a] = (cont[a] ?? 0) + 1;
  console.log(`\n${avisos.length} aviso(s):`);
  for (const [a, n] of Object.entries(cont)) console.log(`  ${n}x  ${a}`);
}

await c.end();
