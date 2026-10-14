'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { ChipStatus } from '@/components/ui/base';
import { IconeSalvar } from '@/components/ui/icones';

/**
 * Peças da "ficha" — os pop-ups modernos (UI 2, design/ui2-popups.md).
 *
 * É só outra casca sobre o mesmo `<form>`: os campos continuam sendo `Campo`
 * e os seletores de sempre, com os mesmos `name=`, e o salvar continua sendo
 * `useSalvarOtimista`. Nada aqui grava nada.
 */

const cx = (...v: unknown[]) => v.filter((x): x is string => typeof x === 'string' && x !== '').join(' ');

/* --------------------------------------------------- estado do formulário -- */

function fotografia(forma: HTMLFormElement): string {
  const pares: Array<[string, string]> = [];
  new FormData(forma).forEach((valor, chave) => {
    pares.push([chave, typeof valor === 'string' ? valor : `${valor.name}:${valor.size}`]);
  });
  return JSON.stringify(pares);
}

/**
 * Lê a `<form>` a cada interação: se mudou desde a abertura (o "Alterações
 * não salvas" do rodapé) e os valores que a faixa-chave espelha ao vivo.
 *
 * Escuta o documento, e não a `<form>`: o interruptor do rodapé fica fora dela
 * (`form=`), e os seletores trocam um `<input type="hidden">` sem disparar
 * evento — o clique na opção é que avisa.
 */
export function useFicha<T>(formId: string, ler: (dados: FormData) => T, inicial: T) {
  const [sujo, setSujo] = useState(false);
  const [valores, setValores] = useState<T>(inicial);
  const base = useRef<{ el: HTMLFormElement; foto: string } | null>(null);
  const lerAtual = useRef(ler);
  lerAtual.current = ler;

  const conferir = useCallback(() => {
    const el = document.getElementById(formId);
    if (!(el instanceof HTMLFormElement)) return;
    const foto = fotografia(el);
    // Forma nova (ex.: "Puxar do funil" remonta a do cliente): vira a base.
    if (!base.current || base.current.el !== el) base.current = { el, foto };
    setSujo(foto !== base.current.foto);
    setValores(lerAtual.current(new FormData(el)));
  }, [formId]);

  useEffect(() => {
    // Depois dos efeitos de montagem assentarem, como em salvar-otimista.ts.
    const primeiro = setTimeout(conferir, 0);
    let relogio: ReturnType<typeof setTimeout> | null = null;
    const agendar = () => {
      if (relogio) clearTimeout(relogio);
      relogio = setTimeout(conferir, 0);
    };
    const eventos = ['input', 'change', 'click', 'keyup'] as const;
    eventos.forEach((e) => document.addEventListener(e, agendar, true));
    return () => {
      clearTimeout(primeiro);
      if (relogio) clearTimeout(relogio);
      eventos.forEach((e) => document.removeEventListener(e, agendar, true));
    };
  }, [conferir]);

  return { sujo, valores };
}

/**
 * Ctrl+Enter (⌘+Enter no Mac) salva — o mesmo `requestSubmit` do botão, então
 * passa pela validação e pelo salvar otimista. Também põe o foco no primeiro
 * campo editável ao abrir (fora do celular, onde abriria o teclado por cima).
 */
export function useAtalhosDaFicha(formId: string, aberto: boolean) {
  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e: globalThis.KeyboardEvent) => {
      if (e.key !== 'Enter' || !(e.ctrlKey || e.metaKey)) return;
      const el = document.getElementById(formId);
      if (!(el instanceof HTMLFormElement)) return;
      e.preventDefault();
      el.requestSubmit();
    };
    document.addEventListener('keydown', aoTeclar);

    // O `Dialogo` foca o primeiro focável (o fechar) no efeito dele, que roda
    // depois deste: o foco no campo vai para a próxima volta.
    const relogio = setTimeout(() => {
      if (window.matchMedia('(max-width: 760px)').matches) return;
      const el = document.getElementById(formId);
      const campo = el?.querySelector<HTMLElement>(
        'input:not([type="hidden"]):not([readonly]):not([disabled]), textarea:not([readonly]), button.gatilho:not([disabled])',
      );
      campo?.focus({ preventScroll: true });
    }, 30);

    return () => {
      document.removeEventListener('keydown', aoTeclar);
      clearTimeout(relogio);
    };
  }, [formId, aberto]);
}

/* -------------------------------------------------------------- cabeçalho -- */

export interface ItemDaFaixa {
  rotulo: string;
  valor: string | null | undefined;
}

