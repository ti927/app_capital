/**
 * Lure Capital — tipos do bundle. Documentação, não checagem.
 * Global: window.LureCapital. React 18 e ReactDOM 18 precisam existir antes.
 */
import type * as React from "react";

/** Tom de aplicação sobre fundo claro, escuro, ou uma tinta só. */
export type Tone = "ink" | "white" | "mono";

export interface SymbolProps {
  /** Lado em px. Mínimo 16 — abaixo disso as folgas entre blocos fecham. Padrão 34. */
  size?: number;
  /** ink = braços neutral-900 · white = braços neutral-0 · mono = tudo na mesma tinta. Padrão "ink". */
  tone?: Tone;
  /** Quando presente vira <title> e o SVG deixa de ser aria-hidden. */
  title?: string;
}
/** O "+" de 5 blocos com o miolo em accent. Braços nunca coloridos. */
export declare function Symbol(props: SymbolProps): React.ReactElement;

export interface LogoProps extends SymbolProps {
  /** Corpo de "LURE" em px. Padrão 22 (18 na app bar). */
  nameSize?: number;
  /** Texto do chip. `null` ou "" remove o chip — é assim que o Sistema Lure assina. Padrão "CRM". */
  chip?: string | null;
  /** false esconde "LURE" e o chip, deixando só o símbolo. */
  wordmark?: boolean;
  /** Presente, renderiza como <a>. */
  href?: string;
  /** aria-label. Padrão "Lure <chip>". */
  label?: string;
  className?: string;
}
/** Assinatura: símbolo SVG + "LURE" em texto vivo + chip do produto. */
export declare function Logo(props: LogoProps): React.ReactElement;

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "danger" | "dangerOutline";
/** sm 28px · md 34px · lg 40px · row 24px quadrado, para ação dentro de linha de tabela. */
export type ControlSize = "sm" | "md" | "lg" | "row";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ControlSize;
}
export declare function Button(props: ButtonProps): React.ReactElement;

export interface StatusChipProps {
  /**
   * Nome do token de cor SEM o "--" e SEM o sufixo "-ink": o chip usa
   * var(--<token>) no ponto e var(--<token>-ink) no texto. Ex.: "st-etapa-em-curso",
   * "status-ganho", "stage-3". Padrão "status-parado".
   */
  token?: string;
  /** O rótulo. Obrigatório na prática: cor nunca é o único sinal. */
  label?: React.ReactNode;
  children?: React.ReactNode;
  /** 22px em vez de 20px — fora de tabela. */
  loose?: boolean;
  className?: string;
}
export declare function StatusChip(props: StatusChipProps): React.ReactElement;

export interface FieldProps {
  label?: React.ReactNode;
  placeholder?: string;
  value?: string;
  type?: string;
  /** Vira <textarea>. */
  multiline?: boolean;
  rows?: number;
  /** Campo calculado: readOnly, fundo surface-sunken, rótulo em text-muted com sufixo "(calc.)". */
  calc?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  /** Mensagem de erro: borda danger, texto danger-ink, aria-invalid. */
  error?: React.ReactNode;
  /** "lg" = 40px, para login e telas públicas. Padrão 34px. */
  size?: "md" | "lg";
  id?: string;
  className?: string;
}
export declare function Field(props: FieldProps): React.ReactElement;

export interface Column {
  /** Chave da propriedade em cada linha. */
  key: string;
  label: string;
  /** Alinha à direita, em IBM Plex Mono com tabular-nums e nowrap. */
  num?: boolean;
  /** Largura CSS — table-layout é fixed, então declare todas. */
  width?: string;
  /** true impede o negrito da primeira coluna. */
  plain?: boolean;
}
export interface DataTableProps {
  columns: Column[];
  /** Objetos com as chaves das colunas. Valor ausente vira `blank`. */
  rows: Array<Record<string, React.ReactNode>>;
  /** Linha de tfoot, mesmas chaves. */
  footer?: Record<string, React.ReactNode>;
  /** O que mostrar em célula vazia. Padrão "-", o padrão do original. */
  blank?: React.ReactNode;
  /** Linha de 44px em vez de 32px — quando há avatar ou duas linhas de texto. */
  cozy?: boolean;
  className?: string;
}
/** Tabela densa: 32px por linha, thead 36px em surface-sunken, table-layout fixed. */
export declare function DataTable(props: DataTableProps): React.ReactElement;

export interface DialogProps {
  title: React.ReactNode;
  /** Linha de contexto acima do título, em mono 11px caixa alta. */
  context?: React.ReactNode;
  /** sm 620px (formulário simples) · md 880px (2 colunas) · lg 1120px (abas). Padrão "sm". */
  width?: "sm" | "md" | "lg";
  /** Ações do rodapé de 56px, alinhadas à direita. */
  footer?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}
/** O consumidor controla a abertura, o foco preso e o fechamento por Esc. */
export declare function Dialog(props: DialogProps): React.ReactElement;

export interface EmptyStateProps {
  title?: React.ReactNode;
  /** Quantos itens o filtro esconde. Vazio silencioso lê-se como "não existe". */
  hiddenCount?: number;
  onClear?: () => void;
  clearLabel?: string;
  symbolSize?: number;
  className?: string;
}
export declare function EmptyState(props: EmptyStateProps): React.ReactElement;

export interface LoadingSkeletonProps {
  /** Quantidade de blocos de 12px. Padrão 4. */
  rows?: number;
  /** Larguras cicladas, para o esqueleto não virar um bloco sólido. */
  widths?: string[];
  className?: string;
}
export declare function LoadingSkeleton(props: LoadingSkeletonProps): React.ReactElement;

export interface NoticeCardProps {
  /** "danger" = falha de carregamento · "neutral" = sem permissão. Padrão "danger". */
  tone?: "danger" | "neutral";
  title: React.ReactNode;
  body?: React.ReactNode;
  children?: React.ReactNode;
  actionLabel?: React.ReactNode;
  onAction?: () => void;
  className?: string;
}
export declare function NoticeCard(props: NoticeCardProps): React.ReactElement;

export interface NavItem { label: string; href?: string; active?: boolean }
export interface AppBarProps {
  /** Strings ou objetos. Todo rótulo leva white-space: nowrap. */
  nav?: Array<string | NavItem>;
  /** Rótulo ativo, quando `nav` é de strings. */
  active?: string;
  chip?: string | null;
  href?: string;
  search?: boolean;
  searchPlaceholder?: string;
  /** Rótulo do botão primário à direita. */
  action?: React.ReactNode;
  initials?: string;
  userName?: string;
  className?: string;
}
/** App bar de 56px: assinatura, nav, busca de 160px, ação e avatar. */
export declare function AppBar(props: AppBarProps): React.ReactElement;

export interface FooterProps {
  links?: Array<string | { label: string }>;
  tagline?: string;
  copyright?: string;
  chip?: string | null;
  className?: string;
}
export declare function Footer(props: FooterProps): React.ReactElement;
