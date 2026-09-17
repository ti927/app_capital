import { BarraApp } from '@/components/ui/casca';
import { NavLateral } from '@/components/ui/navlateral';
import { perfilAtual } from '@/lib/perfil';
import { sair } from '../entrar/actions';

/**
 * Casca das telas internas: app bar no topo, navegação lateral de 220px à
 * esquerda, conteúdo à direita. Arranjo de design/design-system/10-telas.md.
 */
export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const perfil = await perfilAtual();

  return (
    <div className="casca">
      <BarraApp
        nivel={perfil.nivel_acesso}
        acoes={
          <>
            <form action={sair}>
              <button type="submit" className="lc-btn lc-btn--tertiary lc-btn--sm" title="Sair">
                <span aria-hidden="true">⇥</span> Sair
              </button>
            </form>
            <a className="lc-btn lc-btn--tertiary lc-btn--sm" href="/conta/senha" title="Trocar senha">
              <span aria-hidden="true">🔒</span> Senha
            </a>
          </>
        }
      />
      <div className="casca__corpo">
        <NavLateral nivel={perfil.nivel_acesso} />
        <main className="casca__conteudo">{children}</main>
      </div>
    </div>
  );
}
