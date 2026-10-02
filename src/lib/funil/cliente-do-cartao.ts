import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Cartão do funil → cliente. Uma regra só para quem chama: a tela do funil
 * (`funil/acoes.ts`) e o MCP (`src/lib/mcp`). O `supabase` que entra é o da
 * pessoa — com a RLS, ela só cria e vincula o que pode.
 */

/**
 * De-para do cartão do funil para o cadastro de cliente — os seis campos que o
 * pedido lista, e só eles. O resto do cadastro fica para quem preencher.
 */
function clienteDoCartao(cartao: {
  empresa: string;
  contato: string | null;
  faturamento: string | null;
  segmento: string | null;
  parecer: string | null;
  indicante: string | null;
}) {
  return {
    nome_razao: cartao.empresa,
    diretor_gerente: cartao.contato,
    faturamento_anual: cartao.faturamento,
    atividade_cia: cartao.segmento,
    parecer: cartao.parecer,
    quem_indicou: cartao.indicante,
  };
}

export type ResultadoClienteDoCartao =
  | { ok: true; clienteId: string }
  | { duplicado: { id: string; nome: string } }
  | { erro: string };

/**
 * Cria o cliente a partir do cartão e guarda o vínculo em
 * `funil_cartao.cliente_id`.
 *
 * Sem cliente duplicado: se já existe um com o mesmo nome/razão (ignorando
 * caixa), **não cria** — devolve o que achou para quem chamou avisar. Com
 * `forcar`, a pessoa já viu o aviso e decidiu criar assim mesmo.
 */
export async function criarClienteDoCartaoCom(
  supabase: SupabaseClient,
  perfilId: string,
  cartaoId: string,
  forcar = false,
): Promise<ResultadoClienteDoCartao> {
  const { data: cartao } = await supabase
    .from('funil_cartao')
    .select('id, empresa, contato, faturamento, segmento, parecer, indicante, cliente_id')
    .eq('id', cartaoId)
    .single();

  if (!cartao) return { erro: 'Não achei o cartão.' };
  if (cartao.cliente_id) return { ok: true, clienteId: cartao.cliente_id as string };

  const nome = (cartao.empresa ?? '').trim();
  if (!nome) return { erro: 'O cartão precisa ter empresa para virar cliente.' };

  if (!forcar) {
    // `ilike` sem curinga é igualdade ignorando caixa — é o que "mesmo nome" quer dizer.
    const { data: iguais } = await supabase
      .from('cliente')
      .select('id, nome_razao')
      .ilike('nome_razao', nome)
      .limit(1);

    const achado = iguais?.[0];
    if (achado) return { duplicado: { id: achado.id as string, nome: achado.nome_razao as string } };
  }

  const { data: novo, error } = await supabase
    .from('cliente')
    .insert(clienteDoCartao(cartao as Parameters<typeof clienteDoCartao>[0]))
    .select('id')
    .single();
  if (error || !novo) return { erro: 'Não consegui cadastrar o cliente.' };

  // Quem cria enxerga — a mesma regra de `clientes/acoes.ts`.
  await supabase.from('cliente_visualizador').insert({ cliente_id: novo.id, perfil_id: perfilId });
  await supabase.from('funil_cartao').update({ cliente_id: novo.id }).eq('id', cartaoId);

  return { ok: true, clienteId: novo.id as string };
}
