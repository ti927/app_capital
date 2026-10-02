import assert from 'node:assert/strict';
import { test } from 'node:test';
import { redirecionamentoPermitido } from './consentimento.ts';

test('claude.ai, claude.com e subdomínios passam', () => {
  assert.equal(redirecionamentoPermitido('https://claude.ai/api/mcp/auth_callback'), true);
  assert.equal(redirecionamentoPermitido('https://claude.com/x'), true);
  assert.equal(redirecionamentoPermitido('https://app.claude.ai/x'), true);
});

test('programa local passa, em qualquer porta', () => {
  assert.equal(redirecionamentoPermitido('http://localhost:6274/oauth/callback'), true);
  assert.equal(redirecionamentoPermitido('http://127.0.0.1:33418/callback'), true);
});

test('domínio parecido, http ou lixo são recusados', () => {
  assert.equal(redirecionamentoPermitido('https://claude.ai.golpe.com/x'), false);
  assert.equal(redirecionamentoPermitido('https://falsoclaude.ai/x'), false);
  assert.equal(redirecionamentoPermitido('http://claude.ai/x'), false);
  assert.equal(redirecionamentoPermitido('javascript:alert(1)'), false);
  assert.equal(redirecionamentoPermitido(''), false);
  assert.equal(redirecionamentoPermitido(null), false);
});
