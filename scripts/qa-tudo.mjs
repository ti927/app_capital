#!/usr/bin/env node
/**
 * Roda as três formas do QA ao mesmo tempo, em processos separados.
 *
 *   npm run qa:tudo
 *
 * Sequencial, as três levavam a soma das três. Elas não disputam nada: cada
 * uma abre o seu Chromium, entra com a mesma conta e grava numa pasta própria
 * (`qa/claro`, `qa/escuro`, `qa/celular`). O servidor aguenta — são ~40
 * requisições por corrida.
 *
 * Sai com código 1 se qualquer uma falhar, e imprime o resumo das três na
 * ordem, não embaralhado.
 */
import { spawn } from 'node:child_process';

const FORMAS = [
  { nome: 'claro', args: [] },
  { nome: 'escuro', args: ['--escuro'] },
  { nome: 'celular', args: ['--celular'] },
];

const inicio = Date.now();

const corridas = FORMAS.map(
  ({ nome, args }) =>
    new Promise((resolve) => {
      const filho = spawn(process.execPath, ['scripts/qa.mjs', ...args], {
        env: process.env,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let saida = '';
      filho.stdout.on('data', (p) => (saida += p));
      filho.stderr.on('data', (p) => (saida += p));
      filho.on('close', (codigo) => resolve({ nome, codigo, saida }));
    }),
);

const resultados = await Promise.all(corridas);

for (const { nome, saida } of resultados) {
  const linhas = saida.split('\n').filter((l) => l.trim());
  const falhas = linhas.filter((l) => l.includes('FALHA'));
  const resumo = linhas[linhas.length - 1] ?? '(sem saída)';
  console.log(`\n── ${nome} ──`);
  for (const f of falhas) console.log(f);
  console.log(resumo.trim());
}

const ruins = resultados.filter((r) => r.codigo !== 0);
console.log(`\n${((Date.now() - inicio) / 1000).toFixed(1)}s no total, as três em paralelo`);

if (ruins.length) {
  console.log(`\nfalhou: ${ruins.map((r) => r.nome).join(', ')}`);
  process.exit(1);
}
