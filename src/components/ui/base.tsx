import type * as React from 'react';
import { Simbolo } from './marca';

const cx = (...v: unknown[]) => v.filter((x): x is string => typeof x === 'string' && x !== '').join(' ');

/* ----------------------------------------------------------------- Botão --- */

export type VarianteBotao = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'dangerOutline';
/** sm 28px · md 34px · lg 40px · row 24px quadrado, para ação dentro de linha. */
export type TamanhoControle = 'sm' | 'md' | 'lg' | 'row';

export interface BotaoProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteBotao;
  tamanho?: TamanhoControle;
}

export function Botao({
  variante = 'secondary',
  tamanho = 'md',
  className,
  type = 'button',
  ...resto
}: BotaoProps) {
  return (
    <button
      type={type}
      className={cx('lc-btn', `lc-btn--${variante}`, `lc-btn--${tamanho}`, className)}
      {...resto}
    />
  );
}

/* ------------------------------------------------------------ ChipStatus --- */

export interface ChipStatusProps {
  /**
   * Nome do token de cor sem `--` e sem o sufixo `-ink`: o chip usa
   * `var(--<token>)` no ponto e `var(--<token>-ink)` no texto.
   */
  token?: string;
  rotulo?: React.ReactNode;
  /** 22px em vez de 20px — fora de tabela. */
  solto?: boolean;
  className?: string;
}

/** Cor nunca é o único sinal: o rótulo é obrigatório na prática. */
export function ChipStatus({ token = 'st-etapa-inicio', rotulo, solto, className }: ChipStatusProps) {
  return (
    <span
      className={cx('lc-chip', solto && 'lc-chip--loose', className)}
      style={{ color: `var(--${token}-ink)` }}
    >
      <span className="lc-chip__dot" style={{ background: `var(--${token})` }} />
      {rotulo}
    </span>
  );
}

/* ------------------------------------------------------------------ Campo -- */

export interface CampoProps {
  rotulo?: React.ReactNode;
  placeholder?: string;
  nome?: string;
  valorInicial?: string;
  valor?: string;
  aoMudar?: (valor: string) => void;
  tipo?: string;
  /** Vira `<textarea>`. */
  multilinha?: boolean;
  linhas?: number;
  /** Campo calculado: somente leitura, fundo rebaixado, rótulo com "(calc.)". */
  calculado?: boolean;
  somenteLeitura?: boolean;
  desabilitado?: boolean;
  erro?: React.ReactNode;
  /** `lg` = 40px, para login e telas públicas. */
  tamanho?: 'md' | 'lg';
  id?: string;
  className?: string;
}

export function Campo({
  rotulo,
  placeholder,
  nome,
  valorInicial,
  valor,
  aoMudar,
  tipo = 'text',
  multilinha,
  linhas = 4,
  calculado,
  somenteLeitura,
  desabilitado,
  erro,
  tamanho = 'md',
  id,
  className,
}: CampoProps) {
  const idCampo = id ?? nome;
  const classeEntrada = cx(
    'lc-field__input',
    calculado && 'lc-field__input--calc',
    erro && 'lc-field__input--error',
    tamanho === 'lg' && 'lc-field__input--lg',
  );

  const comuns = {
    id: idCampo,
    name: nome,
    placeholder,
    readOnly: somenteLeitura || calculado,
    disabled: desabilitado,
    className: classeEntrada,
    'aria-invalid': erro ? (true as const) : undefined,
    ...(valor !== undefined
      ? { value: valor, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => aoMudar?.(e.target.value) }
      : { defaultValue: valorInicial }),
  };

  return (
    <div className={cx('lc-field', className)}>
      {rotulo ? (
        <label className={cx('lc-field__label', calculado && 'lc-field__label--muted')} htmlFor={idCampo}>
          {rotulo}
          {calculado ? ' (calc.)' : null}
        </label>
      ) : null}
      {multilinha ? <textarea rows={linhas} {...comuns} /> : <input type={tipo} {...comuns} />}
      {erro ? <span className="lc-field__msg">{erro}</span> : null}
    </div>
  );
}

/* ------------------------------------------------------------ EmptyState --- */

export interface VazioProps {
  titulo?: React.ReactNode;
  /** Quantos itens o filtro esconde. Vazio silencioso lê-se como "não existe". */
  escondidos?: number;
  aoLimpar?: () => void;
  rotuloLimpar?: string;
  className?: string;
}

export function Vazio({
  titulo = 'Nada por aqui',
  escondidos,
  aoLimpar,
  rotuloLimpar = 'Limpar filtros',
  className,
}: VazioProps) {
  return (
    <div className={cx('lc-empty', className)}>
      <Simbolo tamanho={40} tom="mono" />
      <p className="lc-empty__title">{titulo}</p>
      {escondidos ? (
        <p className="lc-empty__hint">
          {escondidos} {escondidos === 1 ? 'está escondido' : 'estão escondidos'} pelo filtro
        </p>
      ) : null}
      {aoLimpar ? (
        <Botao variante="tertiary" tamanho="sm" onClick={aoLimpar}>
          {rotuloLimpar}
        </Botao>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------- LoadingSkeleton --- */

export interface EsqueletoProps {
  linhas?: number;
  larguras?: string[];
  className?: string;
}

export function Esqueleto({
  linhas = 4,
  larguras = ['100%', '72%', '88%', '60%'],
  className,
}: EsqueletoProps) {
  return (
    <div className={cx('pilha', className)} aria-busy="true" aria-live="polite">
      {Array.from({ length: linhas }, (_, i) => (
        <span key={i} className="lc-skel" style={{ width: larguras[i % larguras.length] }} />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------ NoticeCard --- */

export interface AvisoProps {
  /** `danger` = falha de carregamento · `neutral` = sem permissão. */
  tom?: 'danger' | 'neutral';
  titulo: React.ReactNode;
  corpo?: React.ReactNode;
  rotuloAcao?: React.ReactNode;
  aoAgir?: () => void;
  className?: string;
}

export function Aviso({ tom = 'danger', titulo, corpo, rotuloAcao, aoAgir, className }: AvisoProps) {
  return (
    <div className={cx('lc-notice', `lc-notice--${tom}`, className)} role={tom === 'danger' ? 'alert' : undefined}>
      <p className="lc-notice__title">{titulo}</p>
      {corpo ? <div className="lc-notice__body">{corpo}</div> : null}
      {rotuloAcao && aoAgir ? (
        <Botao variante="tertiary" tamanho="sm" onClick={aoAgir}>
          {rotuloAcao}
        </Botao>
      ) : null}
    </div>
  );
}
