'use client';

import { useCallback, useEffect, useRef, useState, type PointerEvent as EventoPonteiro } from 'react';

/**
 * Arrastar cartões do funil (pedido de 05/10/2026: "como quando se pega um Mii
 * no Wii").
 *
 * Não usa o arrastar nativo do navegador: a imagem que ele mostra é uma foto
 * parada, que não balança. Aqui o cartão vira uma cópia flutuante pendurada
 * no ponto onde foi pego, que balança como pêndulo conforme o movimento e se
 * debate sem parar (CSS), e a coluna mostra uma vaga pontilhada exatamente
 * onde ele vai cair.
 *
 * - Mouse/caneta: começa depois de 6px de movimento — clique simples abre o
 *   cartão, como antes.
 * - Toque: começa depois de segurar ~0,3s parado, para não roubar a rolagem.
 * - Esc cancela. Perto da borda, o quadro (e a coluna) rolam sozinhos.
 * - `prefers-reduced-motion`: sem balanço nem debater.
 */

export interface Vaga {
  etapaId: string;
  /** O cartão antes do qual o arrastado entra; `null` = fim da coluna. */
  antesDe: string | null;
}

export interface Arrasto {
  id: string;
  largura: number;
  altura: number;
  /** Onde o cartão foi pego, dentro dele — é o pivô do pêndulo. */
  pegaX: number;
  pegaY: number;
  /** Posição do ponteiro ao começar, para o primeiro quadro já sair no lugar. */
  x0: number;
  y0: number;
  vaga: Vaga | null;
}

const LIMIAR_PX = 6;
const SEGURAR_TOQUE_MS = 300;
const BORDA_ROLAGEM = 72;
const VELOCIDADE_ROLAGEM = 16;

const mesmaVaga = (a: Vaga | null, b: Vaga | null) =>
  a === b || (!!a && !!b && a.etapaId === b.etapaId && a.antesDe === b.antesDe);

/** A coluna e a posição sob o ponteiro, ignorando o próprio cartão arrastado. */
function vagaEm(x: number, y: number, id: string): Vaga | null {
  const coluna = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-etapa]');
  if (!coluna?.dataset.etapa || coluna.dataset.arquivados === 'true') return null;
  const cartoes = Array.from(coluna.querySelectorAll<HTMLElement>('[data-cartao]')).filter(
    (c) => c.dataset.cartao !== id,
  );
  for (const c of cartoes) {
    const r = c.getBoundingClientRect();
    if (y < r.top + r.height / 2) return { etapaId: coluna.dataset.etapa, antesDe: c.dataset.cartao ?? null };
  }
  return { etapaId: coluna.dataset.etapa, antesDe: null };
}

/** Rola `el` quando o ponteiro está perto da borda dele, no eixo pedido. */
function rolarPertoDaBorda(el: Element | null, x: number, y: number, eixo: 'x' | 'y') {
  if (!el) return;
  const r = el.getBoundingClientRect();
  if (eixo === 'x') {
    if (x < r.left + BORDA_ROLAGEM) el.scrollLeft -= VELOCIDADE_ROLAGEM;
    else if (x > r.right - BORDA_ROLAGEM) el.scrollLeft += VELOCIDADE_ROLAGEM;
  } else if (x >= r.left && x <= r.right) {
    if (y < r.top + BORDA_ROLAGEM) el.scrollTop -= VELOCIDADE_ROLAGEM;
    else if (y > r.bottom - BORDA_ROLAGEM) el.scrollTop += VELOCIDADE_ROLAGEM;
  }
}

