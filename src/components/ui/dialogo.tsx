'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

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
  /**
   * Substitui contexto + título no cabeçalho (pop-ups modernos, UI 2). O
   * botão de fechar continua aqui; `titulo` em texto vira só o nome acessível.
   */
  cabecalho?: ReactNode;
}

/**
 * Número da abertura atual: cresce a cada vez que `aberto` vira verdadeiro.
 * Serve de `key` para quem deixa o diálogo montado entre aberturas — o estado
 * de `useActionState` (`{ ok: true }` do salvamento anterior) não pode
 * sobreviver à próxima abertura: o efeito que fecha ao salvar fechava o
 * diálogo no mesmo instante em que abria (bug do "não abre o pop-up").
 */
export function useSessaoDoDialogo(aberto: boolean) {
  const [sessao, setSessao] = useState(0);
  const [antes, setAntes] = useState(aberto);
  if (aberto !== antes) {
    setAntes(aberto);
    if (aberto) setSessao((n) => n + 1);
  }
  return sessao;
}

/** Tem que bater com `--mov-saida-dialogo` de `animacoes.css`. */
const MS_SAIDA = 110;

/**
 * Para pop-up montado só enquanto está aberto (`cond ? <X aberto /> : null`):
 * o fechamento pelos botões dele próprio (Cancelar, Fechar, depois de salvar)
 * passa por `fechar`, que baixa `aberto` — o `Dialogo` roda a saída — e só
 * depois avisa quem desmonta. Sem isto o pop-up sumia no talho.
 *
 * Uso: `<Dialogo aberto={saida.aberto} aoFechar={aoFechar}>` e
 * `onClick={saida.fechar}` nos botões. ✕, Esc e clique fora já animam sozinhos.
 *
 * `chave`: para o componente que fica montado e troca de assunto (ex.: o
 * cartão do "virar cliente") — chave nova reabre.
 */
export function useSaidaDoDialogo(aoFechar: () => void, chave?: unknown) {
  const [aberto, setAberto] = useState(true);
  const [chaveAntes, setChaveAntes] = useState(chave);
  if (chave !== chaveAntes) {
    setChaveAntes(chave);
    setAberto(true);
  }
  const relogio = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fechar = useCallback(() => {
    if (relogio.current) return;
    setAberto(false);
    relogio.current = setTimeout(() => {
      relogio.current = null;
      aoFechar();
    }, MS_SAIDA);
  }, [aoFechar]);
  useEffect(
    () => () => {
      if (relogio.current) clearTimeout(relogio.current);
    },
    [],
  );
  return { aberto, fechar };
}

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
  cabecalho,
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

  /**
   * Fechar por ✕, Esc ou clique fora: a saída roda AQUI e só no fim avisa o
   * consumidor. Vários pop-ups são montados com `cond ? <Dialogo aberto> :
   * null` — para eles `aoFechar` desmonta na hora e o caminho de cima nunca
   * roda. Pedindo a saída antes, todos animam, sem mexer em cada tela.
   *
   * Depois do aviso o diálogo já está desmontado; se o consumidor recusar o
   * fechamento (`aberto` continua verdadeiro), o efeito acima o monta de novo.
   */
  const relogioSaida = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pedirFechar = useCallback(() => {
    if (relogioSaida.current) return;
    setSaindo(true);
    relogioSaida.current = setTimeout(() => {
      relogioSaida.current = null;
      setMontado(false);
      setSaindo(false);
      aoFechar();
    }, MS_SAIDA);
  }, [aoFechar]);
  useEffect(
    () => () => {
      if (relogioSaida.current) clearTimeout(relogioSaida.current);
    },
    [],
  );

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
        pedirFechar();
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
  }, [aberto, pedirFechar]);

  if (!montado) return null;

  return (
    <div
      className={cx('lc-overlay', saindo && 'lc-overlay--saindo')}
      onMouseDown={(e) => e.target === e.currentTarget && pedirFechar()}
    >
      <div
        ref={caixa}
        className={cx('lc-dialog', `lc-dialog--${largura}`, className)}
        role="dialog"
        aria-modal="true"
        aria-label={typeof titulo === 'string' ? titulo : undefined}
      >
        <div className="lc-dialog__head">
          {cabecalho ?? (
            <div>
              {contexto ? <p className="lc-dialog__ctx">{contexto}</p> : null}
              {titulo ? <p className="lc-dialog__title">{titulo}</p> : null}
            </div>
          )}
          <button type="button" className="lc-btn lc-btn--tertiary lc-btn--row" onClick={pedirFechar} aria-label="Fechar">
            ✕
          </button>
        </div>

        <div className="lc-dialog__body">{children}</div>

        {rodape ? <div className="lc-dialog__foot">{rodape}</div> : null}
      </div>
    </div>
  );
}
