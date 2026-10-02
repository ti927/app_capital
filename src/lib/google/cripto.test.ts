import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { test } from 'node:test';
import { cifrar, decifrar } from './cripto.ts';

const chave = randomBytes(32).toString('base64');

test('o que se cifra volta igual', () => {
  const guardado = cifrar('1//refresh-token', chave);
  assert.notEqual(guardado, '1//refresh-token');
  assert.equal(decifrar(guardado, chave), '1//refresh-token');
});

test('o mesmo texto cifra diferente a cada vez', () => {
  assert.notEqual(cifrar('x', chave), cifrar('x', chave));
});

test('chave errada ou texto adulterado não decifram', () => {
  const guardado = cifrar('segredo', chave);
  assert.throws(() => decifrar(guardado, randomBytes(32).toString('base64')));
  const partes = guardado.split('.');
  partes[3] = Buffer.from('outra coisa').toString('base64url');
  assert.throws(() => decifrar(partes.join('.'), chave));
});

test('sem chave, ou chave do tamanho errado, falha alto', () => {
  assert.throws(() => cifrar('x', undefined), /ausente/);
  assert.throws(() => cifrar('x', Buffer.from('curta').toString('base64')), /32 bytes/);
});
