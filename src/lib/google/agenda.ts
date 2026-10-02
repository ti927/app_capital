import { clienteAdmin } from '@/lib/supabase/admin';
import { marcarCaida, perfisConectados, tokenDe } from './conexao';
import { emailValido, montarEvento, planejar, precisaDeEvento, type TarefaParaAgenda } from './evento';

/**
 * A conversa com a API do Google Agenda (specs/11-google-agenda.md). Sem
 * biblioteca: são quatro chamadas HTTP — trocar o refresh token por um access
 * token, e criar, atualizar e apagar evento.
 *
 * Regra que manda em tudo aqui: **a agenda nunca impede salvar a tarefa.**
 * Nada daqui lança para a action; volta `{ aviso }` e a tela mostra.
 */

const API = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

class ErroAgenda extends Error {}

async function accessTokenDe(perfilId: string): Promise<string> {
  const refresh = await tokenDe(perfilId);
  if (!refresh) throw new ErroAgenda('a agenda dessa pessoa não está conectada');

  const resposta = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      refresh_token: refresh,
      grant_type: 'refresh_token',
    }),
  });
  const corpo = (await resposta.json().catch(() => ({}))) as { access_token?: string; error?: string };

  if (corpo.error === 'invalid_grant') {
    // A pessoa revogou o acesso, ou o Google expirou o token: só reconectando.
    await marcarCaida(perfilId);
    throw new ErroAgenda('o Google recusou a conexão — a pessoa precisa reconectar a agenda');
  }
  if (!resposta.ok || !corpo.access_token) {
    throw new ErroAgenda(`o Google não liberou o acesso (${corpo.error ?? resposta.status})`);
  }
  return corpo.access_token;
}

async function chamar(
  perfilId: string,
  metodo: 'POST' | 'PATCH' | 'DELETE',
  caminho: string,
  corpo?: unknown,
): Promise<{ id?: string; hangoutLink?: string }> {
  const token = await accessTokenDe(perfilId);
  const resposta = await fetch(`${API}${caminho}`, {
    method: metodo,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });

  // Apagar o que já não existe é sucesso: alguém apagou direto no Google.
  if (metodo === 'DELETE' && (resposta.status === 404 || resposta.status === 410)) return {};
  if (!resposta.ok) {
    const erro = (await resposta.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new ErroAgenda(erro?.error?.message ?? `o Google respondeu ${resposta.status}`);
  }
  return metodo === 'DELETE' ? {} : resposta.json();
}

const COLUNAS =
  'id, cartao_id, titulo, descricao, tipo, prazo, hora, responsavel_id, convidar_contato, ' +
  'email_convidado, google_evento_id, google_agenda_de';

/**
 * Deixa o Google igual à tarefa: cria, atualiza, move ou apaga o evento.
 * Chamado depois de criar ou gravar a tarefa. `origem` é o endereço do app,
 * para o link de volta na descrição do evento.
 */
export async function sincronizarEventoDaTarefa(tarefaId: string, origem: string): Promise<{ aviso?: string }> {
  try {
    const admin = clienteAdmin();
    const { data } = await admin.from('funil_tarefa').select(COLUNAS).eq('id', tarefaId).maybeSingle();
    if (!data) return {};
    const tarefa = data as unknown as TarefaParaAgenda & { cartao_id: string };

    const conectados = await perfisConectados();
    const plano = planejar(tarefa, precisaDeEvento(tarefa, (p) => conectados.has(p)));
    if (plano.acao === 'nada') return {};

    const { data: cartao } = await admin.from('funil_cartao').select('empresa').eq('id', tarefa.cartao_id).maybeSingle();
    const contexto = { empresa: (cartao?.empresa as string | null) ?? null, linkFunil: `${origem}/funil?aba=tarefas` };
    const avisar = tarefa.convidar_contato && emailValido(tarefa.email_convidado) ? 'all' : 'none';

    let gravar: { google_evento_id: string | null; google_agenda_de: string | null; meet_link?: string | null };

    switch (plano.acao) {
      case 'criar': {
        const ev = await chamar(plano.agenda, 'POST', `?conferenceDataVersion=1&sendUpdates=${avisar}`, montarEvento(tarefa, contexto, true));
        gravar = { google_evento_id: ev.id ?? null, google_agenda_de: plano.agenda, meet_link: ev.hangoutLink ?? null };
        break;
      }
      case 'atualizar': {
        const ev = await chamar(
          plano.agenda,
          'PATCH',
          `/${encodeURIComponent(plano.eventoId)}?conferenceDataVersion=1&sendUpdates=${avisar}`,
          montarEvento(tarefa, contexto, false),
        );
        gravar = { google_evento_id: plano.eventoId, google_agenda_de: plano.agenda, meet_link: ev.hangoutLink ?? null };
        break;
      }
      case 'mover': {
        // Cria antes de apagar: se o Google falhar no meio, sobra um evento a
        // mais na agenda antiga — nunca a reunião some das duas.
        const ev = await chamar(plano.para, 'POST', `?conferenceDataVersion=1&sendUpdates=${avisar}`, montarEvento(tarefa, contexto, true));
        await chamar(plano.de, 'DELETE', `/${encodeURIComponent(plano.eventoId)}?sendUpdates=${avisar}`).catch(() => {});
        gravar = { google_evento_id: ev.id ?? null, google_agenda_de: plano.para, meet_link: ev.hangoutLink ?? null };
        break;
      }
      case 'apagar': {
        await chamar(plano.agenda, 'DELETE', `/${encodeURIComponent(plano.eventoId)}?sendUpdates=${avisar}`);
        gravar = { google_evento_id: null, google_agenda_de: null, meet_link: null };
        break;
      }
    }

    await admin.from('funil_tarefa').update(gravar).eq('id', tarefaId);
    return {};
  } catch (e) {
    return { aviso: e instanceof ErroAgenda ? e.message : 'erro inesperado ao falar com o Google' };
  }
}

/**
 * Antes de excluir a tarefa: tira o evento da agenda. Recebe as colunas já
 * lidas porque, depois do delete, não há mais de onde ler.
 */
export async function apagarEventoDaTarefa(t: {
  google_evento_id: string | null;
  google_agenda_de: string | null;
  convidar_contato: boolean;
}): Promise<{ aviso?: string }> {
  if (!t.google_evento_id || !t.google_agenda_de) return {};
  try {
    await chamar(
      t.google_agenda_de,
      'DELETE',
      `/${encodeURIComponent(t.google_evento_id)}?sendUpdates=${t.convidar_contato ? 'all' : 'none'}`,
    );
    return {};
  } catch (e) {
    return { aviso: e instanceof ErroAgenda ? e.message : 'erro inesperado ao falar com o Google' };
  }
}

/** "Desconectar": devolve o token ao Google. Falhar aqui não impede apagar a conexão. */
export async function revogarNoGoogle(perfilId: string) {
  const refresh = await tokenDe(perfilId).catch(() => null);
  if (!refresh) return;
  await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(refresh)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  }).catch(() => {});
}
