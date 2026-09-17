'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { itensPara } from './casca';
import type { NivelAcesso } from '@/lib/dominio';

const cx = (...v: unknown[]) => v.filter((x): x is string => typeof x === 'string' && x !== '').join(' ');

/**
 * Navegação lateral de 220px.
 *
 * A ordem é fixa e vem de produção (design/design-system/10-telas.md):
 * Funil de Clientes · Cliente · Fornecedor · Operação · Esteira.
 * Para o indicante somem Fornecedor, Operação e Esteira e sobram dois itens,
 * alinhados ao topo — é assim no original.
 *
 * O rótulo "Esteira de Estruturação" quebra em duas linhas: por isso o item tem
 * altura mínima, não altura fixa. Não encolher a fonte para forçar uma linha.
 */
export function NavLateral({ nivel }: { nivel: NivelAcesso }) {
  const caminho = usePathname();
  const itens = itensPara(nivel);

  return (
    <nav className="lc-sidenav" aria-label="Navegação principal">
      {itens.map((item) => {
        const ativo = caminho === item.href || caminho.startsWith(item.href + '/');
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cx('lc-navitem', ativo && 'lc-navitem--active')}
            aria-current={ativo ? 'page' : undefined}
          >
            <span className="lc-navitem__icon" aria-hidden="true">
              {item.icone}
            </span>
            <span className="lc-navitem__label">{item.rotulo}</span>
          </Link>
        );
      })}
    </nav>
  );
}
