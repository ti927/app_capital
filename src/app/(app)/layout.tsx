import Link from 'next/link';
import { BarraApp, ITENS_NAV, niveisQueVeem, PerfilNaBarra } from '@/components/ui/casca';
import { NavLateral } from '@/components/ui/navlateral';
import { BotaoDeTema } from '@/components/ui/tema';
import { Transicao } from '@/components/ui/transicao';
import { AvisosProvider } from '@/components/ui/aviso';
import { BotaoConfiguracoes, type UsuarioDoAcesso } from '@/components/configuracoes';
import { IconeAgenda, IconeSair, IconeSenha } from '@/components/ui/icones';
import { clienteServidor } from '@/lib/supabase/servidor';
import { perfilAtual } from '@/lib/perfil';
import { podeSincronizar } from '@/lib/bubble/permissao';
import { BotaoSincronizarBubble } from '@/components/sincronizacao-bubble';
import { BotaoNotasDeVersao } from '@/components/notas-de-versao';
import { veNotasDeVersao } from '@/lib/notas-de-versao-acesso';
import { NOTAS_DE_VERSAO } from '@/lib/notas-de-versao';
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

  // Sino de notas de versão: só quem está em NOTAS_DE_VERSAO_EMAILS. A bolinha
  // vale enquanto a rodada mais recente não for a que a pessoa já viu.
  let notas: { haNovidade: boolean } | null = null;
  if (veNotasDeVersao(perfil.email, process.env.NOTAS_DE_VERSAO_EMAILS) && NOTAS_DE_VERSAO.length > 0) {
    const supabase = await clienteServidor();
    const { data } = await supabase.from('perfil').select('notas_vistas').eq('id', perfil.id).single();
    notas = { haNovidade: data?.notas_vistas !== NOTAS_DE_VERSAO[0].id };
  }

  return (
    <AvisosProvider>
    <div className="casca">
      <BarraApp
        perfil={<PerfilNaBarra nome={perfil.nome} nivel={perfil.nivel_acesso} />}
        acoes={
          <>
            <form action={sair}>
              <button type="submit" className="lc-btn lc-btn--tertiary lc-btn--sm casca__acao" title="Sair">
                <IconeSair tamanho={16} />
                <span className="casca__acao-rotulo">Sair</span>
              </button>
            </form>
            <Link className="lc-btn lc-btn--tertiary lc-btn--sm casca__acao" href="/conta/agenda" title="Google Agenda">
              <IconeAgenda tamanho={16} />
              <span className="casca__acao-rotulo">Agenda</span>
            </Link>
            <Link className="lc-btn lc-btn--tertiary lc-btn--sm casca__acao" href="/conta/senha" title="Trocar senha">
              <IconeSenha tamanho={16} />
              <span className="casca__acao-rotulo">Senha</span>
            </Link>
            {notas ? (
              <BotaoNotasDeVersao rodadas={NOTAS_DE_VERSAO.slice(0, 3)} haNovidade={notas.haNovidade} />
            ) : null}
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
            {/* Ferramenta de dev: só a conta de SINCRONIZACAO_EMAIL. A ação
                confere de novo no servidor (src/lib/bubble/acao.ts). */}
            {podeSincronizar(perfil, process.env.SINCRONIZACAO_EMAIL) ? <BotaoSincronizarBubble /> : null}
          </>
        }
      />
      <div className="casca__corpo">
        <NavLateral nivel={perfil.nivel_acesso} />
        <main className="casca__conteudo">
          <Transicao>{children}</Transicao>
        </main>
      </div>
    </div>
    </AvisosProvider>
  );
}
