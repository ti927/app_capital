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
   * Tudo sai na frente e corre junto com a leitura do perfil — inclusive a
   * carteira. Antes a consulta de `cliente` esperava o perfil (para saber o
   * recorte) e esperava `cliente_visualizador` (para montar o `in`), e só
   * então ia ao banco: duas idas em série, ~95ms + ~80ms. Era a única tela
   * com uma segunda volta na fila. Ver `docs/otimizacao-de-carregamento.md`.
   *
   * Ativos e arquivados vêm na mesma consulta e se separam aqui pelo campo.
   */
  const pedidos = Promise.all([
    supabase.from('cliente').select(`${CAMPOS}, criado_por`).order('nome_razao'),
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
  pedidos.catch(() => {});

  const perfil = await perfilAtual();
  const ehMaster = perfil.nivel_acesso === 'master';

  const [carteira, emails, usuarios, vinculos, cartoes, cartaoUsuarios] = await pedidos;

  /**
   * Recorte do indicante: os clientes em que ele está em "quem visualiza"
   * **mais** os que ele mesmo cadastrou. São as duas metades da busca do
   * Bubble; a segunda passou a ser possível com `cliente.criado_por`
   * (migration 008). O indicante não vê arquivados.
   *
   * O recorte é feito aqui, no servidor, sobre a carteira que já veio — não
   * numa segunda consulta que esperaria o perfil. O que chega ao navegador é
   * o mesmo de antes: a lista recortada, nunca a carteira inteira. Quando
   * `db/003_rls.sql` for aplicado, a policy `cliente_le` passa a recortar no
   * banco — mas ela hoje só conhece `cliente_visualizador`, não `criado_por`:
   * sem ajuste, o indicante deixaria de ver o que ele mesmo cadastrou.
   */
  const listaVinculos = (vinculos.data ?? []) as Array<{ cliente_id: string; perfil_id: string }>;
  const meus = new Set(
    listaVinculos.filter((v) => v.perfil_id === perfil.id).map((v) => v.cliente_id),
  );

  type Linha = Cliente & { arquivado: boolean; criado_por: string | null };
  const ativos: Cliente[] = [];
  const arquivados: Cliente[] = [];
  for (const linha of (carteira.data ?? []) as unknown as Linha[]) {
    const { criado_por, ...cliente } = linha;
    if (!ehMaster && criado_por !== perfil.id && !meus.has(linha.id)) continue;
    if (!linha.arquivado) ativos.push(cliente);
    else if (ehMaster) arquivados.push(cliente);
  }

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
      clientes={ativos}
      arquivados={arquivados}
      emails={(emails.data ?? []) as unknown as Array<{ id: number; cliente_id: string; email: string }>}
      usuarios={(usuarios.data ?? []) as unknown as Array<{ id: string; nome: string }>}
      vinculos={listaVinculos}
      cartoesDoFunil={cartoesVisiveis as unknown as CartaoDoFunil[]}
    />
  );
}
