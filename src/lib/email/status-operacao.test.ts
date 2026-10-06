import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ASSUNTO, emailValido, escapar, montarEmailDeStatus, textoPadrao } from './status-operacao.ts';

test('texto padrão é o do Bubble, com cliente, identificador e status', () => {
  const t = textoPadrao({ cliente: 'ACME', identificador: 'CRA 2026', status: 'Em andamento', weekUpdate: false });
  assert.equal(
    t,
    'Olá, segue atualizações de status de suas operações:\n\nCliente: ACME\nIdentificador: CRA 2026\n\nStatus: Em andamento\n\natt. Lure Capital',
  );
});

test('Week Update põe o cabeçalho antes do texto', () => {
  const t = textoPadrao({ cliente: 'ACME', identificador: null, status: '', weekUpdate: true });
  assert.ok(t.startsWith('WEEK UPDATE\n\nOlá, segue'));
  assert.match(t, /Identificador: \n/);
});

const texto = 'Olá, João.\n\nSegue o status.';

test('assunto fixo, como no Bubble', () => {
  assert.equal(montarEmailDeStatus({ texto, imagens: [] }).assunto, ASSUNTO);
});

test('sem imagem, só o texto — em parágrafos', () => {
  const r = montarEmailDeStatus({ texto, imagens: [] });
  assert.match(r.html, /<p[^>]*>Olá, João\.<\/p><p[^>]*>Segue o status\.<\/p>/);
  assert.doesNotMatch(r.html, /<img/);
  assert.equal(r.texto, texto);
});

test('cada imagem aparece no corpo pelo cid do anexo, com título', () => {
  const r = montarEmailDeStatus({
    texto,
    imagens: [
      { id: 'observacoes', titulo: 'Observações' },
      { id: 'fundos', titulo: 'Fundos' },
    ],
  });
  assert.match(r.html, /src="cid:observacoes"/);
  assert.match(r.html, /src="cid:fundos"/);
  assert.ok(r.html.indexOf('cid:observacoes') < r.html.indexOf('cid:fundos'));
  assert.match(r.texto, /Anexos: Observações, Fundos\./);
});

test('texto da pessoa não vira HTML', () => {
  const r = montarEmailDeStatus({ texto: '<script>x</script>', imagens: [{ id: 'f', titulo: '<b>F</b>' }] });
  assert.doesNotMatch(r.html, /<script>|<b>F/);
  assert.match(r.html, /&lt;script&gt;/);
  assert.equal(escapar(`"a" & 'b'`), '&quot;a&quot; &amp; &#39;b&#39;');
});

test('emailValido', () => {
  assert.equal(emailValido('a@b.co'), true);
  assert.equal(emailValido('a@b'), false);
  assert.equal(emailValido(null), false);
});
