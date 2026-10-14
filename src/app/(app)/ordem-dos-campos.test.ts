import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { CAMPOS_CLIENTE } from './clientes/campos.ts';
import { CAMPOS_FORNECEDOR } from './fornecedores/campos.ts';
import { CAMPOS_FORA_DA_TELA, CAMPOS_OPERACAO } from './operacoes/campos.ts';

/**
 * As duas UIs de pop-up (clássica e moderna) têm de mostrar os mesmos campos
 * na mesma ordem — "o usuário não pode se confundir". Lê o fonte dos diálogos
 * e acha a primeira aparição de cada `name` (direto, `nome="…"`, ou pelos
 * componentes que embrulham um campo), na ordem do arquivo: no JSX, ordem do
 * fonte = ordem do DOM = ordem de Tab.
 */

const COMPONENTES: Record<string, string> = {
  '<QuemVisualiza': 'quem_visualiza',
  '<Declinios': 'declinios',
};

function ordemNoFonte(arquivo: string, campos: readonly string[]): string[] {
  const fonte = readFileSync(new URL(arquivo, import.meta.url), 'utf8');
  const achados: Array<{ pos: number; nome: string }> = [];
  for (const nome of campos) {
    const marcas = [`nome="${nome}"`, `name="${nome}"`];
    for (const [tag, n] of Object.entries(COMPONENTES)) if (n === nome) marcas.push(tag);
    const posicoes = marcas.map((m) => fonte.indexOf(m)).filter((p) => p >= 0);
    if (posicoes.length) achados.push({ pos: Math.min(...posicoes), nome });
  }
  return achados.sort((a, b) => a.pos - b.pos).map((a) => a.nome);
}

const casos = [
  { nome: 'cliente', campos: CAMPOS_CLIENTE, arquivos: ['./clientes/dialogo.tsx', './clientes/dialogo-moderno.tsx'] },
  { nome: 'fornecedor', campos: CAMPOS_FORNECEDOR, arquivos: ['./fornecedores/dialogo.tsx', './fornecedores/dialogo-moderno.tsx'] },
  { nome: 'operação', campos: CAMPOS_OPERACAO, arquivos: ['./operacoes/dialogo.tsx', './operacoes/dialogo-moderno.tsx'] },
];

for (const caso of casos) {
  for (const arquivo of caso.arquivos) {
    test(`${caso.nome}: ${arquivo} tem todos os campos, na ordem de campos.ts`, () => {
      assert.deepEqual(ordemNoFonte(arquivo, caso.campos), [...caso.campos]);
    });
  }
}

test('operação: PMTS, Comissão e Demanda final fora das duas UIs', () => {
  for (const arquivo of ['./operacoes/dialogo.tsx', './operacoes/dialogo-moderno.tsx']) {
    const fonte = readFileSync(new URL(arquivo, import.meta.url), 'utf8');
    for (const nome of CAMPOS_FORA_DA_TELA) {
      assert.ok(!fonte.includes(`nome="${nome}"`) && !fonte.includes(`name="${nome}"`), `${nome} em ${arquivo}`);
    }
  }
});
