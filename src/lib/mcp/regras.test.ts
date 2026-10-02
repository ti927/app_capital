import assert from 'node:assert/strict';
import { test } from 'node:test';
import { acrescentarAoHistorico, mesclarCampos, mesmoNome, termoDeBusca } from './regras.ts';

test('sem sobrescrever, campo preenchido fica e é relatado', () => {
  const r = mesclarCampos({ empresa: 'ACME', faturamento: '40MM', contato: null }, {
    faturamento: '50MM',
    contato: 'João',
    segmento: 'Agro',
  }, false);
  assert.deepEqual(r.gravar, { contato: 'João', segmento: 'Agro' });
  assert.deepEqual(r.mantidos, ['faturamento']);
});

test('com sobrescrever, troca o que veio', () => {
  const r = mesclarCampos({ faturamento: '40MM' }, { faturamento: '50MM' }, true);
  assert.deepEqual(r.gravar, { faturamento: '50MM' });
  assert.deepEqual(r.mantidos, []);
});

test('valor igual ao atual não conta como conflito; vazio no pedido é ignorado', () => {
  const r = mesclarCampos({ segmento: 'Agro' }, { segmento: 'Agro', parecer: '  ' }, false);
  assert.deepEqual(r.gravar, { segmento: 'Agro' });
  assert.deepEqual(r.mantidos, []);
});

test('anotação vai no fim, com data e autor, sem apagar o histórico', () => {
  const agora = new Date('2026-10-02T15:00:00Z');
  assert.equal(acrescentarAoHistorico(null, ' ligou ', 'Fabio', agora), '[02/10/2026 — Fabio] ligou');
  assert.equal(
    acrescentarAoHistorico('antigo\n', 'novo', 'Fabio', agora),
    'antigo\n\n[02/10/2026 — Fabio] novo',
  );
});

test('a data é a de São Paulo, não a UTC', () => {
  // 02h UTC do dia 3 ainda é dia 2 em São Paulo.
  assert.match(acrescentarAoHistorico(null, 'x', 'A', new Date('2026-10-03T02:00:00Z')), /02\/10\/2026/);
});

test('termo de busca sem sintaxe do PostgREST', () => {
  assert.equal(termoDeBusca('ACME, (Ltda)'), 'ACME Ltda');
  assert.equal(termoDeBusca('  %*  '), null);
  assert.equal(termoDeBusca(undefined), null);
});

test('nome de coluna sem caixa e sem acento', () => {
  assert.equal(mesmoNome('Reunião', 'reuniao'), true);
  assert.equal(mesmoNome('KB Solicitado', ' kb solicitado '), true);
  assert.equal(mesmoNome('Radar', 'Dados'), false);
});
