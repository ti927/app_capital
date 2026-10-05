import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ASSUNTO, emailValido, escapar, montarEmailDeStatus } from './status-operacao.ts';

const base = {
  texto: 'Olá, João.\n\nSegue o status.',
  cliente: 'ACME',
  identificador: 'CRA 2026',
  observacoes: [{ texto: 'Docs recebidos', criadoEm: '2026-10-01T15:00:00Z' }],
  etapas: [
    { fundo: 'Fundo X', tipo: 'CRA', status: 'Em análise', naMaoDe: 'Maicon', atualizadoEm: '2026-10-02T12:00:00Z' },
  ],
};
const nada = { observacoes: false, fundos: false, resumo: false };

test('assunto fixo, como no Bubble', () => {
  assert.equal(montarEmailDeStatus({ ...base, incluir: nada }).assunto, ASSUNTO);
});

test('sem chave ligada, só o texto — em parágrafos', () => {
  const { html, texto } = montarEmailDeStatus({ ...base, incluir: nada });
  assert.match(html, /<p[^>]*>Olá, João\.<\/p><p[^>]*>Segue o status\.<\/p>/);
  assert.doesNotMatch(html, /<table/);
  assert.equal(texto, 'Olá, João.\n\nSegue o status.');
});

test('observações e fundos completos entram como tabelas', () => {
  const { html } = montarEmailDeStatus({ ...base, incluir: { observacoes: true, fundos: true, resumo: false } });
  assert.match(html, /Observações/);
  assert.match(html, /Docs recebidos/);
  assert.match(html, /Tipo de operação/);
  assert.match(html, /Fundo X/);
  assert.match(html, /01\/10\/2026/);
});

test('resumido tem três colunas; com fundos ligado, a completa ganha', () => {
  const resumo = montarEmailDeStatus({ ...base, incluir: { observacoes: false, fundos: false, resumo: true } }).html;
  assert.match(resumo, /Na mão de/);
  assert.doesNotMatch(resumo, /Tipo de operação/);
  const ambos = montarEmailDeStatus({ ...base, incluir: { observacoes: false, fundos: true, resumo: true } }).html;
  assert.equal(ambos.match(/<table/g)?.length, 1);
  assert.match(ambos, /Tipo de operação/);
});

test('seção sem linha não entra', () => {
  const { html } = montarEmailDeStatus({
    ...base,
    observacoes: [],
    etapas: [],
    incluir: { observacoes: true, fundos: true, resumo: true },
  });
  assert.doesNotMatch(html, /<table/);
});

test('texto da pessoa e dos dados não vira HTML', () => {
  const { html } = montarEmailDeStatus({
    ...base,
    texto: '<script>x</script>',
    etapas: [{ fundo: '<b>F</b>', tipo: null, status: null, naMaoDe: null, atualizadoEm: null }],
    incluir: { observacoes: false, fundos: true, resumo: false },
  });
  assert.doesNotMatch(html, /<script>|<b>F/);
  assert.match(html, /&lt;script&gt;/);
  assert.equal(escapar(`"a" & 'b'`), '&quot;a&quot; &amp; &#39;b&#39;');
});

test('emailValido', () => {
  assert.equal(emailValido('a@b.co'), true);
  assert.equal(emailValido('a@b'), false);
  assert.equal(emailValido(null), false);
});
