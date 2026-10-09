import { test } from 'node:test';
import assert from 'node:assert/strict';
import { diferenca } from './diferenca.ts';

test('conjuntos iguais não geram nada a gravar', () => {
  assert.deepEqual(diferenca(['a', 'b'], ['b', 'a']), { remover: [], incluir: [] });
});

test('separa o que sai do que entra', () => {
  assert.deepEqual(diferenca(['a', 'b'], ['b', 'c']), { remover: ['a'], incluir: ['c'] });
});

test('repetidos contam uma vez', () => {
  assert.deepEqual(diferenca(['a'], ['a', 'a', 'b']), { remover: [], incluir: ['b'] });
});

test('de vazio para cheio e de cheio para vazio', () => {
  assert.deepEqual(diferenca([], [1, 2]), { remover: [], incluir: [1, 2] });
  assert.deepEqual(diferenca([1, 2], []), { remover: [1, 2], incluir: [] });
});
