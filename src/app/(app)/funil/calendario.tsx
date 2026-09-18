'use client';

import { useMemo, useState } from 'react';
import { IconeChevronDireita, IconeChevronEsquerda } from '@/components/ui/icones';
import { doISO, hoje, paraISO } from './tarefas-apoio';
import type { Tarefa } from './page';

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];
const DIAS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'];

/**
 * Calendário mensal. Sem biblioteca: é uma grade de sete colunas montada com
 * `Date`, a semana começando na segunda.
 *
 * O dia com tarefa em aberto ganha um ponto — vermelho quando há vencida ali,
 * cor da marca quando está tudo em dia. Clicar no dia filtra a lista ao lado;
 * clicar de novo no mesmo dia tira o filtro.
 */
export function Calendario({
  tarefas,
  diaEscolhido,
  aoEscolherDia,
}: {
  tarefas: Tarefa[];
  diaEscolhido: string | null;
  aoEscolherDia: (iso: string | null) => void;
}) {
  const agora = hoje();
  const [mes, setMes] = useState(() => new Date(agora.getFullYear(), agora.getMonth(), 1));

  /** Por dia: quantas tarefas em aberto, e se alguma delas já venceu. */
  const porDia = useMemo(() => {
    const mapa = new Map<string, { total: number; vencida: boolean }>();
    for (const t of tarefas) {
      if (t.concluida || !t.prazo) continue;
      const iso = t.prazo.slice(0, 10);
      const d = doISO(iso);
      const atual = mapa.get(iso) ?? { total: 0, vencida: false };
      mapa.set(iso, { total: atual.total + 1, vencida: atual.vencida || (d !== null && d < agora) });
    }
    return mapa;
  }, [tarefas, agora]);

  /**
   * As 42 células da grade (6 semanas), começando na segunda anterior ao dia 1
   * do mês. Tamanho fixo: a grade não muda de altura ao trocar de mês.
   */
  const celulas = useMemo(() => {
    const primeiro = new Date(mes.getFullYear(), mes.getMonth(), 1);
    const diaDaSemana = primeiro.getDay() === 0 ? 7 : primeiro.getDay();
    const inicio = new Date(primeiro);
    inicio.setDate(primeiro.getDate() - (diaDaSemana - 1));

    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + i);
      return { data: d, iso: paraISO(d), doMes: d.getMonth() === mes.getMonth() };
    });
  }, [mes]);

  const isoHoje = paraISO(agora);
  const andar = (passo: number) => setMes((m) => new Date(m.getFullYear(), m.getMonth() + passo, 1));

  return (
    <div className="cal">
      <header className="cal__topo">
        <button type="button" className="cal__nav" onClick={() => andar(-1)} aria-label="Mês anterior">
          <IconeChevronEsquerda tamanho={15} />
        </button>
        <p className="cal__mes">
          {MESES[mes.getMonth()]} <span className="cal__ano">{mes.getFullYear()}</span>
        </p>
        <button type="button" className="cal__nav" onClick={() => andar(1)} aria-label="Próximo mês">
          <IconeChevronDireita tamanho={15} />
        </button>
      </header>

      <div className="cal__semana" aria-hidden="true">
        {DIAS.map((d) => (
          <span key={d} className="cal__dia-nome">
            {d}
          </span>
        ))}
      </div>

      {/* Sem `role="grid"`: não há linhas nem cabeçalho de grade de verdade.
          São botões de alternar, e `aria-pressed` diz qual dia está filtrando. */}
      <div className="cal__grade" aria-label="Calendário de tarefas">
        {celulas.map(({ data, iso, doMes }) => {
          const marca = porDia.get(iso);
          const escolhido = diaEscolhido === iso;
          const classe = [
            'cal__dia',
            !doMes && 'cal__dia--fora',
            iso === isoHoje && 'cal__dia--hoje',
            escolhido && 'cal__dia--escolhido',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <button
              key={iso}
              type="button"
              className={classe}
              aria-pressed={escolhido}
              aria-label={
                marca
                  ? `${data.getDate()} de ${MESES[data.getMonth()]}: ${marca.total} tarefa(s) em aberto`
                  : `${data.getDate()} de ${MESES[data.getMonth()]}`
              }
              onClick={() => aoEscolherDia(escolhido ? null : iso)}
            >
              <span className="cal__numero">{data.getDate()}</span>
              {marca ? (
                <span className={['cal__ponto', marca.vencida && 'cal__ponto--vencida'].filter(Boolean).join(' ')} />
              ) : null}
            </button>
          );
        })}
      </div>

      {diaEscolhido ? (
        <button type="button" className="cal__limpar" onClick={() => aoEscolherDia(null)}>
          Mostrar todos os dias
        </button>
      ) : null}

      {/* Cor nunca é o único sinal: a legenda diz o que cada ponto quer dizer. */}
      <p className="cal__legenda apoio">
        <span className="cal__ponto cal__ponto--vencida" /> vencida
        <span className="cal__ponto" /> em dia
      </p>
    </div>
  );
}
