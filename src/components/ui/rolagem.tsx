'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/* ---------------------------------------------------------------------------
   Rolagem sob demanda.

   O problema que isto resolve não é o banco — é o navegador. Uma lista de
   1.000 clientes chega inteira no mesmo pacote (o custo de rede é o mesmo),
   mas montar as 1.000 linhas no DOM antes de mostrar qualquer coisa trava a
   tela: o React precisa criar os nós, o navegador precisa calcular o layout de
   todos, e nada aparece até o fim. Mostrando os primeiros 40 e crescendo
   conforme a pessoa rola, o primeiro desenho é 25x menor e o resto entra sem
   ninguém perceber.

   Hoje o sistema tem 51 clientes e 70 fundos, então isto não muda o relógio.
   Está aqui porque é onde a conta vira: a partir de algumas centenas de linhas
   o primeiro desenho começa a pesar, e o remédio não pode chegar depois da
   queixa. Ver docs/otimizacao-de-carregamento.md.

   Não é paginação de banco: a lista inteira já está na memória, e por isso
   busca, filtro, ordenação e contagem continuam valendo sobre o total — quem
   busca "Trigobel" acha, mesmo que esteja na linha 800.
   --------------------------------------------------------------------------- */

/** Quantos itens entram por vez. Cobre uma tela cheia com folga. */
export const LOTE = 40;

export interface Incremental<T> {
  /** O pedaço que deve ir para o DOM agora. */
  visiveis: T[];
  /** Quantos ainda faltam. Zero quando a lista acabou. */
  faltam: number;
  /** Solta o próximo lote. */
  carregarMais: () => void;
}

/**
 * Corta a lista no primeiro lote e vai crescendo.
 *
 * `itens` precisa ser estável entre renders (venha de `useMemo`), senão o
 * efeito que reinicia o corte dispara sozinho e a lista nunca cresce.
 */
export function useListaIncremental<T>(itens: T[], lote = LOTE): Incremental<T> {
  const [limite, setLimite] = useState(lote);

  /**
   * Buscar, filtrar ou trocar de aba volta a lista ao primeiro lote: quem
   * digita uma busca quer ver o começo do resultado, não continuar na altura
   * em que estava na lista anterior.
   */
  useEffect(() => {
    setLimite(lote);
  }, [itens, lote]);

  const carregarMais = useCallback(() => setLimite((l) => l + lote), [lote]);

  return {
    visiveis: limite >= itens.length ? itens : itens.slice(0, limite),
    faltam: Math.max(0, itens.length - limite),
    carregarMais,
  };
}

/**
 * Sentinela do fim da lista: quando chega perto da vista, pede o próximo lote.
 *
 * O `rootMargin` de 600px é o ponto todo — o lote é pedido bem antes de a
 * pessoa chegar ao fim, então ela nunca vê a lista acabar. Sem essa folga, a
 * rolagem trava por um quadro a cada lote.
 *
 * O botão não é enfeite nem alternativa escondida: o `IntersectionObserver`
 * não dispara para quem navega por teclado (Tab não "rola até a vista" de um
 * `<div>` vazio) nem quando o sistema está com JavaScript engasgado. O botão é
 * o caminho que sempre funciona; o observador é o atalho para quem usa mouse.
 */
export function CarregarMais({
  faltam,
  aoCarregar,
  substantivo = 'itens',
  raiz,
}: {
  faltam: number;
  aoCarregar: () => void;
  /** Plural, para o rótulo: "mais 40 clientes". */
  substantivo?: string;
  /**
   * O elemento que rola, quando não é a janela — a coluna do funil, por
   * exemplo, que tem `overflow-y: auto` própria.
   *
   * Isto não é detalhe: sem `root`, o observador compara com a janela, e a
   * sentinela dentro de uma coluna fica recortada pela própria coluna. O
   * `rootMargin` então não adianta nada, porque o que está recortado não
   * intersecta coisa alguma — o lote só entraria ao chegar no fim, com um
   * tranco. Apontando a raiz certa, a folga volta a valer.
   */
  raiz?: React.RefObject<HTMLElement | null>;
}) {
  const alvo = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const no = alvo.current;
    if (!no || !faltam) return;

    const observador = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) aoCarregar();
      },
      { root: raiz?.current ?? null, rootMargin: '600px' },
    );
    observador.observe(no);
    return () => observador.disconnect();
  }, [faltam, aoCarregar, raiz]);

  if (!faltam) return null;

  return (
    <div ref={alvo} className="carregar-mais">
      <button type="button" className="carregar-mais__botao" onClick={aoCarregar}>
        Mostrar mais {substantivo}
      </button>
      <span className="apoio carregar-mais__conta">
        {faltam} {faltam === 1 ? 'restante' : 'restantes'}
      </span>
    </div>
  );
}
