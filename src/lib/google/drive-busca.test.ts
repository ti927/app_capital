import assert from 'node:assert/strict';
import { test } from 'node:test';
import { escaparConsulta, idDaPasta, notaDaPasta, ordenarCandidatas, termoDeBusca } from './drive-busca.ts';

/**
 * O erro que importa aqui é silencioso: mostrar os documentos de OUTRO
 * cliente. Por isso os casos de "não serve" pesam tanto quanto os de acerto.
 */

test('nome idêntico ignora caixa, acento e pontuação', () => {
  assert.equal(notaDaPasta('Pro Remédios', 'PRO REMEDIOS'), 100);
  assert.equal(notaDaPasta('3E', '3e'), 100);
});

test('um nome contido no outro serve', () => {
  assert.equal(notaDaPasta('Pro Remedios', 'PRO REMEDIOS DISTRIBUIDORA DE PRODUTOS FARMACEUTICOS'), 80);
  assert.equal(notaDaPasta('MAC Empreendimentos (JHL) - documentos', 'MAC Empreendimentos (JHL)'), 80);
});

test('uma palavra genérica em comum não basta', () => {
  assert.equal(notaDaPasta('Agro Forte Sementes', 'Agrosol'), 0);
  assert.equal(notaDaPasta('Sementes Veneza', 'Produtiva Sementes'), 0);
  assert.equal(notaDaPasta('Ltda', 'Qualquer Ltda'), 0);
});

test('ordena da melhor para a pior e descarta as que não servem', () => {
  // "Produtiva - antigo" divide só uma palavra de duas: na dúvida, fica fora.
  const pastas = [
    { nome: 'Produtiva Sementes - 2025' },
    { nome: 'Produtiva - antigo' },
    { nome: 'Produtiva Sementes' },
    { nome: 'Outra' },
  ];
  assert.deepEqual(
    ordenarCandidatas(pastas, 'Produtiva Sementes').map((p) => p.nome),
    ['Produtiva Sementes', 'Produtiva Sementes - 2025'],
  );
});

test('termo de busca é a palavra mais longa que identifica', () => {
  assert.equal(termoDeBusca('PRO REMEDIOS DISTRIBUIDORA DE PRODUTOS'), 'distribuidora');
  assert.equal(termoDeBusca('3E'), '3e');
});

test('consulta do Drive escapa aspas e barra', () => {
  assert.equal(escaparConsulta("D'Ávila \\ cia"), "D\\'Ávila \\\\ cia");
});

test('id da pasta sai do link do Drive ou é o próprio id', () => {
  assert.equal(idDaPasta('https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOp?usp=sharing'), '1AbCdEfGhIjKlMnOp');
  assert.equal(idDaPasta('https://drive.google.com/open?id=1AbCdEfGhIjKlMnOp'), '1AbCdEfGhIjKlMnOp');
  assert.equal(idDaPasta('1AbCdEfGhIjKlMnOp'), '1AbCdEfGhIjKlMnOp');
  assert.equal(idDaPasta('não é link'), null);
});
