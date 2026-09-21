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
  const supabase = await clienteServidor();

  /**
   * O que não depende do perfil sai na frente e corre junto com a leitura
   * dele — ver a nota em `fornecedores/page.tsx`. Só as consultas de `cliente`
   * precisam saber quem está olhando, e essas ficam para depois.
   */
  const apoio = Promise.all([
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
    supabase.from('funil_cartao_usuario').select('cartao_id, perfil_id'),
  ]);
  apoio.catch(() => {});

  const perfil = await perfilAtual();
  const ehMaster = perfil.nivel_acesso === 'master';

  const [emails, usuarios, vinculos, cartoes, cartaoUsuarios] = await apoio;

  /**
   * Recorte do indicante: os clientes em que ele está em "quem visualiza"
   * **mais** os que ele mesmo cadastrou. São as duas metades da busca do
   * Bubble; a segunda passou a ser possível com `cliente.criado_por`
   * (migration 008).
   *
   * Os ids saem de `vinculos`, que já veio acima, em vez de uma consulta
   * própria a `cliente_visualizador` filtrada por `perfil_id` — era mais uma
   * ida ao banco em série, e a resposta é a mesma. Continua valendo com a RLS
   * ligada: a policy `cliente_visualizador_le` (db/003_rls.sql) já entrega ao
   * indicante só as linhas dele, então o filtro daqui vira redundância, não
   * divergência.
   *
   * O recorte segue na consulta, não na tela: quando `db/003_rls.sql` for
   * aplicado, o banco garante o mesmo e isto continua valendo.
   */
  const listaVinculos = (vinculos.data ?? []) as Array<{ cliente_id: string; perfil_id: string }>;
  const visiveis = ehMaster
    ? null
    : listaVinculos.filter((v) => v.perfil_id === perfil.id).map((v) => v.cliente_id);

  const base = () => {
    const q = supabase.from('cliente').select(CAMPOS).order('nome_razao');
    if (ehMaster) return q;
    const ids = (visiveis ?? []).join(',');
    return q.or(`criado_por.eq.${perfil.id}${ids ? `,id.in.(${ids})` : ''}`);
  };

  const [ativos, arquivados] = await Promise.all([
    base().eq('arquivado', false),
    ehMaster ? base().eq('arquivado', true) : Promise.resolve({ data: [] }),
  ]);

  /**
   * O indicante só enxerga os cartões em que está como usuário — o mesmo
   * recorte do funil. Sem isto, a lista de "puxar do funil" mostrava a
   * carteira inteira para quem não pode vê-la.
   */
  const meusCartoes = new Set(
    ((cartaoUsuarios.data ?? []) as Array<{ cartao_id: string; perfil_id: string }>)
      .filter((v) => v.perfil_id === perfil.id)
      .map((v) => v.cartao_id),
  );
  const cartoesVisiveis = ehMaster
    ? (cartoes.data ?? [])
    : ((cartoes.data ?? []) as Array<{ id: string }>).filter((c) => meusCartoes.has(c.id));

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
