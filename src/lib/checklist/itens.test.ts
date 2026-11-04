import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  ITENS_PADRAO,
  casa,
  itemPadrao,
  montarChecklist,
  proximoStatus,
  regraDoTitulo,
  type ArquivoVarrido,
  type LinhaGravada,
} from './itens.ts';

const regra = (chave: string) => itemPadrao(chave)!.regra;
const arq = (caminho: string, id = caminho): ArquivoVarrido => ({ id, nome: caminho.split('/').pop()!, caminho });

test('a lista padrão tem os 23 itens do pedido, sem chave repetida', () => {
  assert.equal(ITENS_PADRAO.length, 23);
  assert.equal(new Set(ITENS_PADRAO.map((i) => i.chave)).size, 23);
  assert.equal(ITENS_PADRAO[0].titulo, 'BP 2023');
  assert.equal(ITENS_PADRAO[3].titulo, 'Balancete 2026');
  assert.equal(ITENS_PADRAO.at(-1)!.titulo, 'Avaliação das Garantias');
});

test('o clique anda pelos quatro status e volta ao começo', () => {
  assert.equal(proximoStatus('nao_recebido'), 'recebido');
  assert.equal(proximoStatus('recebido'), 'parcial');
  assert.equal(proximoStatus('parcial'), 'nao_se_aplica');
  assert.equal(proximoStatus('nao_se_aplica'), 'nao_recebido');
});

test('ano casa pelo nome ou pela pasta, e só como número inteiro', () => {
  assert.ok(casa(regra('bp-2023'), 'Contábil/2023/Balanço Patrimonial.pdf'));
  assert.ok(casa(regra('bp-2023'), 'BP_2023.pdf'));
  assert.ok(casa(regra('dre-2024'), 'DRE-dez2024.xlsx'));
  assert.ok(!casa(regra('bp-2023'), 'BP 2024.pdf'));
  assert.ok(!casa(regra('bp-2023'), 'BP 20231.pdf'));
  assert.ok(!casa(regra('bp-2025'), 'Balancete 2025.pdf'), 'balancete não é balanço');
});

test('palavra casa inteira, sem pegar pedaço de outra', () => {
  assert.ok(!casa(regra('dre-2023'), 'Andre 2023.pdf'));
  assert.ok(casa(regra('irpf-socios'), 'Sócios/Imposto de Renda - João.pdf'));
  assert.ok(casa(regra('abc-clientes'), 'Curva ABC Clientes.xlsx'));
  assert.ok(!casa(regra('abc-fornecedores'), 'Curva ABC Clientes.xlsx'));
  assert.ok(casa(regra('avaliacao-garantias'), 'Garantias/Laudo fazenda.pdf'));
  assert.ok(casa(regra('avaliacao-garantias'), 'Avaliação do imóvel.pdf'));
  assert.ok(!casa(regra('avaliacao-garantias'), 'Avaliação de desempenho.pdf'));
});

test('item extra casa quando todas as palavras do título aparecem', () => {
  assert.ok(casa(regraDoTitulo('Certidão negativa de débitos'), 'Certidoes/Certidão Negativa Débitos.pdf'));
  assert.ok(!casa(regraDoTitulo('Certidão negativa de débitos'), 'Certidão.pdf'));
  assert.deepEqual(regraDoTitulo('de e'), []);
});

const linha = (l: Partial<LinhaGravada>): LinhaGravada => ({
  id: 'x',
  chave: null,
  titulo: null,
  status: null,
  origem: 'app',
  observacao: null,
  criado_em: '2026-11-04T10:00:00Z',
  ...l,
});

test('varredura marca recebido; marcação à mão sempre ganha', () => {
  const arquivos = [arq('Contábil/2023/BP.pdf', 'a1'), arq('DRE 2023.pdf', 'a2')];
  const lista = montarChecklist([linha({ chave: 'dre-2023', status: 'nao_se_aplica' })], arquivos);
  const bp = lista.find((i) => i.ref === 'bp-2023')!;
  const dre = lista.find((i) => i.ref === 'dre-2023')!;
  const bp24 = lista.find((i) => i.ref === 'bp-2024')!;
  assert.equal(bp.status, 'recebido');
  assert.equal(bp.fonte, 'drive');
  assert.equal(bp.arquivos[0].id, 'a1');
  assert.equal(dre.status, 'nao_se_aplica');
  assert.equal(dre.fonte, 'app');
  assert.equal(dre.arquivos.length, 1, 'o arquivo achado continua visível');
  assert.equal(bp24.status, 'nao_recebido');
  assert.equal(bp24.fonte, 'nenhuma');
});

test('itens extras vêm depois dos padrão, na ordem em que foram criados', () => {
  const lista = montarChecklist(
    [
      linha({ id: 'e2', titulo: 'Segundo', criado_em: '2026-11-04T12:00:00Z' }),
      linha({ id: 'e1', titulo: 'Primeiro', criado_em: '2026-11-04T11:00:00Z', status: 'parcial', origem: 'mcp' }),
    ],
    null,
  );
  assert.deepEqual(lista.slice(-2).map((i) => i.ref), ['e1', 'e2']);
  assert.equal(lista.at(-2)!.fonte, 'mcp');
  assert.ok(lista.at(-1)!.extra);
});
