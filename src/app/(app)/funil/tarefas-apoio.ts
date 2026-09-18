/**
 * Apoio das tarefas do funil: a lista fixa de tipos e as contas de data.
 *
 * Fica fora do componente porque o painel (`tarefas.tsx`), o calendário
 * (`calendario.tsx`) e o bloco dentro do cartão (`dialogo.tsx`) usam as mesmas
 * contas — e porque conta de data é o que mais erra em silêncio.
 *
 * Toda data aqui é **local**. `prazo` chega do banco como `yyyy-mm-dd`; passar
 * essa string para `new Date()` a lê como UTC e, a oeste de Greenwich, joga o
 * dia para trás. Por isso `doISO` monta a data pelos três números.
 */
import type { TipoTarefa } from './page';

/** Os cinco tipos. `text` no banco, lista fixa aqui — como `cliente.status`. */
export const TIPOS_TAREFA: Array<{ valor: TipoTarefa; rotulo: string }> = [
  { valor: 'reuniao', rotulo: 'Reunião' },
  { valor: 'ligacao', rotulo: 'Ligação' },
  { valor: 'follow_up', rotulo: 'Follow-up' },
  { valor: 'documento', rotulo: 'Documento' },
  { valor: 'outro', rotulo: 'Outro' },
];

export function rotuloDoTipo(tipo: string | null | undefined) {
  return TIPOS_TAREFA.find((t) => t.valor === tipo)?.rotulo ?? '';
}

/* ------------------------------------------------------------------ datas -- */

/** `yyyy-mm-dd` → `Date` local à meia-noite. Nulo quando a string não presta. */
export function doISO(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const [a, m, d] = iso.slice(0, 10).split('-').map(Number);
  if (!a || !m || !d) return null;
  return new Date(a, m - 1, d);
}

/** `Date` → `yyyy-mm-dd` local (o `toISOString` seria UTC e erraria o dia). */
export function paraISO(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function hoje() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Domingo da semana corrente, à meia-noite — a semana começa na segunda. */
export function fimDaSemana(base: Date) {
  const d = new Date(base);
  // getDay(): 0 = domingo. Com a semana começando na segunda, domingo é o dia 7.
  const diaDaSemana = d.getDay() === 0 ? 7 : d.getDay();
  d.setDate(d.getDate() + (7 - diaDaSemana));
  return d;
}

export function fimDoMes(base: Date) {
  return new Date(base.getFullYear(), base.getMonth() + 1, 0);
}

export function fimDoMesSeguinte(base: Date) {
  return new Date(base.getFullYear(), base.getMonth() + 2, 0);
}

/** `dd/mm`, com a hora quando houver: `dd/mm às 15:00`. */
export function prazoCurto(prazo: string | null, hora: string | null) {
  const d = doISO(prazo);
  if (!d) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  const dia = `${p(d.getDate())}/${p(d.getMonth() + 1)}`;
  return hora ? `${dia} às ${hora.slice(0, 5)}` : dia;
}

/* ---------------------------------------------------------------- grupos -- */

export type ChaveGrupo =
  | 'vencidas'
  | 'hoje'
  | 'semana'
  | 'mes'
  | 'proximo_mes'
  | 'depois'
  | 'sem_prazo'
  | 'concluidas';

export const GRUPOS: Array<{ chave: ChaveGrupo; rotulo: string }> = [
  { chave: 'vencidas', rotulo: 'Vencidas' },
  { chave: 'hoje', rotulo: 'Hoje' },
  { chave: 'semana', rotulo: 'Esta semana' },
  { chave: 'mes', rotulo: 'Este mês' },
  { chave: 'proximo_mes', rotulo: 'Próximo mês' },
  { chave: 'depois', rotulo: 'Depois' },
  { chave: 'sem_prazo', rotulo: 'Sem prazo' },
  { chave: 'concluidas', rotulo: 'Concluídas' },
];

/**
 * Em que grupo a tarefa cai. `depois` e `sem_prazo` não estavam no desenho de
 * 08a — entraram porque sem eles a tarefa de daqui a três meses, ou a sem
 * prazo, sumiria da tela sem aviso. Ver specs/08-melhorias-qol.md.
 */
export function grupoDa(
  tarefa: { prazo: string | null; concluida: boolean },
  agora = hoje(),
): ChaveGrupo {
  if (tarefa.concluida) return 'concluidas';

  const prazo = doISO(tarefa.prazo);
  if (!prazo) return 'sem_prazo';

  if (prazo < agora) return 'vencidas';
  if (prazo.getTime() === agora.getTime()) return 'hoje';
  if (prazo <= fimDaSemana(agora)) return 'semana';
  if (prazo <= fimDoMes(agora)) return 'mes';
  if (prazo <= fimDoMesSeguinte(agora)) return 'proximo_mes';
  return 'depois';
}
