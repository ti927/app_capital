'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

const cx = (...v: unknown[]) => v.filter((x): x is string => typeof x === 'string' && x !== '').join(' ');

export interface DialogoProps {
  aberto: boolean;
  aoFechar: () => void;
  titulo?: ReactNode;
  /** Linha de contexto acima do título, em mono 11px caixa alta. */
  contexto?: ReactNode;
  /** sm 620px · md 880px · lg 1120px · ampla = ~70% da janela, em 4:3. */
  largura?: 'sm' | 'md' | 'lg' | 'ampla';
  /** Ações do rodapé de 56px. */
  rodape?: ReactNode;
  children?: ReactNode;
  className?: string;
}

/** Tem que bater com `--mov-saida` de `animacoes.css`. */
const MS_SAIDA = 140;

/**
 * Diálogo do design system. Fecha por Esc e por clique no overlay, prende o
 * foco enquanto está aberto e devolve o foco ao fechar.
 *
 * Regra do design system: um diálogo mostra todos os seus campos, sempre, na
 * mesma forma. Nada esconde por estar vazio nem muda de lugar entre criar e
 * editar — só o rótulo do botão de confirmação muda.
 */
export function Dialogo({
  aberto,
  aoFechar,
  titulo,
  contexto,
  largura = 'sm',
  rodape,
  children,
  className,
}: DialogoProps) {
  const caixa = useRef<HTMLDivElement>(null);
  const focoAnterior = useRef<HTMLElement | null>(null);

  /**
   * `aberto` é do consumidor; `montado` é nosso. Quando `aberto` vira falso o
   * diálogo continua na tela por `MS_SAIDA`, rodando a animação de saída, e só
   * então desmonta — sumir no talho é o que fazia a tela parecer engasgada.
   * A API não muda: quem usa continua passando `aberto` e `aoFechar`.
   */
  const [montado, setMontado] = useState(aberto);
  const [saindo, setSaindo] = useState(false);

  useEffect(() => {
    if (aberto) {
      setMontado(true);
      setSaindo(false);
      return;
    }
    if (!montado) return;

    setSaindo(true);
    const relogio = setTimeout(() => {
      setMontado(false);
      setSaindo(false);
    }, MS_SAIDA);
    return () => clearTimeout(relogio);
  }, [aberto, montado]);

  useEffect(() => {
    if (!aberto) return;

    focoAnterior.current = document.activeElement as HTMLElement | null;

    const focaveis = () =>
      Array.from(
        caixa.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );

    focaveis()[0]?.focus();

    function aoTeclar(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        aoFechar();
        return;
      }
      if (e.key !== 'Tab') return;

      const lista = focaveis();
      if (!lista.length) return;
      const primeiro = lista[0];
      const ultimo = lista[lista.length - 1];

      if (e.shiftKey && document.activeElement === primeiro) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primeiro.focus();
      }
    }

    document.addEventListener('keydown', aoTeclar);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', aoTeclar);
      document.body.style.overflow = overflow;
      focoAnterior.current?.focus();
    };
  }, [aberto, aoFechar]);

  if (!montado) return null;

  return (
    <div
      className={cx('lc-overlay', saindo && 'lc-overlay--saindo')}
      onMouseDown={(e) => e.target === e.currentTarget && aoFechar()}
    >
      <div
        ref={caixa}
        className={cx('lc-dialog', `lc-dialog--${largura}`, className)}
        role="dialog"
        aria-modal="true"
        aria-label={typeof titulo === 'string' ? titulo : undefined}
      >
        <div className="lc-dialog__head">
          <div>
            {contexto ? <p className="lc-dialog__ctx">{contexto}</p> : null}
            {titulo ? <p className="lc-dialog__title">{titulo}</p> : null}
          </div>
          <button type="button" className="lc-btn lc-btn--tertiary lc-btn--row" onClick={aoFechar} aria-label="Fechar">
            ✕
          </button>
        </div>

        <div className="lc-dialog__body">{children}</div>

        {rodape ? <div className="lc-dialog__foot">{rodape}</div> : null}
      </div>
    </div>
  );
}
