#!/usr/bin/env node
// Carrega dados/bruto/*.json no Postgres.
//   node scripts/carregar-supabase.mjs [--limpar]
//
// Idempotente por bubble_id: rodar de novo atualiza em vez de duplicar.
// NAO carrega: perfil e os vinculos que dependem dele (cliente_visualizador,
// funil_cartao_usuario) — exigem contas em auth.users, decisao em aberto.
import fs from 'node:fs';
import pg from 'pg';

const env = Object.fromEntries(
  fs.readFileSync('.env', 'utf8').split(/\r?\n/)
    .filter(l => l && !l.trimStart().startsWith('#') && l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));

const c = new pg.Client({ connectionString: env.DIRECT_URL, ssl: { rejectUnauthorized: false } });
await c.connect();

const J = t => JSON.parse(fs.readFileSync(`dados/bruto/${t}.json`, 'utf8'));
const txt = v => (v === undefined || v === null || v === '') ? null : String(v).trim();
const bool = v => v === true;
const avisos = [];

const mapa = async (tabela, coluna) => {
  const r = await c.query(`select id, ${coluna} from ${tabela}`);
  return new Map(r.rows.map(x => [x[coluna], x.id]));
};
const statusEtapa = await mapa('status_etapa', 'rotulo');
const tipoOp = await mapa('tipo_operacao', 'rotulo');
const statusOp = await mapa('status_operacao', 'rotulo');

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
  const r = await c.query(`
    insert into fornecedor (bubble_id, nome_fundo, contato, email, numero, cidade, pf_ou_pj,
      status, segmento_foco, segmento_nao_atua, operacao_minima, faturamento_minimo, fee,
      parecer, link_indicacao, arquivado, criado_em)
    values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
    on conflict (bubble_id) do update set nome_fundo = excluded.nome_fundo
    returning id`,
    [f._id, txt(f['nome do fundo']) ?? '(sem nome)', txt(f.contato), txt(f['email fornecedor']),
     txt(f.numero), txt(f['cidade fornecedor']), txt(f['PF ou PJ']), txt(f['status ']),
     txt(f['segmento foco']), txt(f['segmento que não atua']), txt(f['operação mínima']),
     txt(f['faturamento minimo']), txt(f.Fee), txt(f['parecer fornecedor']),
     txt(f['link de indicação']), bool(f.arquivado), f['Created Date'] ?? new Date()]);
  const fid = r.rows[0].id;
  fornecedorId.set(f._id, fid);

  for (const [campo, papel] of [['1°Linha', 'linha_1'], ['2°Linha', 'linha_2'],
                                ['tipos de operações', 'atende'],
                                ['tipos de operações não atendidas', 'nao_atende']]) {
    for (const rotulo of f[campo] || []) {
      const t = tipoOp.get(rotulo);
      if (!t) { avisos.push(`tipo de operacao desconhecido em fornecedor: ${rotulo}`); continue; }
      await c.query(`insert into fornecedor_tipo_operacao (fornecedor_id, tipo_operacao_id, papel)
                     values ($1,$2,$3) on conflict do nothing`, [fid, t, papel]);
    }
  }
}
console.log(`fornecedor                ${fornecedorId.size}`);

// ------------------------------------------------------------------ cliente
const clienteId = new Map();
for (const cl of J('cliente')) {
  const r = await c.query(`
    insert into cliente (bubble_id, nome_razao, cnpj, cidade, telefone, email, atividade_cia,
      diretor_gerente, faturamento_anual, estimativa_faturamento, margem_liquida, passivo_oneroso,
      ativos, demanda, info_adicionais, parecer, status, quem_indicou, arquivado, criado_em)
    values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
    on conflict (bubble_id) do update set nome_razao = excluded.nome_razao
    returning id`,
    [cl._id, txt(cl['nome/razão']) ?? '(sem nome)', txt(cl.CNPJ), txt(cl.cidade), txt(cl.telefone),
     txt(cl.emailcliente), txt(cl['ativiade da CIA']), txt(cl['diretor/gerente']),
     txt(cl['faturamento anual']), txt(cl['estimativa de faturamento']), txt(cl['margem líquida']),
     txt(cl['passivo oneroso']), txt(cl.ativos), txt(cl.demanda), txt(cl['info adicionais']),
     txt(cl['parecer.cliente']), txt(cl['status cliente']), txt(cl['quem indicou ']),
     bool(cl.arquivado), cl['Created Date'] ?? new Date()]);
  clienteId.set(cl._id, r.rows[0].id);
}
console.log(`cliente                   ${clienteId.size}`);

let emails = 0;
for (const i of J('tbl_infocliente')) {
  const cid = clienteId.get(i.qualcliente);
  const em = txt(i.emailcliente);
  if (!cid || !em) { if (!cid) avisos.push('tbl_infocliente sem cliente correspondente'); continue; }
  await c.query(`insert into cliente_email (cliente_id, email) values ($1,$2)
                 on conflict do nothing`, [cid, em]);
  emails++;
}
console.log(`cliente_email             ${emails}`);

