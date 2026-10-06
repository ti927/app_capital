'use client';

import { useEffect, useRef } from 'react';

/**
 * A marca do item selecionado que **desliza** de um item para o outro — o
 * sublinhado das abas e a pílula do menu lateral (pedido de 05/10/2026:
 * "animações fluídas entre as trocas de abas").
 *
 * Fica dentro do contêiner (que precisa de `position: relative`), procura o
 * item marcado por `seletor` e se posiciona sobre ele. Observa mudanças de
 * atributo (aria-selected / aria-current) e de tamanho, então quem usa não
 * precisa avisar nada: trocou a aba, a marca vai junto.
 *
 * Também publica `--aba-dir` (-1 esquerda/cima, 1 direita/baixo) no `<html>`,
 * que o painel da aba usa para entrar do lado certo (animacoes.css).
 *
 * Na primeira vez aparece já no lugar, sem deslizar de lugar nenhum.
 */
export function Indicador({ seletor, tipo }: { seletor: string; tipo: 'sublinhado' | 'pilula' }) {
  const marca = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = marca.current;
    const pai = el?.parentElement;
    if (!el || !pai) return;
    let anterior: { x: number; y: number } | null = null;

    const posicionar = () => {
      const alvo = pai.querySelector<HTMLElement>(seletor);
      if (!alvo) {
        el.style.opacity = '0';
        return;
      }
      const x = alvo.offsetLeft;
      const y = alvo.offsetTop;
      if (anterior && (anterior.x !== x || anterior.y !== y)) {
        const dir = tipo === 'sublinhado' ? Math.sign(x - anterior.x) : Math.sign(y - anterior.y);
        document.documentElement.style.setProperty('--aba-dir', String(dir));
      }
      if (tipo === 'sublinhado') {
        el.style.transform = `translateX(${x}px)`;
        el.style.width = `${alvo.offsetWidth}px`;
      } else {
        el.style.transform = `translate(${x}px, ${y}px)`;
        el.style.width = `${alvo.offsetWidth}px`;
        el.style.height = `${alvo.offsetHeight}px`;
      }
      el.style.opacity = '1';
      // Sem transição no primeiro posicionamento: aparece no lugar.
      if (!anterior) requestAnimationFrame(() => el.classList.add('lc-indicador--pronto'));
      anterior = { x, y };
    };

    posicionar();
    const mudancas = new MutationObserver(posicionar);
    mudancas.observe(pai, {
      attributes: true,
      attributeFilter: ['aria-selected', 'aria-current', 'class'],
      subtree: true,
      childList: true,
    });
    const tamanho = new ResizeObserver(posicionar);
    tamanho.observe(pai);
    return () => {
      mudancas.disconnect();
      tamanho.disconnect();
    };
  }, [seletor, tipo]);

  return <span ref={marca} className={`lc-indicador lc-indicador--${tipo}`} aria-hidden="true" />;
}