export function CabecaDaFicha({
  icone,
  titulo,
  tituloId,
  contexto,
  status,
  faixa,
  contadores,
}: {
  icone: ReactNode;
  /** Texto, ou o input do nome do fundo (fornecedor). */
  titulo: ReactNode;
  tituloId: string;
  contexto?: ReactNode;
  status?: { rotulo: string; token?: string } | null;
  faixa: ItemDaFaixa[];
  contadores?: string[];
}) {
  return (
    <div className="ui2-cabeca">
      <div className="ui2-cabeca__topo">
        <span className="ui2-cabeca__ladrilho" aria-hidden="true">
          {icone}
        </span>
        <div className="ui2-cabeca__nome">
          <div id={tituloId} className="ui2-cabeca__titulo">
            {titulo}
          </div>
          {contexto ? <p className="ui2-cabeca__contexto">{contexto}</p> : null}
        </div>
        {status?.rotulo ? (
          <ChipStatus solto className="ui2-cabeca__status" token={status.token} rotulo={status.rotulo} />
        ) : null}
      </div>

      <dl className="ui2-faixa">
        {faixa.map((item) => (
          <div key={item.rotulo} className="ui2-faixa__item">
            <dt className="ui2-faixa__rotulo">{item.rotulo}</dt>
            <dd className={cx('ui2-faixa__valor', !item.valor?.trim() && 'ui2-faixa__valor--vazio')}>
              {item.valor?.trim() || '—'}
            </dd>
          </div>
        ))}
        {contadores?.length ? (
          <div className="ui2-faixa__contadores">
            {contadores.map((c) => (
              <span key={c} className="ui2-faixa__contador">
                {c}
              </span>
            ))}
          </div>
        ) : null}
      </dl>
    </div>
  );
}

/* ----------------------------------------------------------------- seções -- */

export interface DefinicaoSecao {
  id: string;
  titulo: string;
}

export function Secao({
  id,
  icone,
  titulo,
  ordem,
  children,
  depoisDaGrade,
}: {
  id: string;
  icone: ReactNode;
  titulo: string;
  /** Posição na cascata de entrada (0, 1, 2…). */
  ordem: number;
  children?: ReactNode;
  /** Conteúdo fora da grade (ex.: a tabela de etapas). */
  depoisDaGrade?: ReactNode;
}) {
  return (
    <section
      id={id}
      className="ui2-secao"
      aria-labelledby={`${id}-titulo`}
      style={{ '--ui2-ordem': Math.min(ordem, 5) } as CSSProperties}
    >
      <div className="ui2-secao__cabeca">
        <span className="ui2-secao__ladrilho" aria-hidden="true">
          {icone}
        </span>
        <h3 id={`${id}-titulo`} className="ui2-secao__titulo">
          {titulo}
        </h3>
      </div>
      {children ? <div className="ui2-grade">{children}</div> : null}
      {depoisDaGrade}
    </section>
  );
}

/** Rótulo com ícone pequeno — o texto continua sendo o da UI clássica. */
export function Rotulo({ icone, children }: { icone?: ReactNode; children: ReactNode }) {
  return (
    <>
      {icone ? (
        <span className="ui2-campo__icone" aria-hidden="true">
          {icone}
        </span>
      ) : null}
      {children}
    </>
  );
}

/* ------------------------------------------------------------------ índice -- */

/**
 * Índice de seções (Operação): pílulas fixas no topo do corpo; a seção visível
 * fica marcada. No celular vira um seletor "Ir para…".
 */
export function IndiceDaFicha({ secoes }: { secoes: DefinicaoSecao[] }) {
  const [ativa, setAtiva] = useState(secoes[0]?.id ?? '');
  const nav = useRef<HTMLElement>(null);

  useEffect(() => {
    const corpo = nav.current?.closest('.lc-dialog__body');
    if (!corpo) return;
    const alvos = secoes
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null);

    // A seção ativa é a última cujo topo já passou da linha do índice.
    const aoRolar = () => {
      const linha = corpo.getBoundingClientRect().top + (nav.current?.offsetHeight ?? 0) + 24;
      let atual = alvos[0]?.id ?? '';
      for (const el of alvos) if (el.getBoundingClientRect().top <= linha) atual = el.id;
      if (corpo.scrollTop + corpo.clientHeight >= corpo.scrollHeight - 2) atual = alvos[alvos.length - 1]?.id ?? atual;
      setAtiva(atual);
    };
    corpo.addEventListener('scroll', aoRolar, { passive: true });
    return () => corpo.removeEventListener('scroll', aoRolar);
  }, [secoes]);

  const ir = (id: string) => {
    const el = document.getElementById(id);
    const corpo = nav.current?.closest('.lc-dialog__body');
    if (!el || !corpo) return;
    const suave = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const topo =
      el.getBoundingClientRect().top - corpo.getBoundingClientRect().top + corpo.scrollTop - (nav.current?.offsetHeight ?? 0) - 8;
    corpo.scrollTo({ top: topo, behavior: suave ? 'smooth' : 'auto' });
    setAtiva(id);
  };

  return (
    <nav ref={nav} className="ui2-indice" aria-label="Seções">
      <div className="ui2-indice__pilulas">
        {secoes.map((s) => (
          <button
            key={s.id}
            type="button"
            className={cx('ui2-indice__item', ativa === s.id && 'ui2-indice__item--ativo')}
            aria-current={ativa === s.id ? 'true' : undefined}
            onClick={() => ir(s.id)}
          >
            {s.titulo}
          </button>
        ))}
      </div>
      <label className="ui2-indice__compacto">
        <span className="ui2-indice__compacto-rotulo">Ir para…</span>
        <select value={ativa} onChange={(e) => ir(e.target.value)} className="lc-field__input">
          {secoes.map((s) => (
            <option key={s.id} value={s.id}>
              {s.titulo}
            </option>
          ))}
        </select>
      </label>
    </nav>
  );
}

