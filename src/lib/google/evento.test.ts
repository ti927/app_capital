import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  emailValido,
  eventoAvulso,
  linkModeloGoogle,
  montarEvento,
  planejar,
  precisaDeEvento,
  somarMinutos,
  type TarefaParaAgenda,
} from './evento.ts';

/**
 * O que erra em silêncio aqui é a decisão de criar, apagar ou mover — e o
 * horário, que o Google aceita mesmo errado. Tudo sem rede.
 */

const base: TarefaParaAgenda = {
  id: 't1',
  titulo: 'Reunião com a ACME',
  descricao: null,
  tipo: 'reuniao',
  prazo: '2026-10-05',
  hora: '15:00:00',
  responsavel_id: 'ana',
  convidar_contato: false,
  email_convidado: null,
  google_evento_id: null,
  google_agenda_de: null,
};
const todosConectados = () => true;

test('reunião com data, hora e responsável conectado tem evento', () => {
  assert.equal(precisaDeEvento(base, todosConectados), true);
});

test('sem hora, sem prazo, outro tipo ou responsável desconectado: sem evento', () => {
  assert.equal(precisaDeEvento({ ...base, hora: null }, todosConectados), false);
  assert.equal(precisaDeEvento({ ...base, prazo: null }, todosConectados), false);
  assert.equal(precisaDeEvento({ ...base, tipo: 'ligacao' }, todosConectados), false);
  assert.equal(precisaDeEvento({ ...base, responsavel_id: null }, todosConectados), false);
  assert.equal(precisaDeEvento(base, () => false), false);
});

test('planejar: cria, atualiza, move e apaga', () => {
  assert.deepEqual(planejar(base, true), { acao: 'criar', agenda: 'ana' });
  assert.deepEqual(planejar(base, false), { acao: 'nada' });

  const comEvento = { ...base, google_evento_id: 'ev1', google_agenda_de: 'ana' };
  assert.deepEqual(planejar(comEvento, true), { acao: 'atualizar', agenda: 'ana', eventoId: 'ev1' });
  assert.deepEqual(planejar(comEvento, false), { acao: 'apagar', agenda: 'ana', eventoId: 'ev1' });
  assert.deepEqual(planejar({ ...comEvento, responsavel_id: 'bia' }, true), {
    acao: 'mover',
    de: 'ana',
    para: 'bia',
    eventoId: 'ev1',
  });
});

test('trocar o responsável para quem não conectou apaga da agenda antiga', () => {
  const comEvento = { ...base, google_evento_id: 'ev1', google_agenda_de: 'ana', responsavel_id: 'bia' };
  const deveTer = precisaDeEvento(comEvento, (p) => p === 'ana');
  assert.deepEqual(planejar(comEvento, deveTer), { acao: 'apagar', agenda: 'ana', eventoId: 'ev1' });
});

test('uma hora de duração, virando o dia quando precisa', () => {
  assert.equal(somarMinutos('2026-10-05', '15:00', 60), '2026-10-05T16:00:00');
  assert.equal(somarMinutos('2026-10-05', '23:30', 60), '2026-10-06T00:30:00');
  assert.equal(somarMinutos('2026-12-31', '23:15', 60), '2027-01-01T00:15:00');
});

test('o evento leva fuso de São Paulo, Meet só na criação e link de volta', () => {
  const ctx = { empresa: 'ACME', linkFunil: 'https://app/funil' };
  const novo = montarEvento({ ...base, prazo: '2026-10-05T00:00:00' }, ctx, true);
  assert.equal(novo.start.dateTime, '2026-10-05T15:00:00');
  assert.equal(novo.start.timeZone, 'America/Sao_Paulo');
  assert.equal(novo.end.dateTime, '2026-10-05T16:00:00');
  assert.equal(novo.conferenceData?.createRequest.conferenceSolutionKey.type, 'hangoutsMeet');
  assert.match(novo.description, /Cartão: ACME/);
  assert.match(novo.description, /https:\/\/app\/funil/);

  assert.equal(montarEvento(base, ctx, false).conferenceData, undefined);
});

test('convidado só entra com o interruptor ligado e e-mail válido', () => {
  const ctx = { empresa: null, linkFunil: 'x' };
  const comEmail = { ...base, email_convidado: ' contato@acme.com ' };
  assert.deepEqual(montarEvento(comEmail, ctx, false).attendees, []);
  assert.deepEqual(montarEvento({ ...comEmail, convidar_contato: true }, ctx, false).attendees, [
    { email: 'contato@acme.com' },
  ]);
  assert.deepEqual(
    montarEvento({ ...base, convidar_contato: true, email_convidado: 'não é e-mail' }, ctx, false).attendees,
    [],
  );
});

test('emailValido confere formato', () => {
  assert.equal(emailValido('a@b.co'), true);
  assert.equal(emailValido('a@b'), false);
  assert.equal(emailValido(''), false);
  assert.equal(emailValido(null), false);
});

test('cópia avulsa: com hora, uma hora no fuso; sem hora, dia inteiro', () => {
  const ctx = { empresa: 'ACME', linkFunil: 'https://app/funil' };
  const t = { titulo: 'Ligar', descricao: null, prazo: '2026-10-31T00:00:00', hora: '23:30:00' };
  const comHora = eventoAvulso(t, ctx);
  assert.deepEqual(comHora.start, { dateTime: '2026-10-31T23:30:00', timeZone: 'America/Sao_Paulo' });
  assert.deepEqual(comHora.end, { dateTime: '2026-11-01T00:30:00', timeZone: 'America/Sao_Paulo' });
  assert.equal('attendees' in comHora, false);

  const diaInteiro = eventoAvulso({ ...t, hora: null }, ctx);
  assert.deepEqual(diaInteiro.start, { date: '2026-10-31' });
  assert.deepEqual(diaInteiro.end, { date: '2026-11-01' });
});

test('link de modelo do Google Agenda traz título, datas e fuso', () => {
  const ctx = { empresa: null, linkFunil: 'x' };
  const url = new URL(linkModeloGoogle({ titulo: 'Reunião', descricao: null, prazo: '2026-10-22', hora: '16:00' }, ctx));
  assert.equal(url.searchParams.get('action'), 'TEMPLATE');
  assert.equal(url.searchParams.get('text'), 'Reunião');
  assert.equal(url.searchParams.get('dates'), '20261022T160000/20261022T170000');
  assert.equal(url.searchParams.get('ctz'), 'America/Sao_Paulo');

  const dia = new URL(linkModeloGoogle({ titulo: 'x', descricao: null, prazo: '2026-10-22', hora: null }, ctx));
  assert.equal(dia.searchParams.get('dates'), '20261022/20261023');
});
