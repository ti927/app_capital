'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { itensPara } from './casca';
import type { NivelAcesso } from '@/lib/dominio';

const cx = (...v: unknown[]) => v.filter((x): x is string => typeof x === 'string' && x !== '').join(' ');

/**
 * Cargo mostrado embaixo do nome. `indicante` não aparece de propósito: é a
 * conta de quem vem de fora, e carimbar "indicante" na tela dele o tempo todo
 * não acrescenta nada.
 */
const CARGO: Partial<Record<NivelAcesso, string>> = { master: 'Master' };

/** "Maicon Farina" vira "MF"; um nome só vira a primeira letra. */
function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  const primeira = partes[0][0];
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (primeira + ultima).toUpperCase();
}

/**
 * Navegação lateral de 220px, do topo ao rodapé da janela.
 *
 * No alto, quem está usando: bolinha com as iniciais, nome ao lado e o cargo
 * embaixo. A bolinha vira a foto do Google quando o OAuth entrar — o `<span>`
 * das iniciais é o lugar dela.
 *
 * A ordem dos itens é fixa e vem de produção: Funil de Clientes · Cliente ·
 * Fornecedor · Operação · Esteira. Para o indicante somem Fornecedor, Operação
 * e Esteira e sobram dois itens, alinhados ao topo — é assim no original.
 *
 * O rótulo "Esteira de Estruturação" quebra em duas linhas: por isso o item tem
 * altura mínima, não altura fixa. Não encolher a fonte para forçar uma linha.
 */
export function NavLateral({ nivel, nome }: { nivel: NivelAcesso; nome: string }) {
  const caminho = usePathname();
  const itens = itensPara(nivel);
  const cargo = CARGO[nivel];

  return (
    <nav className="lc-sidenav" aria-label="Navegação principal">
      <div className="lc-perfil">
        <span className="lc-perfil__foto" aria-hidden="true">
          {iniciais(nome)}
        </span>
        <span className="lc-perfil__texto">
          <span className="lc-perfil__nome">{nome}</span>
          {cargo ? <span className="lc-perfil__cargo">{cargo}</span> : null}
        </span>
      </div>

      {itens.map(({ rotulo, href, Icone }) => {
        const ativo = caminho === href || caminho.startsWith(href + '/');
        return (
          <Link
            key={href}
            href={href}
            className={cx('lc-navitem', ativo && 'lc-navitem--active')}
            aria-current={ativo ? 'page' : undefined}
          >
            <span className="lc-navitem__icon">
              <Icone tamanho={18} />
            </span>
            <span className="lc-navitem__label">{rotulo}</span>
          </Link>
        );
      })}
    </nav>
  );
}
