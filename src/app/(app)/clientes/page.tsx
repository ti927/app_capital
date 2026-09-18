import { clienteServidor } from '@/lib/supabase/servidor';
import { perfilAtual } from '@/lib/perfil';
import type { Cliente } from '@/lib/dominio';
import { TelaClientes, type CartaoDoFunil } from './tela';

export const metadata = { title: 'Cliente · Lure Capital' };

const CAMPOS =
  'id, nome_razao, cnpj, cidade, telefone, email, atividade_cia, diretor_gerente, ' +
  'faturamento_anual, estimativa_faturamento, margem_liquida, passivo_oneroso, ativos, ' +
  'demanda, info_adicionais, parecer, status, quem_indicou, arquivado';

export default async function PaginaClientes() {
  const perfil = await perfilAtual();
  const supabase = await clienteServidor();

  /**
   * Recorte do indicante: os clientes em que ele está em "quem visualiza"
   * **mais** os que ele mesmo cadastrou. São as duas metades da busca do
   * Bubble; a segunda passou a ser possível com `cliente.criado_por`
   * (migration 008).
   *
   * Feito aqui porque a RLS está desligada; quando `db/003_rls.sql` for
   * aplicado, o banco garante o mesmo e isto continua valendo.
   */
  const ehMaster = perfil.nivel_acesso === 'master';
  let visiveis: string[] | null = null;
  if (!ehMaster) {
    const { data } = await supabase
      .from('cliente_visualizador')
      .select('cliente_id')
      .eq('perfil_id', perfil.id);
    visiveis = (data ?? []).map((v) => v.cliente_id as string);
  }

  const base = () => {
    const q = supabase.from('cliente').select(CAMPOS).order('nome_razao');
    if (ehMaster) return q;
    const ids = (visiveis ?? []).join(',');
    return q.or(`criado_por.eq.${perfil.id}${ids ? `,id.in.(${ids})` : ''}`);
  };

  const [ativos, arquivados, emails, usuarios, vinculos, cartoes, meusCartoes] = await Promise.all([
    base().eq('arquivado', false),
    ehMaster ? base().eq('arquivado', true) : Promise.resolve({ data: [] }),
    supabase.from('cliente_email').select('id, cliente_id, email').order('email'),
    supabase.from('perfil').select('id, nome').eq('ativo', true).order('nome'),
    supabase.from('cliente_visualizador').select('cliente_id, perfil_id'),
    // "Puxar do funil": só os cartões que ainda não viraram cliente.
    supabase
      .from('funil_cartao')
      .select('id, empresa, contato, segmento, faturamento, indicante, parecer')
      .is('cliente_id', null)
      .eq('arquivado', false)
      .order('empresa'),
    // O indicante só enxerga os cartões em que está como usuário — o mesmo
    // recorte do funil. Sem isto, a lista de "puxar do funil" mostrava a
    // carteira inteira para quem não pode vê-la.
    ehMaster
      ? Promise.resolve({ data: null })
      : supabase.from('funil_cartao_usuario').select('cartao_id').eq('perfil_id', perfil.id),
  ]);

  const cartoesDele = (meusCartoes.data ?? null) as Array<{ cartao_id: string }> | null;
  const cartoesVisiveis = cartoesDele
    ? ((cartoes.data ?? []) as Array<{ id: string }>).filter((c) =>
        cartoesDele.some((m) => m.cartao_id === c.id),
      )
    : (cartoes.data ?? []);

  return (
    <TelaClientes
      nivel={perfil.nivel_acesso}
      clientes={(ativos.data ?? []) as unknown as Cliente[]}
      arquivados={(arquivados.data ?? []) as unknown as Cliente[]}
      emails={(emails.data ?? []) as unknown as Array<{ id: number; cliente_id: string; email: string }>}
      usuarios={(usuarios.data ?? []) as unknown as Array<{ id: string; nome: string }>}
      vinculos={(vinculos.data ?? []) as unknown as Array<{ cliente_id: string; perfil_id: string }>}
      cartoesDoFunil={cartoesVisiveis as unknown as CartaoDoFunil[]}
    />
  );
}
