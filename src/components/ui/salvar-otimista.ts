'use client';

import { startTransition, useCallback, useRef, type FormEvent } from 'react';
import { useAvisos } from './aviso';

/**
 * Salvar sem esperar o servidor (docs/otimizacao-de-carregamento.md, 3.8).
 *
 * O submit fecha o diálogo e mostra o aviso na hora; a gravação segue em
 * segundo plano e a lista se atualiza quando o servidor responde (~0,4s). Se a
 * gravação falhar, sobe um aviso de erro com "Tentar de novo", que reenvia
 * exatamente o que foi digitado — nada se perde por ter fechado antes.
 *
 * Salvar sem ter mudado nada (registro existente, formulário igual ao da
 * abertura) nem vai ao servidor.
 *
 *   const salvar = useSalvarOtimista(gravarFornecedor, {
 *     existente: Boolean(fornecedor), id: fornecedor?.id,
 *     mensagem: 'Fundo salvo', oQue: 'o fundo', aoFechar,
 *   });
 *   <form ref={salvar.ref} onSubmit={salvar.aoEnviar}>
 *
 * A fotografia é do `FormData`, que já inclui campos controlados, fichas de
 * multisseleção (`<input type="hidden">`), interruptores e controles fora da
 * `<form>` ligados por `form="id"`.
 */

export interface RespostaDeGravar {
  erro?: string;
  ok?: boolean;
  id?: string;
  /** Gravou, mas algo ao lado (ex.: Google Agenda) falhou: avisa como erro. */
  aviso?: string;
}

interface Opcoes {
  /** Registro que já existe: habilita o "sem mudança, sem servidor". */
  existente: boolean;
  /** Id do registro, para o destaque na lista já no clique. */
  id?: string | null;
  /** Aviso de sucesso, mostrado no clique. */
  mensagem: string;
  /** Como o registro aparece no aviso de erro ("o fundo", "a tarefa"…). */
  oQue: string;
  aoFechar: () => void;
  /**
   * A mesma regra que a action confere, checada antes de fechar: o que dá
   * para saber sem servidor (campo obrigatório vazio) não pode virar um
   * "salvo" seguido de erro. Devolve a mensagem, ou null.
   */
  validar?: (dados: FormData) => string | null;
}

function fotografia(forma: HTMLFormElement): string {
  const pares: Array<[string, string]> = [];
  new FormData(forma).forEach((valor, chave) => {
    pares.push([chave, typeof valor === 'string' ? valor : `${valor.name}:${valor.size}`]);
  });
  return JSON.stringify(pares);
}

export function useSalvarOtimista(
  acao: (anterior: unknown, dados: FormData) => Promise<RespostaDeGravar | null>,
  opcoes: Opcoes,
) {
  const { avisar, destacar } = useAvisos();
  const forma = useRef<HTMLFormElement | null>(null);
  const base = useRef<string | null>(null);
  const relogio = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Muda a cada render (aoFechar é função nova): lida na hora do submit.
  const atual = useRef(opcoes);
  atual.current = opcoes;

  /**
   * Ref de callback: roda de novo quando a `<form>` é recriada, e a fotografia
   * nova substitui a velha. O `setTimeout` deixa os efeitos de montagem
   * assentarem antes da foto; se algum mexer depois, a diferença só empurra
   * para o lado seguro (servidor).
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

  /**
   * Roda fora do ciclo de vida do diálogo: ele já fechou quando a resposta
   * chega. `avisar`/`destacar` vêm do provider da casca, que segue montado.
   */
  const enviar = useCallback(
    (dados: FormData, oQue: string, idConhecido: string | null) => {
      startTransition(async () => {
        let r: RespostaDeGravar;
        try {
          r = (await acao(null, dados)) ?? {};
        } catch {
          r = { erro: 'sem resposta do servidor.' };
        }
        if (r.erro) {
          avisar(/^Não consegui/.test(r.erro) ? `Não consegui salvar ${oQue}.` : `Não salvei ${oQue}: ${r.erro}`, {
            tipo: 'erro',
            acao: { rotulo: 'Tentar de novo', fazer: () => enviar(dados, oQue, idConhecido) },
          });
          return;
        }
        if (r.aviso) avisar(`Salvei ${oQue}, mas: ${r.aviso}`, { tipo: 'erro' });
        // Registro novo: o id só existe agora.
        if (!idConhecido && r.id) destacar(r.id);
      });
    },
    [acao, avisar, destacar],
  );

  const aoEnviar = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const { existente, id, mensagem, oQue, aoFechar, validar } = atual.current;
      const el = e.currentTarget;
      const igual = existente && base.current !== null && fotografia(el) === base.current;
      const dados = igual ? null : new FormData(el);

      const problema = dados && validar ? validar(dados) : null;
      if (problema) {
        avisar(problema, { tipo: 'erro' });
        return;
      }

      avisar(mensagem, { id: id ?? undefined });
      aoFechar();
      if (dados) enviar(dados, oQue, id ?? null);
    },
    [avisar, enviar],
  );

  return { ref, aoEnviar };
}