// ------------------------------------------------------------------ operacao
const operacaoId = new Map();
let obs = 0, declinios = 0;
for (const o of J('opera__o')) {
  const r = await c.query(`
    insert into operacao (bubble_id, identificador, cliente_id, status_operacao_id,
      demanda_inicial, demanda_final, destino_recurso, faturamento_anual, garantias_sugeridas,
      limites_fundos_assinados, prazo, carencia, pmts, comissao, parecer, tem_fee, nda_assinado,
      mandato_assinado, mandato_assinado_fornecedor, estruturacao_em_andamento, arquivado, criado_em)
    values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
    on conflict (bubble_id) do update set identificador = excluded.identificador
    returning id`,
    [o._id, txt(o.identificador), clienteId.get(o['qual cliente']) ?? null,
     statusOp.get(o['Status Atual da Operação']) ?? null,
     txt(o['demanda inicial']), txt(o['demanda final']), txt(o['destino do recurso']),
     txt(o['faturamento anual']), txt(o['garantias sugeridas']), txt(o['limites/fundos assinados']),
     txt(o.prazo), txt(o['carência']), txt(o.PMTS), txt(o['comissão']), txt(o['parecer operação']),
     bool(o['fee (yes/no)']), bool(o['nda assinado']), bool(o['mandato assinado']),
     bool(o.mandatoassinadofor), bool(o['Estruturação em Andamento']), bool(o.arquivado),
     o['Created Date'] ?? new Date()]);
  const oid = r.rows[0].id;
  operacaoId.set(o._id, oid);

  for (const t of o['observação '] || []) {
    if (!txt(t)) continue;
    await c.query('insert into operacao_observacao (operacao_id, texto) values ($1,$2)', [oid, txt(t)]);
    obs++;
  }
  for (const fid of o['declínios '] || []) {
    const f = fornecedorId.get(fid);
    if (!f) { avisos.push('declinio com fornecedor desconhecido'); continue; }
    await c.query(`insert into operacao_declinio (operacao_id, fornecedor_id) values ($1,$2)
                   on conflict do nothing`, [oid, f]);
    declinios++;
  }
}
console.log(`operacao                  ${operacaoId.size}`);

for (const t of J('tbl_observa__es')) {
  const oid = operacaoId.get(t['cpo.qualoperação']);
  const texto = txt(t['cpo.observação']);
  if (!oid || !texto) { if (!oid) avisos.push('observacao sem operacao correspondente'); continue; }
  await c.query(`insert into operacao_observacao (operacao_id, texto, criado_em)
                 values ($1,$2,$3)`, [oid, texto, t['Created Date'] ?? new Date()]);
  obs++;
}
console.log(`operacao_observacao       ${obs}`);
console.log(`operacao_declinio         ${declinios}`);

// ------------------------------------------------------------------ etapa
const ITENS = [
  ['integralizacao_sub', 'Integralização de cota sub', 'IntegralizaçãoSubDesc', 'IntegralizaçãoSubValue', 1],
  ['int_senior', 'Integralização de cotas senior e mezo', 'IntSeniorDesc', 'IntSeniorValue', 2],
  ['inc_dc', 'Inclusão de DC', 'INcDCDesc', 'IncDCValue', 3],
  ['cmp1', null, 'Cmp1Desc', 'Cmp1Value', 4],
  ['cmp2', null, 'Cmp2Desc', 'Cmp2Value', 5],
  ['cmp3', null, 'Cmp3Desc', 'Cmp3Value', 6],
  ['cmp4', null, 'Cmp4Desc', 'Cmp4Value', 7],
  ['regulamento', 'Regulamento', 'RegulamentoDesc', 'RegulamentoValue', 8],
  ['arquivos', 'Arquivos de Remessa e Retorno', 'ArquivosDesc', 'ArquivosValue', 9],
  ['contrato_cessao', 'Contrato de Cessão', 'CnrtdeCessãoDesc', 'ContratoDeCessãoValue', 10],
  ['contrato_cobranca', 'Contrato de Cobrança', 'ContratoCobrançaDesc', 'ContratoCobrançaValue', 11],
];

