import Link from 'next/link';
import { BarraApp, ITENS_NAV, niveisQueVeem, PerfilNaBarra } from '@/components/ui/casca';
import { NavLateral } from '@/components/ui/navlateral';
import { BotaoDeTema } from '@/components/ui/tema';
import { Transicao } from '@/components/ui/transicao';
import { AvisosProvider } from '@/components/ui/aviso';
import { BotaoConfiguracoes, type UsuarioDoAcesso } from '@/components/configuracoes';
import { PreferenciasProvider } from '@/components/preferencias';
import { IconeAgenda, IconeSair, IconeSenha } from '@/components/ui/icones';
import { clienteServidor } from '@/lib/supabase/servidor';
import { perfilAtual } from '@/lib/perfil';
import { paginasLiberadas } from '@/lib/acesso-pagina';
import { podeSincronizar } from '@/lib/bubble/permissao';
import { podeExecutarComo } from '@/lib/executar-como/regras';
import { seloAtual } from '@/lib/executar-como/servidor';
import { ExecutarComo, FaixaExecutandoComo } from '@/components/executar-como';
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

  // "Executar como" (specs/15): o seletor só para a conta de EXECUTAR_COMO_EMAIL;
  // a faixa de volta para quem está numa sessão trocada (selo válido).
  const seletorExecutarComo = podeExecutarComo(perfil, process.env.EXECUTAR_COMO_EMAIL)
    ? usuarios.filter((u) => u.id !== perfil.id).map((u) => ({ id: u.id, nome: u.nome, nivel: u.nivel_acesso }))
    : null;
  const executandoComo = await seloAtual(perfil.id);

  // Páginas de master abertas para este indicante (specs/16); master não consulta.
  const liberadas = await paginasLiberadas(perfil.id, perfil.nivel_acesso);

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
    {/* A preferência de pop-ups vem do perfil já lido acima: nenhuma tela
        consulta de novo. Só master escolhe (decisão de 14/10/2026): o
        indicante fica sempre no clássico, mesmo com outro valor no banco. */}
    <PreferenciasProvider popups={perfil.nivel_acesso === 'master' ? perfil.ui_popups : 'classica'}>
    <div className="casca">
      <BarraApp
        perfil={
          <>
            <PerfilNaBarra nome={perfil.nome} nivel={perfil.nivel_acesso} />
            {seletorExecutarComo ? <ExecutarComo pessoas={seletorExecutarComo} /> : null}
            {executandoComo ? <FaixaExecutandoComo nome={perfil.nome} /> : null}
          </>
        }
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
            {/* Configurações só para master (Preferências e Acesso às páginas):
                abre em pop-up, não tem rota. */}
            {perfil.nivel_acesso === 'master' ? (
              <BotaoConfiguracoes
                paginas={ITENS_NAV.map((item) => ({
                  rotulo: item.rotulo,
                  niveis: niveisQueVeem(item),
                }))}
                usuarios={usuarios}
                master
              />
            ) : null}
            {/* Ferramenta de dev: só a conta de SINCRONIZACAO_EMAIL. A ação
                confere de novo no servidor (src/lib/bubble/acao.ts). */}
            {podeSincronizar(perfil, process.env.SINCRONIZACAO_EMAIL) ? <BotaoSincronizarBubble /> : null}
          </>
        }
      />
      <div className="casca__corpo">
        <NavLateral nivel={perfil.nivel_acesso} liberadas={liberadas} />
        <main className="casca__conteudo">
          <Transicao>{children}</Transicao>
        </main>
      </div>
    </div>
    </PreferenciasProvider>
    </AvisosProvider>
  );
}
