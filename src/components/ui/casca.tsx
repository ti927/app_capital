import type { ReactNode } from 'react';
import { Logo } from './marca';
import {
  IconeCliente,
  IconeEsteira,
  IconeFornecedor,
  IconeFunil,
  IconeOperacao,
} from './icones';
import type { NivelAcesso } from '@/lib/dominio';

/* ---------------------------------------------------------------------------
   Itens da navegação lateral.

   A ordem é fixa e vem de produção (design/design-system/10-telas.md):
   Funil de Clientes · Cliente · Fornecedor · Operação · Esteira.
   Para o indicante somem Fornecedor, Operação e Esteira.
   --------------------------------------------------------------------------- */

export interface ItemNav {
  rotulo: string;
  href: string;
  Icone: (p: { tamanho?: number }) => ReactNode;
  /** Quando ausente, o item vale para os dois níveis. */
  somenteMaster?: boolean;
}

export const ITENS_NAV: ItemNav[] = [
  { rotulo: 'Funil de Clientes', href: '/funil', Icone: IconeFunil },
  { rotulo: 'Cliente', href: '/clientes', Icone: IconeCliente },
  { rotulo: 'Fornecedor', href: '/fornecedores', Icone: IconeFornecedor, somenteMaster: true },
  { rotulo: 'Operação', href: '/operacoes', Icone: IconeOperacao, somenteMaster: true },
  { rotulo: 'Esteira de Estruturação', href: '/esteira', Icone: IconeEsteira, somenteMaster: true },
];

export function itensPara(nivel: NivelAcesso): ItemNav[] {
  return nivel === 'master' ? ITENS_NAV : ITENS_NAV.filter((i) => !i.somenteMaster);
}

/**
 * Quem enxerga uma página. Hoje a resposta vem só do nível da conta — é assim
 * no original: a matriz `tbl.config` existe no Bubble e o menu não a consulta
 * (documentacao-completa.md, 3.8). A tabela `acesso_pagina` está no banco,
 * vazia, esperando a decisão de virar ou não a fonte da verdade.
 */
export function niveisQueVeem(item: ItemNav): NivelAcesso[] {
  return item.somenteMaster ? ['master'] : ['master', 'indicante'];
}

/* ---------------------------------------------------------------------------
   Barra superior: assinatura à esquerda; à direita o que o layout passar —
   sair · trocar senha · tema · Configurações (só master).
   --------------------------------------------------------------------------- */

export function BarraApp({ acoes }: { acoes?: ReactNode }) {
  return (
    <header className="lc-appbar">
      <div className="lc-appbar__brand">
        <Logo href="/clientes" chip="CAPITAL" tamanho={26} tamanhoNome={17} />
      </div>
      <div className="lc-appbar__right">{acoes}</div>
    </header>
  );
}

/* ------------------------------------------------------------ cabeçalho ---- */

export function TopoDaTela({ titulo, children }: { titulo?: ReactNode; children?: ReactNode }) {
  return (
    <div className="tela__topo">
      {titulo ? <h1 className="tela__titulo t-page-title">{titulo}</h1> : null}
      {children ? <div className="tela__acoes">{children}</div> : null}
    </div>
  );
}
