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
import fs from 'node:fs';

const FORMAS = [
  { nome: 'claro', args: [] },
  { nome: 'escuro', args: ['--escuro'] },
  { nome: 'celular', args: ['--celular'] },
];

const inicio = Date.now();

// O bloco da UI 2 (scripts/qa.mjs) espera as três chegarem antes de trocar a
// preferência da conta: a barreira começa vazia e conta quantas são.
fs.rmSync('qa/.ui2-chegou', { recursive: true, force: true });
fs.rmSync('qa/.trava-ui2', { recursive: true, force: true });
fs.rmSync('qa/.trava-notas', { recursive: true, force: true });
fs.rmSync('qa/.trava-interruptor', { recursive: true, force: true });

const corridas = FORMAS.map(
  ({ nome, args }) =>
    new Promise((resolve) => {
      const filho = spawn(process.execPath, ['scripts/qa.mjs', ...args], {
        env: { ...process.env, QA_PARALELO: String(FORMAS.length) },
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let saida = '';
      /**
       * Repassa o que o filho diz na hora, com a forma na frente. A primeira
       * versão só guardava e imprimia no fim: quando uma corrida travava, não
       * dava para saber onde — e foi o que aconteceu.
       */
      const eco = (pedaco) => {
        saida += pedaco;
        for (const linha of String(pedaco).split(String.fromCharCode(10))) {
          if (linha.includes('FALHA') || linha.includes('passos ok')) {
            console.log(`[${nome}] ${linha.trim()}`);
          }
        }
      };
      filho.stdout.on('data', eco);
      filho.stderr.on('data', eco);

      // Corrida que passa de 12 minutos está travada: mata e segue. Eram 4; o
      // bloco da UI 2 (14/10/2026) espera as três e roda uma forma por vez no fim.
      const relogio = setTimeout(() => filho.kill(), 720000);
      filho.on('close', () => clearTimeout(relogio));
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