export function useArrastoDeCartoes(aoSoltar: (id: string, vaga: Vaga) => void) {
  const [arrasto, setArrasto] = useState<Arrasto | null>(null);
  /** A cópia flutuante; o laço de animação mexe nela direto, sem re-render. */
  const flutuante = useRef<HTMLDivElement>(null);
  const soltar = useRef(aoSoltar);
  useEffect(() => {
    soltar.current = aoSoltar;
  }, [aoSoltar]);
  const desmontar = useRef<() => void>(() => {});

  useEffect(() => () => desmontar.current(), []);

  const pegar = useCallback((e: EventoPonteiro<HTMLElement>, id: string) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('.funil__cartao-acao, .funil__cartao-arquivar')) return;

    const cartao = e.currentTarget;
    const r = cartao.getBoundingClientRect();
    const toque = e.pointerType === 'touch';
    const origem = { x: e.clientX, y: e.clientY };
    const p = { x: e.clientX, y: e.clientY };
    const pega = { x: e.clientX - r.left, y: e.clientY - r.top };
    const fisica = { ultimoX: e.clientX, vel: 0, angulo: 0, giro: 0 };
    const semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let ativo = false;
    let vaga: Vaga | null = null;
    let quadro = 0;
    let timer = 0;

    const laco = () => {
      // Pêndulo: o cartão fica para trás do movimento e volta com mola.
      const dx = p.x - fisica.ultimoX;
      fisica.ultimoX = p.x;
      fisica.vel = fisica.vel * 0.6 + dx * 0.4;
      const alvo = semMovimento ? 0 : Math.max(-32, Math.min(32, fisica.vel * 1.7));
      fisica.giro = (fisica.giro + (alvo - fisica.angulo) * 0.16) * 0.8;
      fisica.angulo += fisica.giro;

      const el = flutuante.current;
      if (el) el.style.transform = `translate3d(${p.x - pega.x}px, ${p.y - pega.y}px, 0) rotate(${fisica.angulo}deg)`;

      rolarPertoDaBorda(document.querySelector('.funil__quadro'), p.x, p.y, 'x');
      rolarPertoDaBorda(
        document.elementFromPoint(p.x, p.y)?.closest('[data-etapa]')?.querySelector('.funil__cartoes') ?? null,
        p.x,
        p.y,
        'y',
      );

      const nova = vagaEm(p.x, p.y, id);
      if (!mesmaVaga(nova, vaga)) {
        vaga = nova;
        setArrasto((a) => (a ? { ...a, vaga: nova } : a));
      }
      quadro = requestAnimationFrame(laco);
    };

    const comecar = () => {
      ativo = true;
      document.body.classList.add('arrastando-cartao');
      vaga = vagaEm(p.x, p.y, id);
      setArrasto({ id, largura: r.width, altura: r.height, pegaX: pega.x, pegaY: pega.y, x0: p.x, y0: p.y, vaga });
      quadro = requestAnimationFrame(laco);
    };

    const mover = (ev: PointerEvent) => {
      p.x = ev.clientX;
      p.y = ev.clientY;
      if (ativo) return;
      const longe = Math.hypot(p.x - origem.x, p.y - origem.y);
      if (toque) {
        if (longe > 8) encerrar(); // rolou a tela: não é arrasto
      } else if (longe > LIMIAR_PX) {
        comecar();
      }
    };

    // No toque, impedir a rolagem só depois que o arrasto começou.
    const travarRolagem = (ev: TouchEvent) => {
      if (ativo) ev.preventDefault();
    };

    const encerrar = (soltou = false) => {
      window.clearTimeout(timer);
      cancelAnimationFrame(quadro);
      window.removeEventListener('pointermove', mover);
      window.removeEventListener('pointerup', aoLevantar);
      window.removeEventListener('pointercancel', aoCancelar);
      window.removeEventListener('keydown', aoTecla);
      document.removeEventListener('touchmove', travarRolagem);
      document.body.classList.remove('arrastando-cartao');
      desmontar.current = () => {};
      if (!ativo) return;
      // O clique que vem logo depois de soltar não pode abrir o cartão.
      const bloquear = (ev: MouseEvent) => {
        ev.stopPropagation();
        ev.preventDefault();
      };
      window.addEventListener('click', bloquear, { capture: true, once: true });
      window.setTimeout(() => window.removeEventListener('click', bloquear, { capture: true }), 60);
      setArrasto(null);
      if (soltou && vaga) soltar.current(id, vaga);
    };

    const aoLevantar = () => encerrar(true);
    const aoCancelar = () => encerrar(false);
    const aoTecla = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') encerrar(false);
    };

    window.addEventListener('pointermove', mover);
    window.addEventListener('pointerup', aoLevantar);
    window.addEventListener('pointercancel', aoCancelar);
    window.addEventListener('keydown', aoTecla);
    document.addEventListener('touchmove', travarRolagem, { passive: false });
    desmontar.current = () => encerrar(false);
    if (toque) timer = window.setTimeout(comecar, SEGURAR_TOQUE_MS);
  }, []);

  return { arrasto, pegar, flutuante };
}
