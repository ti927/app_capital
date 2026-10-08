import test from 'node:test';
import assert from 'node:assert/strict';
import { veNotasDeVersao } from './notas-de-versao-acesso.ts';

test('sem variável ninguém vê', () => {
  assert.equal(veNotasDeVersao('a@x.com', undefined), false);
  assert.equal(veNotasDeVersao('a@x.com', ''), false);
});

test('compara sem caixa e com espaços na lista', () => {
  assert.equal(veNotasDeVersao('Ana@X.com', ' b@x.com , ana@x.com'), true);
  assert.equal(veNotasDeVersao('c@x.com', 'b@x.com,ana@x.com'), false);
});

test('e-mail vazio nunca passa', () => {
  assert.equal(veNotasDeVersao('', ',,'), false);
  assert.equal(veNotasDeVersao(null, 'a@x.com'), false);
});
