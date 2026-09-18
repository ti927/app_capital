import assert from 'node:assert/strict';
import { test } from 'node:test';
import { doISO, fimDaSemana, grupoDa, paraISO, prazoCurto } from './tarefas-apoio.ts';

/**
 * O que se testa aqui é conta de data — o que erra em silêncio e só aparece
 * quando a tarefa some do grupo certo. A referência é sempre uma data fixa,
 * nunca `new Date()`, senão o teste muda de resposta conforme o dia.
 */

const ref = new Date(2026, 8, 18); // sexta, 18/09/2026

test('doISO lê a data no fuso local, sem jogar o dia para trás', () => {
  const d = doISO('2026-09-18');
  assert.equal(d?.getFullYear(), 2026);
  assert.equal(d?.getMonth(), 8);
  assert.equal(d?.getDate(), 18);
});

test('doISO devolve nulo para o que não presta', () => {
  assert.equal(doISO(null), null);
  assert.equal(doISO(''), null);
});

test('paraISO e doISO fecham o ciclo', () => {
  assert.equal(paraISO(new Date(2026, 0, 5)), '2026-01-05');
  assert.equal(paraISO(doISO('2026-12-31') as Date), '2026-12-31');
});

test('a semana termina no domingo seguinte', () => {
  // 18/09/2026 é sexta: o domingo da semana é 20/09.
  assert.equal(paraISO(fimDaSemana(ref)), '2026-09-20');
  // Num domingo, a semana termina nele mesmo.
  assert.equal(paraISO(fimDaSemana(new Date(2026, 8, 20))), '2026-09-20');
  // Numa segunda, termina seis dias depois.
  assert.equal(paraISO(fimDaSemana(new Date(2026, 8, 21))), '2026-09-27');
});

test('cada prazo cai no seu grupo', () => {
  const g = (prazo: string | null, concluida = false) => grupoDa({ prazo, concluida }, ref);

  assert.equal(g('2026-09-17'), 'vencidas');
  assert.equal(g('2026-09-18'), 'hoje');
  assert.equal(g('2026-09-20'), 'semana'); // domingo ainda é "esta semana"
  assert.equal(g('2026-09-21'), 'mes'); // segunda já é "este mês"
  assert.equal(g('2026-09-30'), 'mes');
  assert.equal(g('2026-10-01'), 'proximo_mes');
  assert.equal(g('2026-10-31'), 'proximo_mes');
  assert.equal(g('2026-11-01'), 'depois');
  assert.equal(g(null), 'sem_prazo');
});

test('tarefa concluída vai para "concluídas", mesmo vencida', () => {
  assert.equal(grupoDa({ prazo: '2026-01-01', concluida: true }, ref), 'concluidas');
});

test('prazo curto mostra a hora só quando há hora', () => {
  assert.equal(prazoCurto('2026-09-18', null), '18/09');
  assert.equal(prazoCurto('2026-09-18', '15:00:00'), '18/09 às 15:00');
  assert.equal(prazoCurto(null, '15:00:00'), '');
});