/* ----------------------------------------------------------------- rodapé -- */

export function EstadoDoRodape({ sujo }: { sujo: boolean }) {
  return (
    <span className={cx('ui2-rodape__estado', sujo && 'ui2-rodape__estado--sujo')} aria-live="polite">
      <span className="ui2-rodape__ponto" aria-hidden="true" />
      {sujo ? 'Alterações não salvas' : 'Sem alterações'}
    </span>
  );
}

/** Dica do atalho, para o `title` do botão de salvar. */
export const DICA_SALVAR = 'Ctrl+Enter (⌘+Enter no Mac) também salva';

/* ------------------------------------------------- pílula-interruptor ---- */

/** Checkbox real com cara de ficha: marcado = verde com check. */
export function PilulaInterruptor({
  nome,
  rotulo,
  inicial,
  form,
  className,
}: {
  nome: string;
  rotulo: string;
  inicial?: boolean;
  form?: string;
  className?: string;
}) {
  return (
    <label className={cx('ui2-interruptor', className)}>
      <input type="checkbox" className="ui2-interruptor__caixa" name={nome} defaultChecked={inicial} form={form} />
      <span className="ui2-interruptor__check" aria-hidden="true">
        <IconeSalvar tamanho={13} />
      </span>
      <span>{rotulo}</span>
    </label>
  );
}

/* ---------------------------------------------------- status segmentado -- */

/**
 * As mesmas opções do seletor clássico, em pílulas. Grava no mesmo `name`
 * por um `<input type="hidden">`; clicar de novo na escolhida limpa, como no
 * seletor. É um `radiogroup` com setas.
 */
export function Segmentado({
  rotulo,
  nome,
  opcoes,
  valorInicial,
  className,
}: {
  rotulo: string;
  nome: string;
  opcoes: string[];
  valorInicial: string;
  className?: string;
}) {
  const [valor, setValor] = useState(valorInicial);
  const grupo = useRef<HTMLDivElement>(null);
  const idRotulo = `${nome}-segmentado`;

  const aoTeclar = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
    e.preventDefault();
    const passo = e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 1;
    const i = Math.max(0, opcoes.indexOf(valor));
    const novo = opcoes[(i + passo + opcoes.length) % opcoes.length];
    setValor(novo);
    grupo.current?.querySelectorAll<HTMLButtonElement>('button')[opcoes.indexOf(novo)]?.focus();
  };

  return (
    <div className={cx('lc-field', className)}>
      <span id={idRotulo} className="lc-field__label">
        {rotulo}
      </span>
      <input type="hidden" name={nome} value={valor} />
      <div ref={grupo} className="ui2-segmentado" role="radiogroup" aria-labelledby={idRotulo} onKeyDown={aoTeclar}>
        {opcoes.map((o, i) => {
          const marcado = valor === o;
          return (
            <button
              key={o}
              type="button"
              role="radio"
              aria-checked={marcado}
              tabIndex={marcado || (!opcoes.includes(valor) && i === 0) ? 0 : -1}
              className={cx('ui2-segmentado__opcao', marcado && 'ui2-segmentado__opcao--marcada')}
              onClick={() => setValor(marcado ? '' : o)}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ pulso -- */

/**
 * Pulso amarelo de 600ms num campo preenchido sozinho. Devolve a classe e a
 * função que dispara; disparar de novo reinicia a animação.
 */
export function usePulso() {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!n) return;
    const r = setTimeout(() => setN(0), 650);
    return () => clearTimeout(r);
  }, [n]);
  return {
    classe: n ? (n % 2 ? 'ui2-campo--pulso' : 'ui2-campo--pulso-b') : '',
    pulsar: useCallback(() => setN((v) => v + 1), []),
  };
}
