/**
 * Regras puras da tarefa → evento do Google Agenda (specs/11-google-agenda.md).
 * Nada aqui fala com o Google nem com o banco: é o que decide **se** há evento,
 * **o que** fazer com ele e **como** ele se monta. Por isso é testável sem
 * rede — `evento.test.ts`.
 */

export const FUSO = 'America/Sao_Paulo';
export const DURACAO_MIN = 60;

export interface TarefaParaAgenda {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: string | null;
  /** `yyyy-mm-dd` (pode vir com hora atrás, como o Postgres devolve). */
  prazo: string | null;
  /** `HH:MM` ou `HH:MM:SS`. */
  hora: string | null;
  responsavel_id: string | null;
  convidar_contato: boolean;
  email_convidado: string | null;
  /** Onde o evento está hoje, se está. */
  google_evento_id: string | null;
  google_agenda_de: string | null;
}

/** As três condições do spec: reunião, com data e hora, e responsável conectado. */
export function precisaDeEvento(t: TarefaParaAgenda, conectado: (perfilId: string) => boolean) {
  return (
    t.tipo === 'reuniao' &&
    Boolean(t.prazo) &&
    Boolean(t.hora) &&
    Boolean(t.responsavel_id) &&
    conectado(t.responsavel_id as string)
  );
}

export type Plano =
  | { acao: 'nada' }
  | { acao: 'criar'; agenda: string }
  | { acao: 'atualizar'; agenda: string; eventoId: string }
  | { acao: 'apagar'; agenda: string; eventoId: string }
  | { acao: 'mover'; de: string; para: string; eventoId: string };

/**
 * O que fazer, dado onde o evento está e se ele deve existir. "Mover" é apagar
 * numa agenda e criar na outra — a API do Google só move entre agendas do
 * mesmo dono.
 */
export function planejar(t: TarefaParaAgenda, deveTer: boolean): Plano {
  const temHoje = Boolean(t.google_evento_id && t.google_agenda_de);

  if (!deveTer) {
    return temHoje
      ? { acao: 'apagar', agenda: t.google_agenda_de as string, eventoId: t.google_evento_id as string }
      : { acao: 'nada' };
  }

  const responsavel = t.responsavel_id as string;
  if (!temHoje) return { acao: 'criar', agenda: responsavel };
  if (t.google_agenda_de !== responsavel) {
    return {
      acao: 'mover',
      de: t.google_agenda_de as string,
      para: responsavel,
      eventoId: t.google_evento_id as string,
    };
  }
  return { acao: 'atualizar', agenda: responsavel, eventoId: t.google_evento_id as string };
}

/** Confere o formato, não a existência — quem existe é o Google que diz. */
export function emailValido(email: string | null | undefined): email is string {
  return Boolean(email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()));
}

/**
 * `yyyy-mm-dd` + `HH:MM` + minutos → `yyyy-mm-ddTHH:MM:00`, sem fuso: o fuso
 * vai à parte, em `timeZone`. A conta é feita em UTC só para virar o dia
 * direito (reunião às 23h30 termina no dia seguinte), sem horário de verão no
 * meio.
 */
export function somarMinutos(data: string, hora: string, minutos: number) {
  const [a, m, d] = data.slice(0, 10).split('-').map(Number);
  const [h, min] = hora.split(':').map(Number);
  const t = new Date(Date.UTC(a, m - 1, d, h, min + minutos));
  const p = (n: number) => String(n).padStart(2, '0');
  return (
    `${t.getUTCFullYear()}-${p(t.getUTCMonth() + 1)}-${p(t.getUTCDate())}` +
    `T${p(t.getUTCHours())}:${p(t.getUTCMinutes())}:00`
  );
}

export interface EventoGoogle {
  summary: string;
  description: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  attendees: Array<{ email: string }>;
  conferenceData?: {
    createRequest: { requestId: string; conferenceSolutionKey: { type: 'hangoutsMeet' } };
  };
}

/**
 * O corpo do evento. `comMeet` só na criação: num PATCH, mandar outro
 * `createRequest` pediria uma sala nova e trocaria o link de quem já recebeu.
 * `attendees` vai sempre — vazio quando o convite está desligado, para que
 * desligar o interruptor tire o convidado do evento.
 */
export function montarEvento(
  t: TarefaParaAgenda,
  contexto: { empresa: string | null; linkFunil: string },
  comMeet: boolean,
): EventoGoogle {
  const prazo = (t.prazo as string).slice(0, 10);
  const hora = (t.hora as string).slice(0, 5);

  const descricao = [
    t.descricao?.trim(),
    contexto.empresa ? `Cartão: ${contexto.empresa}` : null,
    `No app: ${contexto.linkFunil}`,
  ]
    .filter(Boolean)
    .join('\n\n');

  const convidado =
    t.convidar_contato && emailValido(t.email_convidado) ? [{ email: t.email_convidado.trim() }] : [];

  return {
    summary: t.titulo,
    description: descricao,
    start: { dateTime: somarMinutos(prazo, hora, 0), timeZone: FUSO },
    end: { dateTime: somarMinutos(prazo, hora, DURACAO_MIN), timeZone: FUSO },
    attendees: convidado,
    ...(comMeet
      ? {
          conferenceData: {
            createRequest: {
              requestId: `${t.id}-${Date.now()}`,
              conferenceSolutionKey: { type: 'hangoutsMeet' as const },
            },
          },
        }
      : {}),
  };
}
