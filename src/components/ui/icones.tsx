/**
 * Ícones do produto — SVG de traço, 24×24, `currentColor`.
 *
 * Desenhados aqui em vez de trazer uma biblioteca: são poucos, o peso fica em
 * zero e o traço acompanha a tipografia da marca. Nenhum emoji: emoji muda de
 * forma conforme o sistema operacional e não aceita cor da interface.
 *
 * Todos são decorativos por padrão (`aria-hidden`). Quem precisa de nome
 * acessível põe `aria-label` no botão que os envolve.
 */
import type { SVGProps } from 'react';

export interface IconeProps extends Omit<SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /** Lado em px. Padrão 16, que é o tamanho dentro de linha de tabela. */
  tamanho?: number;
}

function Base({ tamanho = 16, children, ...resto }: IconeProps & { children: React.ReactNode }) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      style={{ flex: 'none', display: 'block' }}
      {...resto}
    >
      {children}
    </svg>
  );
}

/* --------------------------------------------------------------- navegação - */

/** Funil de Clientes — colunas de quadro. */
export const IconeFunil = (p: IconeProps) => (
  <Base {...p}>
    <rect x="3" y="4" width="5" height="16" rx="1" />
    <rect x="9.5" y="4" width="5" height="11" rx="1" />
    <rect x="16" y="4" width="5" height="7" rx="1" />
  </Base>
);

/** Cliente — pessoas. */
export const IconeCliente = (p: IconeProps) => (
  <Base {...p}>
    <path d="M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19" />
    <circle cx="10" cy="7.5" r="3.5" />
    <path d="M20 19v-1.5a3.5 3.5 0 0 0-2.6-3.4" />
    <path d="M15.5 4.2a3.5 3.5 0 0 1 0 6.6" />
  </Base>
);

/** Fornecedor — instituição financeira. */
export const IconeFornecedor = (p: IconeProps) => (
  <Base {...p}>
    <path d="M3 9.5 12 4l9 5.5" />
    <path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8" />
    <path d="M3 20h18" />
  </Base>
);

/** Operação — documento com linhas. */
export const IconeOperacao = (p: IconeProps) => (
  <Base {...p}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5" />
    <path d="M9 13h6M9 17h4" />
  </Base>
);

/** Esteira de Estruturação — checklist em etapas. */
export const IconeEsteira = (p: IconeProps) => (
  <Base {...p}>
    <path d="m3 7 2 2 3.5-3.5" />
    <path d="m3 15 2 2 3.5-3.5" />
    <path d="M12 7h9M12 15h9" />
  </Base>
);

/* ------------------------------------------------------------------ ações -- */

export const IconeArquivar = (p: IconeProps) => (
  <Base {...p}>
    <rect x="3" y="4" width="18" height="4" rx="1" />
    <path d="M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8" />
    <path d="M10 12h4" />
  </Base>
);

export const IconeDesarquivar = (p: IconeProps) => (
  <Base {...p}>
    <rect x="3" y="4" width="18" height="4" rx="1" />
    <path d="M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8" />
    <path d="M12 17v-5m0 0-2 2m2-2 2 2" />
  </Base>
);

export const IconeDeletar = (p: IconeProps) => (
  <Base {...p}>
    <path d="M4 7h16" />
    <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    <path d="M6 7v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7" />
    <path d="M10 11v6M14 11v6" />
  </Base>
);

export const IconeEditar = (p: IconeProps) => (
  <Base {...p}>
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" />
  </Base>
);

export const IconeSalvar = (p: IconeProps) => (
  <Base {...p}>
    <path d="m4 12.5 5 5L20 6.5" />
  </Base>
);

export const IconeFechar = (p: IconeProps) => (
  <Base {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Base>
);

export const IconeMais = (p: IconeProps) => (
  <Base {...p}>
    <path d="M12 5v14M5 12h14" />
  </Base>
);

export const IconeBuscar = (p: IconeProps) => (
  <Base {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4.5 4.5" />
  </Base>
);

/* ------------------------------------------------------------------ casca -- */

export const IconeSair = (p: IconeProps) => (
  <Base {...p}>
    <path d="M14 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8" />
    <path d="M17 15l4-3-4-3" />
    <path d="M21 12H10" />
  </Base>
);

export const IconeSenha = (p: IconeProps) => (
  <Base {...p}>
    <rect x="4" y="10.5" width="16" height="10" rx="2" />
    <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
  </Base>
);

export const IconeConfiguracoes = (p: IconeProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" />
  </Base>
);

export const IconeTemaClaro = (p: IconeProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </Base>
);

export const IconeTemaEscuro = (p: IconeProps) => (
  <Base {...p}>
    <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5" />
  </Base>
);

/* ------------------------------------------------------------- direcionais - */

export const IconeChevronEsquerda = (p: IconeProps) => (
  <Base {...p}>
    <path d="m14.5 5-7 7 7 7" />
  </Base>
);

export const IconeChevronDireita = (p: IconeProps) => (
  <Base {...p}>
    <path d="m9.5 5 7 7-7 7" />
  </Base>
);

export const IconeChevronBaixo = (p: IconeProps) => (
  <Base {...p}>
    <path d="m5 9 7 7 7-7" />
  </Base>
);

export const IconeChevronCima = (p: IconeProps) => (
  <Base {...p}>
    <path d="m5 15 7-7 7 7" />
  </Base>
);
