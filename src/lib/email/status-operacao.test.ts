import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ASSUNTO, emailValido, escapar, montarEmailDeStatus, STATUS_FORA_DO_EMAIL } from './status-operacao.ts';

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

test('os três status que o Bubble tirava da tabela', () => {
  assert.deepEqual(STATUS_FORA_DO_EMAIL, ['ja_cliente_do_fundo', 'declinado_pelo_fundo', 'declinado_pelo_cliente']);
});

test('emailValido', () => {
  assert.equal(emailValido('a@b.co'), true);
  assert.equal(emailValido('a@b'), false);
  assert.equal(emailValido(null), false);
});
