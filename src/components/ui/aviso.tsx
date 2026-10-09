'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { IconeFechar, IconeSalvar } from './icones';

/**
 * Avisos de canto de tela (toast) e o brilho do registro recém-salvo.
 *
 * Sem biblioteca: um provider na casca de `(app)/layout.tsx`, o hook
 * `useAvisos()` em quem grava. O aviso entra, fica ~3s e sai sozinho; vários
 * ao mesmo tempo se empilham. Movimento e cores em `animacoes.css`.
 */

export type TipoAviso = 'ok' | 'erro';

interface Aviso {
  chave: number;
  texto: string;
  tipo: TipoAviso;
  saindo: boolean;
  acao?: AcaoDoAviso;
}

/** Botão no próprio aviso — ex.: "Tentar de novo" quando a gravação falha. */
export interface AcaoDoAviso {
  rotulo: string;
  fazer: () => void;
}

interface Opcoes {
  tipo?: TipoAviso;
  /** Id do registro salvo: a linha dele dá um brilho curto (`useDestaque`). */
  id?: string | null;
  acao?: AcaoDoAviso;
}

interface Contexto {
  avisar: (texto: string, opcoes?: Opcoes) => void;
  /** Só o destaque, sem aviso: registro novo cujo id chegou depois. */
  destacar: (id: string) => void;
  destaque: string | null;
}

/** Quanto o aviso fica na tela. Erro fica mais: dá tempo de ler. */
const MS_OK = 3000;
const MS_ERRO = 5000;
/** Erro com ação ("Tentar de novo") fica bem mais: é a única chance de refazer. */
const MS_ERRO_COM_ACAO = 15000;
/** Tem que bater com `--mov-saida` de `animacoes.css`. */
const MS_SAIDA = 160;
/** Duração do destaque — igual à dos keyframes `lc-salvo-*` (1300ms). */
const MS_BRILHO = 1300;
const MAXIMO = 4;

// Fora do provider (teste, tela pública) `avisar` simplesmente não faz nada.
const Ctx = createContext<Contexto>({ avisar: () => {}, destacar: () => {}, destaque: null });

export function AvisosProvider({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [destaque, setDestaque] = useState<string | null>(null);
  const proxima = useRef(0);
  const relogios = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const relogioBrilho = useRef<ReturnType<typeof setTimeout> | null>(null);

  const depois = useCallback((ms: number, fn: () => void) => {
    const r = setTimeout(() => {
      relogios.current.delete(r);
      fn();
    }, ms);
    relogios.current.add(r);
  }, []);

  useEffect(() => {
    const todos = relogios.current;
    return () => {
      todos.forEach(clearTimeout);
      if (relogioBrilho.current) clearTimeout(relogioBrilho.current);
    };
  }, []);

  const dispensar = useCallback(
    (chave: number) => {
      setAvisos((l) => l.map((a) => (a.chave === chave ? { ...a, saindo: true } : a)));
      depois(MS_SAIDA, () => setAvisos((l) => l.filter((a) => a.chave !== chave)));
    },
    [depois],
  );

  const destacar = useCallback((id: string) => {
    if (relogioBrilho.current) clearTimeout(relogioBrilho.current);
    setDestaque(id);
    relogioBrilho.current = setTimeout(() => setDestaque(null), MS_BRILHO);
  }, []);

  const avisar = useCallback(
    (texto: string, { tipo = 'ok', id, acao }: Opcoes = {}) => {
      const chave = ++proxima.current;
      setAvisos((l) => [...l.slice(-(MAXIMO - 1)), { chave, texto, tipo, saindo: false, acao }]);
      depois(tipo === 'erro' ? (acao ? MS_ERRO_COM_ACAO : MS_ERRO) : MS_OK, () => dispensar(chave));
      if (id) destacar(id);
    },
    [depois, dispensar, destacar],
  );

  const valor = useMemo(() => ({ avisar, destacar, destaque }), [avisar, destacar, destaque]);

  return (
    <Ctx.Provider value={valor}>
      {children}
      {/* `role="status"` + `aria-live`: leitor de tela anuncia sem roubar o foco. */}
      <div className="lc-avisos" role="status" aria-live="polite" aria-atomic="false">
        {avisos.map((a) => (
          <div
            key={a.chave}
            className={['lc-aviso', `lc-aviso--${a.tipo}`, a.saindo && 'lc-aviso--saindo']
              .filter(Boolean)
              .join(' ')}
            role={a.tipo === 'erro' ? 'alert' : undefined}
          >
            <span className="lc-aviso__icone">
              {a.tipo === 'ok' ? <IconeSalvar tamanho={14} /> : <IconeFechar tamanho={14} />}
            </span>
            <span className="lc-aviso__texto">{a.texto}</span>
            {a.acao && (
              <button
                type="button"
                className="lc-aviso__acao"
                onClick={() => {
                  dispensar(a.chave);
                  a.acao?.fazer();
                }}
              >
                {a.acao.rotulo}
              </button>
            )}
            <button
              type="button"
              className="lc-aviso__fechar"
              aria-label="Dispensar aviso"
              onClick={() => dispensar(a.chave)}
            >
              <IconeFechar tamanho={12} />
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

/** `avisar('Cliente salvo', { id })` — toast + brilho na linha do registro. */
export function useAvisos() {
  const { avisar, destacar } = useContext(Ctx);
  return { avisar, destacar };
}

/** Id do registro que acabou de ser salvo (por ~1,3s), ou `null`. */
export function useDestaque() {
  return useContext(Ctx).destaque;
}

/** Classe da linha/cartão que deu o brilho. */
export const classeDestaque = (destaque: string | null, id: string) => (destaque === id ? 'lc-salvo' : undefined);