let etapas = 0, instr = 0, itens = 0, semOperacao = 0;
for (const e of J('etapas_opera__o')) {
  const oid = operacaoId.get(e['qual operação etapa']);
  if (!oid) { semOperacao++; continue; }
  const r = await c.query(`
    insert into etapa_operacao (bubble_id, operacao_id, cliente_id, fornecedor_id, status_id,
      tipo_operacao_id, na_mao_de, dt_inicio, volume, administrador, assessoria_legal, gestor, criado_em)
    values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    on conflict (bubble_id) do update set operacao_id = excluded.operacao_id
    returning id`,
    [e._id, oid, clienteId.get(e['qual cliente']) ?? null,
     fornecedorId.get(e['fundo etapa']) ?? null,
     statusEtapa.get(e['status etapa']) ?? null, tipoOp.get(e['tipo operação etapa']) ?? null,
     txt(e['na mão de etapa']), e.DtInicio ? new Date(e.DtInicio) : null, txt(e.volume),
     txt(e.Admnistrador), txt(e.AssessoriaLegal), txt(e['Gesto ']),
     e['Created Date'] ?? new Date()]);
  const eid = r.rows[0].id;
  etapas++;

  for (const rotulo of e.instrumento || []) {
    const t = tipoOp.get(rotulo);
    if (!t) { avisos.push(`instrumento desconhecido: ${rotulo}`); continue; }
    await c.query(`insert into etapa_instrumento (etapa_id, tipo_operacao_id) values ($1,$2)
                   on conflict do nothing`, [eid, t]);
    instr++;
  }

  for (const [chave, rotuloFixo, campoDesc, campoValor, ordem] of ITENS) {
    const desc = txt(e[campoDesc]);
    const valor = e[campoValor];
    if (desc === null && (valor === undefined || valor === null)) continue;
    const rotulo = rotuloFixo ?? txt(e['nomeCmp' + chave.slice(3)]) ?? `Campo ${chave.slice(3)}`;
    await c.query(`insert into etapa_checklist_item (etapa_id, chave, rotulo, descricao, valor, ordem)
                   values ($1,$2,$3,$4,$5,$6) on conflict (etapa_id, chave) do nothing`,
                  [eid, chave, rotulo, desc, valor ?? null, ordem]);
    itens++;
  }
}
console.log(`etapa_operacao            ${etapas}${semOperacao ? `  (${semOperacao} sem operacao, puladas)` : ''}`);
console.log(`etapa_instrumento         ${instr}`);
console.log(`etapa_checklist_item      ${itens}`);

// ------------------------------------------------------------------ funil
const quadros = new Set();
for (const t of ['funilcartao', 'funiletapa', 'funiltag'])
  for (const o of J(t)) if (o.Quadro) quadros.add(o.Quadro);

const quadroId = new Map();
for (const nome of quadros) {
  const r = await c.query(`insert into funil_quadro (nome) values ($1)
                           on conflict (nome) do update set nome = excluded.nome
                           returning id`, [nome]);
  quadroId.set(nome, r.rows[0].id);
}
const quadroPadrao = [...quadroId.values()][0] ?? null;

const etapaFunilId = new Map();
for (const e of J('funiletapa')) {
  const r = await c.query(`insert into funil_etapa (bubble_id, quadro_id, nome, ordem, no_fluxo)
    values ($1,$2,$3,$4,$5) on conflict (bubble_id) do update set nome = excluded.nome
    returning id`,
    [e._id, quadroId.get(e.Quadro) ?? quadroPadrao, txt(e.NomeEtapa) ?? '(sem nome)',
     e.Ordem ?? 0, e.NoFluxo !== false]);
  etapaFunilId.set(e._id, r.rows[0].id);
}

const tagId = new Map();
for (const t of J('funiltag')) {
  const r = await c.query(`insert into funil_tag (bubble_id, quadro_id, nome, cor, ativo)
    values ($1,$2,$3,$4,$5) on conflict (bubble_id) do update set nome = excluded.nome
    returning id`,
    [t._id, quadroId.get(t.Quadro) ?? quadroPadrao, txt(t.NomeTag) ?? '(sem nome)',
     txt(t.CorTag), t.Ativo !== false]);
  tagId.set(t._id, r.rows[0].id);
}

let cartoes = 0, cartaoTags = 0;
for (const k of J('funilcartao')) {
  const r = await c.query(`insert into funil_cartao (bubble_id, quadro_id, etapa_id, empresa,
      contato, segmento, faturamento, indicante, parecer, historico, ordem, data_kb, data_call,
      arquivado, criado_em)
    values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
    on conflict (bubble_id) do update set empresa = excluded.empresa
    returning id`,
    [k._id, quadroId.get(k.Quadro) ?? quadroPadrao, etapaFunilId.get(k.QualEtapa) ?? null,
     txt(k.Empresa) ?? '(sem empresa)', txt(k.Contato), txt(k.Segmento), txt(k.Faturamento),
     txt(k.Indicante), txt(k.Parecer), txt(k.Historico), k.Ordem ?? 0,
     k.DataKB ? new Date(k.DataKB) : null, k.DataCall ? new Date(k.DataCall) : null,
     k.Arquivado === true, k['Created Date'] ?? new Date()]);
  cartoes++;
  for (const t of k.QuaisTags || []) {
    const tid = tagId.get(t);
    if (!tid) continue;
    await c.query(`insert into funil_cartao_tag (cartao_id, tag_id) values ($1,$2)
                   on conflict do nothing`, [r.rows[0].id, tid]);
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
