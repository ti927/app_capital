import { BarraApp, ITENS_NAV, niveisQueVeem } from '@/components/ui/casca';
import { NavLateral } from '@/components/ui/navlateral';
import { BotaoDeTema } from '@/components/ui/tema';
import { Transicao } from '@/components/ui/transicao';
import { BotaoConfiguracoes, type UsuarioDoAcesso } from '@/components/configuracoes';
import { IconeSair, IconeSenha } from '@/components/ui/icones';
import { clienteServidor } from '@/lib/supabase/servidor';
import { perfilAtual } from '@/lib/perfil';
import { sair } from '../entrar/actions';

/**
 * Casca das telas internas: app bar no topo, navegação lateral de 220px à
 * esquerda indo até o rodapé, conteúdo à direita.
 * Arranjo de design/design-system/10-telas.md.
 */
export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const perfil = await perfilAtual();

  // "Acesso às páginas" é painel de master; para o indicante nem a consulta sai.
  let usuarios: UsuarioDoAcesso[] = [];
  if (perfil.nivel_acesso === 'master') {
    const supabase = await clienteServidor();
    const { data } = await supabase
      .from('perfil')
      .select('id, nome, nivel_acesso')
      .eq('ativo', true)
      .order('nome');
    usuarios = (data ?? []) as UsuarioDoAcesso[];
  }

  return (
    <div className="casca">
      <BarraApp
        acoes={
          <>
            <form action={sair}>
              <button type="submit" className="lc-btn lc-btn--tertiary lc-btn--sm casca__acao" title="Sair">
                <IconeSair tamanho={16} />
                <span className="casca__acao-rotulo">Sair</span>
              </button>
            </form>
            <a className="lc-btn lc-btn--tertiary lc-btn--sm casca__acao" href="/conta/senha" title="Trocar senha">
              <IconeSenha tamanho={16} />
              <span className="casca__acao-rotulo">Senha</span>
            </a>
            <BotaoDeTema />
            {/* Configurações só para master: abre em pop-up, não tem rota. */}
            {perfil.nivel_acesso === 'master' ? (
              <BotaoConfiguracoes
                paginas={ITENS_NAV.map((item) => ({
                  rotulo: item.rotulo,
                  niveis: niveisQueVeem(item),
                }))}
                usuarios={usuarios}
              />
            ) : null}
          </>
        }
      />
      <div className="casca__corpo">
        <NavLateral nivel={perfil.nivel_acesso} nome={perfil.nome} />
        <main className="casca__conteudo">
          <Transicao>{children}</Transicao>
        </main>
      </div>
    </div>
  );
}
