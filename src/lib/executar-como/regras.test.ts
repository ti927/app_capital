import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assinarSelo, lerSelo, podeExecutarComo } from './regras.ts';

const SEGREDO = 'segredo-de-teste';
const agora = 1_000_000;

test('só a conta da variável, master e ativa', () => {
  const fabio = { email: 'Fabio.Miranda@Lure.com.br', nivel_acesso: 'master', ativo: true };
  assert.ok(podeExecutarComo(fabio, 'fabio.miranda@lure.com.br'));
  assert.ok(!podeExecutarComo(fabio, undefined));
  assert.ok(!podeExecutarComo(fabio, 'outra@lure.com.br'));
  assert.ok(!podeExecutarComo({ ...fabio, nivel_acesso: 'indicante' }, 'fabio.miranda@lure.com.br'));
  assert.ok(!podeExecutarComo({ ...fabio, ativo: false }, 'fabio.miranda@lure.com.br'));
});

test('selo assinado volta igual', () => {
  const selo = { original: 'a', alvo: 'b', expira: agora + 10 };
  assert.deepEqual(lerSelo(assinarSelo(selo, SEGREDO), SEGREDO, agora), selo);
});

test('selo adulterado, com outro segredo ou vencido não vale', () => {
  const valor = assinarSelo({ original: 'a', alvo: 'b', expira: agora + 10 }, SEGREDO);
  const [corpo, assinatura] = valor.split('.');
  const outroCorpo = Buffer.from(JSON.stringify({ original: 'x', alvo: 'b', expira: agora + 10 })).toString('base64url');
  assert.equal(lerSelo(`${outroCorpo}.${assinatura}`, SEGREDO, agora), null);
  assert.equal(lerSelo(valor, 'outro', agora), null);
  assert.equal(lerSelo(valor, SEGREDO, agora + 11), null);
  assert.equal(lerSelo(`${corpo}`, SEGREDO, agora), null);
  assert.equal(lerSelo(undefined, SEGREDO, agora), null);
});
