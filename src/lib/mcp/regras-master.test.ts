import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  TABELAS_DE_ESCRITA,
  TABELAS_DE_LEITURA,
  chaveCompleta,
  colunaValida,
  emailNormalizado,
  limparCampos,
  selecaoValida,
} from './regras-master.ts';

test('tokens do Google nunca são lidos nem gravados', () => {
  assert.ok(!(TABELAS_DE_LEITURA as readonly string[]).includes('google_conexao'));
  assert.ok(!(TABELAS_DE_ESCRITA as readonly string[]).includes('google_conexao'));
});

test('perfil e log não se gravam pela ferramenta genérica', () => {
  for (const t of ['perfil', 'evento', 'acesso_pagina', 'status_operacao', 'tipo_operacao']) {
    assert.ok(!(TABELAS_DE_ESCRITA as readonly string[]).includes(t), t);
  }
});

test('nome de coluna: só minúsculas, dígitos e _', () => {
  assert.ok(colunaValida('nome_razao'));
  assert.ok(!colunaValida('nome; drop'));
  assert.ok(!colunaValida('a.b'));
  assert.ok(!colunaValida(''));
});

test('select aceita colunas e tabela ligada, recusa o resto', () => {
  assert.ok(selecaoValida('*'));
  assert.ok(selecaoValida('id, identificador, cliente(nome_razao), status_operacao(rotulo)'));
  assert.ok(!selecaoValida("id,'x'"));
  assert.ok(!selecaoValida('id,,nome'));
  assert.ok(!selecaoValida('id,'));
});

test('limparCampos tira o que o banco cuida e nome esquisito', () => {
  const r = limparCampos({ nome_razao: 'ACME', id: 'x', criado_em: 'y', 'a-b': 1, status: null });
  assert.deepEqual(r.limpos, { nome_razao: 'ACME', status: null });
  assert.deepEqual(r.recusados.sort(), ['a-b', 'criado_em', 'id']);
});

test('chave composta precisa vir inteira e sem sobra', () => {
  assert.ok(chaveCompleta('cliente', { id: 'x' }).ok);
  assert.deepEqual(chaveCompleta('cliente_visualizador', { cliente_id: 'a' }).faltam, ['perfil_id']);
  assert.deepEqual(chaveCompleta('cliente', { id: 'x', nome: 'y' }).sobram, ['nome']);
});

test('e-mail normalizado', () => {
  assert.equal(emailNormalizado('  Maicon@Lure.COM.br '), 'maicon@lure.com.br');
});
