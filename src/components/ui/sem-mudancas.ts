'use client';

import { useCallback, useRef, type FormEvent } from 'react';

/**
 * "Salvar" sem ter mudado nada não precisa ir ao servidor.
 *
 * Quem abre um registro e aperta Salvar sem mexer esperava ~1s por uma gravação
 * que não grava nada (docs/otimizacao-de-carregamento.md, 09/10/2026). Este hook
 * guarda uma fotografia do formulário logo depois de ele aparecer e, no submit,
 * compara com o que vai ser enviado. Igual: segura o envio, e quem chamou fecha o
 * diálogo e mostra o aviso de sempre — sem spinner, sem rede.
 *
 * A fotografia é do `FormData` do formulário, que já inclui o que importa:
 * campos controlados e multisseleção (as fichas viram `<input type="hidden">`),
 * interruptores (`checkbox` só entra quando ligado) e controles que moram fora
 * da `<form>` com `form="id"` — como "Estruturação em Andamento", no rodapé da
 * operação.
 *
 *   const semMudancas = useSemMudancas(Boolean(cliente));
 *   <form ref={semMudancas.ref} onSubmit={semMudancas.aoEnviar(() => { avisar(...); aoFechar(); })} action={agir}>
 *
 * `ativo` é falso para registro novo: cadastrar sempre vai ao servidor, mesmo
 * com tudo nos valores de partida.
 *
 * Na dúvida o envio segue: sem fotografia (submit antes de ela ser tirada) ou
 * com qualquer diferença, vai ao servidor como sempre foi.
 */

function fotografia(forma: HTMLFormElement): string {
  const pares: Array<[string, string]> = [];
  new FormData(forma).forEach((valor, chave) => {
    pares.push([chave, typeof valor === 'string' ? valor : `${valor.name}:${valor.size}`]);
  });
  return JSON.stringify(pares);
}

export function useSemMudancas(ativo = true) {
  const forma = useRef<HTMLFormElement | null>(null);
  const base = useRef<string | null>(null);
  const relogio = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Ref de callback: roda de novo quando a `<form>` é recriada (ex.: `key`
   * trocada), e a fotografia nova substitui a velha. O `setTimeout` deixa os
   * efeitos de montagem assentarem antes de tirar a foto; se algum deles mexer
   * no formulário depois, a diferença só empurra para o lado seguro (servidor).
   */
  const ref = useCallback((el: HTMLFormElement | null) => {
    forma.current = el;
    base.current = null;
    if (relogio.current) clearTimeout(relogio.current);
    if (el) {
      relogio.current = setTimeout(() => {
        if (forma.current === el) base.current = fotografia(el);
      }, 0);
    }
  }, []);

  const aoEnviar = useCallback(
    (aoSemMudancas: () => void) => (e: FormEvent<HTMLFormElement>) => {
      if (!ativo || base.current === null) return;
      if (fotografia(e.currentTarget) !== base.current) return;
      // Segura a action do `<form>`: nada vai ao servidor.
      e.preventDefault();
      aoSemMudancas();
    },
    [ativo],
  );

  return { ref, aoEnviar };
}
