import Link from 'next/link';
import type { ReactNode } from 'react';
import { Logo } from './marca';
import type { NivelAcesso } from '@/lib/dominio';

/* ---------------------------------------------------------------------------
   Navegação lateral.

   A ordem é fixa e vem de produção (design/design-system/10-telas.md):
   Funil de Clientes · Cliente · Fornecedor · Operação · Esteira.
   Para o indicante somem Fornecedor, Operação e Esteira.
   --------------------------------------------------------------------------- */

export interface ItemNav {
  rotulo: string;
  href: string;
  icone: string;
  /** Quando ausente, o item vale para os dois níveis. */
  somenteMaster?: boolean;
}

export const ITENS_NAV: ItemNav[] = [
  { rotulo: 'Funil de Clientes', href: '/funil', icone: '▦' },
  { rotulo: 'Cliente', href: '/clientes', icone: '◧' },
  { rotulo: 'Fornecedor', href: '/fornecedores', icone: '◫', somenteMaster: true },
  { rotulo: 'Operação', href: '/operacoes', icone: '◨', somenteMaster: true },
  { rotulo: 'Esteira de Estruturação', href: '/esteira', icone: '◪', somenteMaster: true },
];

export function itensPara(nivel: NivelAcesso): ItemNav[] {
  return nivel === 'master' ? ITENS_NAV : ITENS_NAV.filter((i) => !i.somenteMaster);
}

/* ---------------------------------------------------------------------------
   Barra superior.

   Assinatura centrada na janela. À direita, nesta ordem: sair · trocar senha ·
   Configurações — este último só para master.
   --------------------------------------------------------------------------- */

export function BarraApp({ nivel, acoes }: { nivel: NivelAcesso; acoes?: ReactNode }) {
  return (
    <header className="lc-appbar">
      <div className="lc-appbar__brand">
        <Logo href="/clientes" chip="CAPITAL" tamanho={28} tamanhoNome={18} />
      </div>
      <div className="lc-appbar__right">
        {acoes}
        {nivel === 'master' ? (
          <Link className="lc-btn lc-btn--secondary lc-btn--sm" href="/configuracoes">
            <span aria-hidden="true">⚙</span> Configurações
          </Link>
        ) : null}
      </div>
    </header>
  );
}

/* ------------------------------------------------------------ cabeçalho ---- */

export function TopoDaTela({
  titulo,
  children,
}: {
  titulo?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="tela__topo">
      {titulo ? <h1 className="tela__titulo t-page-title">{titulo}</h1> : null}
      {children ? <div className="tela__acoes">{children}</div> : null}
    </div>
  );
}
