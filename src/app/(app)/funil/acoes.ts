'use server';

import { revalidatePath } from 'next/cache';
import { clienteServidor } from '@/lib/supabase/servidor';
import { perfilAtual } from '@/lib/perfil';

const texto = (dados: FormData, chave: string) => {
  const v = String(dados.get(chave) ?? '').trim();
  return v === '' ? null : v;
};

/** Gravação automática do cartão: o diálogo não tem botão de salvar. */
export async function gravarCartao(_anterior: unknown, dados: FormData) {
  const supabase = await clienteServidor();
  const id = String(dados.get('id') ?? '');

  const campos = {
    empresa: texto(dados, 'empresa') ?? '',
    contato: texto(dados, 'contato'),
    segmento: texto(dados, 'segmento'),
    faturamento: texto(dados, 'faturamento'),
    indicante: texto(dados, 'indicante'),
    parecer: texto(dados, 'parecer'),
    historico: texto(dados, 'historico'),
    etapa_id: texto(dados, 'etapa_id'),
    data_call: texto(dados, 'data_call'),
    data_kb: texto(dados, 'data_kb'),
  };

  let alvo = id;
  if (id) {
    const { error } = await supabase.from('funil_cartao').update(campos).eq('id', id);
    if (error) return { erro: 'Não consegui salvar.' };
  } else {
    const quadroId = String(dados.get('quadro_id') ?? '');
    const { data, error } = await supabase
      .from('funil_cartao')
      .insert({ ...campos, quadro_id: quadroId })
      .select('id')
      .single();
    if (error || !data) return { erro: 'Não consegui criar o cartão.' };
    alvo = data.id as string;
  }

  const tags = dados.getAll('tags').map(String).filter(Boolean);
  await supabase.from('funil_cartao_tag').delete().eq('cartao_id', alvo);
  if (tags.length) {
    await supabase.from('funil_cartao_tag').insert(tags.map((tag_id) => ({ cartao_id: alvo, tag_id })));
  }

  revalidatePath('/funil');
  return { ok: true, id: alvo };
}

const CAMPOS_CARTAO =
  'id, quadro_id, etapa_id, empresa, contato, segmento, faturamento, indicante, parecer, ' +
  'historico, ordem, data_kb, data_call, arquivado, atualizado_em, cliente_id';

/**
 * "Novo cartão" grava na hora, antes de a pessoa digitar qualquer coisa.
 *
 * O motivo é de uso, não de código: quem abre um cartão está em reunião com o
 * cliente. Se o cartão só nascesse ao salvar, fechar o diálogo sem querer —
 * ou um Esc no meio da conversa — levava junto o que já tinha sido digitado.
 * Agora o cartão existe desde o clique, a gravação é automática, e cartão que
 * não serviu se exclui pelo próprio diálogo.
 */
export async function criarCartaoVazio(quadroId: string, etapaId: string | null) {
  const supabase = await clienteServidor();

  const { data, error } = await supabase
    .from('funil_cartao')
    .insert({ quadro_id: quadroId, etapa_id: etapaId, empresa: '' })
    .select(CAMPOS_CARTAO)
    .single();

  if (error || !data) return null;

  revalidatePath('/funil');
  return data;
}

/** Mover cartão entre colunas e reordenar. */
export async function moverCartao(cartaoId: string, etapaId: string | null, ordem: number) {
  const supabase = await clienteServidor();
  await supabase.from('funil_cartao').update({ etapa_id: etapaId, ordem }).eq('id', cartaoId);
  revalidatePath('/funil');
}

export async function arquivarCartao(id: string, arquivado: boolean) {
  const supabase = await clienteServidor();
  await supabase.from('funil_cartao').update({ arquivado }).eq('id', id);
  revalidatePath('/funil');
}

export async function excluirCartao(id: string) {
  const supabase = await clienteServidor();
  await supabase.from('funil_cartao').delete().eq('id', id);
  revalidatePath('/funil');
}

/* ------------------------------------------------------------------ colunas */

export async function criarColuna(quadroId: string, nome: string) {
  const limpo = nome.trim();
  if (!limpo) return;
  const supabase = await clienteServidor();

  const { data } = await supabase
    .from('funil_etapa')
    .select('ordem')
    .eq('quadro_id', quadroId)
    .order('ordem', { ascending: false })
    .limit(1);

  // A coluna entra no fim do fluxo.
  const ordem = (data?.[0]?.ordem ?? 0) + 1;
  await supabase.from('funil_etapa').insert({ quadro_id: quadroId, nome: limpo, ordem });
  revalidatePath('/funil');
}

/**
 * Troca a coluna de lugar com a vizinha.
 *
 * Antes a tela mandava `ordem ± 1.5`, para a coluna se encaixar entre as duas
 * — e `funil_etapa.ordem` é `smallint`: o banco arredondava, a coluna caía em
 * cima da vizinha e o botão parecia não fazer nada. Agora as duas trocam de
 * ordem, que é o que o funil original faz.
 */
export async function trocarOrdemColunas(
  etapaId: string,
  ordemDela: number,
  vizinhaId: string,
  ordemDaVizinha: number,
) {
  const supabase = await clienteServidor();

  // Ordem repetida não quebra nada (o desempate é o id), mas deixa o quadro
  // instável: quando as duas batem, o par é reordenado.
  const [a, b] = ordemDela === ordemDaVizinha ? [ordemDela, ordemDela + 1] : [ordemDaVizinha, ordemDela];

  await Promise.all([
    supabase.from('funil_etapa').update({ ordem: a }).eq('id', etapaId),
    supabase.from('funil_etapa').update({ ordem: b }).eq('id', vizinhaId),
  ]);
  revalidatePath('/funil');
}

/**
 * Exclui a coluna e os cartões dela, como no funil original.
 *
 * Antes os cartões só perdiam a etapa (`etapa_id = null`) — e cartão sem etapa
 * não aparece em coluna nenhuma: sumiam do quadro sem aviso e sem jeito de
 * voltar pela tela. Sumir calado é pior que apagar avisando, então agora a
 * tela pergunta com a contagem na frente e aqui a exclusão é de verdade.
 */
export async function excluirColuna(id: string) {
  const supabase = await clienteServidor();
  await supabase.from('funil_cartao').delete().eq('etapa_id', id);
  await supabase.from('funil_etapa').delete().eq('id', id);
  revalidatePath('/funil');
}

/* ---------------------------------------------------------------- tarefas */

/**
 * Toda tarefa pertence a um cartão (decisão de 18/09/2026, `cartao_id not
 * null` desde a migration 006). A tela já não deixa salvar sem cartão; aqui
 * a regra é conferida de novo, porque a action é uma porta de entrada.
 */
function camposDaTarefa(dados: FormData) {
  return {
    titulo: texto(dados, 'titulo') ?? 'Sem título',
    descricao: texto(dados, 'descricao'),
    tipo: texto(dados, 'tipo'),
    prazo: texto(dados, 'prazo'),
    hora: texto(dados, 'hora'),
    responsavel_id: texto(dados, 'responsavel_id'),
  };
}

export async function criarTarefa(_anterior: unknown, dados: FormData) {
  const supabase = await clienteServidor();

  const cartaoId = texto(dados, 'cartao_id');
  const quadroId = texto(dados, 'quadro_id');
  if (!cartaoId) return { erro: 'Escolha o cartão a que a tarefa pertence.' };
  if (!quadroId) return { erro: 'Não consegui identificar o quadro.' };

  const { error } = await supabase
    .from('funil_tarefa')
    .insert({ ...camposDaTarefa(dados), cartao_id: cartaoId, quadro_id: quadroId });
  if (error) return { erro: 'Não consegui criar a tarefa.' };

  revalidatePath('/funil');
  return { ok: true };
}

export async function gravarTarefa(_anterior: unknown, dados: FormData) {
  const supabase = await clienteServidor();

  const id = texto(dados, 'id');
  if (!id) return { erro: 'Tarefa sem identificador.' };

  const campos = camposDaTarefa(dados);
  const cartaoId = texto(dados, 'cartao_id');
  // O cartão só muda quando o formulário manda um — o diálogo de dentro do
  // cartão não oferece trocar, e mandar `null` aqui quebraria o not null.
  const { error } = await supabase
    .from('funil_tarefa')
    .update(cartaoId ? { ...campos, cartao_id: cartaoId } : campos)
    .eq('id', id);
  if (error) return { erro: 'Não consegui salvar a tarefa.' };

  revalidatePath('/funil');
  return { ok: true };
}

/** Concluir e reabrir. `data_conclusao` anda junto com `concluida`. */
export async function alternarTarefa(id: string, concluida: boolean) {
  const supabase = await clienteServidor();
  await supabase
    .from('funil_tarefa')
    .update({ concluida, data_conclusao: concluida ? new Date().toISOString() : null })
    .eq('id', id);
  revalidatePath('/funil');
}

export async function excluirTarefa(id: string) {
  const supabase = await clienteServidor();
  await supabase.from('funil_tarefa').delete().eq('id', id);
  revalidatePath('/funil');
}

/* -------------------------------------------------------- cartão → cliente */

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

/**
 * Cria o cliente a partir do cartão e guarda o vínculo em
 * `funil_cartao.cliente_id`.
 *
 * Sem cliente duplicado: se já existe um com o mesmo nome/razão (ignorando
 * caixa), a ação **não cria** — devolve o que achou para a tela avisar. Com
 * `forcar`, o usuário já viu o aviso e decidiu criar assim mesmo.
 */
export async function criarClienteDoCartao(cartaoId: string, forcar = false) {
  const perfil = await perfilAtual();
  const supabase = await clienteServidor();

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
    if (achado) {
      return { duplicado: { id: achado.id as string, nome: achado.nome_razao as string } };
    }
  }

  const { data: novo, error } = await supabase
    .from('cliente')
    .insert(clienteDoCartao(cartao as Parameters<typeof clienteDoCartao>[0]))
    .select('id')
    .single();
  if (error || !novo) return { erro: 'Não consegui cadastrar o cliente.' };

  // Quem cria enxerga — a mesma regra de `clientes/acoes.ts`.
  await supabase.from('cliente_visualizador').insert({ cliente_id: novo.id, perfil_id: perfil.id });
  await supabase.from('funil_cartao').update({ cliente_id: novo.id }).eq('id', cartaoId);

  revalidatePath('/funil');
  revalidatePath('/clientes');
  return { ok: true, clienteId: novo.id as string };
}

/** Liga o cartão a um cliente que já existe, sem criar nada. */
export async function vincularCartaoACliente(cartaoId: string, clienteId: string) {
  const supabase = await clienteServidor();
  await supabase.from('funil_cartao').update({ cliente_id: clienteId }).eq('id', cartaoId);
  revalidatePath('/funil');
  revalidatePath('/clientes');
  return { ok: true, clienteId };
}

/* --------------------------------------------------------------- tags ---- */

/**
 * As tags do quadro. Eram cinco, fixas, vindas da carga do Bubble, e o botão
 * "Tags" do topo não fazia nada — não havia como criar, renomear nem trocar a
 * cor sem ir ao banco.
 */
export async function criarTag(quadroId: string, nome: string, cor: string) {
  const limpo = nome.trim();
  if (!limpo) return;
  const supabase = await clienteServidor();
  await supabase.from('funil_tag').insert({ quadro_id: quadroId, nome: limpo, cor });
  revalidatePath('/funil');
}

export async function gravarTag(id: string, nome: string, cor: string) {
  const limpo = nome.trim();
  if (!limpo) return;
  const supabase = await clienteServidor();
  await supabase.from('funil_tag').update({ nome: limpo, cor }).eq('id', id);
  revalidatePath('/funil');
}

/**
 * Desligar a tag a esconde dos filtros e do cartão **sem perder histórico**:
 * as ligações com os cartões continuam no banco. Excluir, não — excluir tira a
 * tag de todos os cartões.
 */
export async function alternarTagAtiva(id: string, ativo: boolean) {
  const supabase = await clienteServidor();
  await supabase.from('funil_tag').update({ ativo }).eq('id', id);
  revalidatePath('/funil');
}

export async function excluirTag(id: string) {
  const supabase = await clienteServidor();
  // A ligação com os cartões cai junto, por `on delete cascade`.
  await supabase.from('funil_tag').delete().eq('id', id);
  revalidatePath('/funil');
}

/* ------------------------------------------------------ colunas no fluxo -- */

/**
 * Tira a coluna do quadro sem apagar nada: `no_fluxo = false` esconde a coluna
 * e os cartões continuam lá, com a etapa preservada. É o que o botão "Colunas
 * no fluxo" do topo sempre prometeu e não fazia.
 */
export async function alternarColunaNoFluxo(etapaId: string, noFluxo: boolean) {
  const supabase = await clienteServidor();
  await supabase.from('funil_etapa').update({ no_fluxo: noFluxo }).eq('id', etapaId);
  revalidatePath('/funil');
}

export async function renomearColuna(etapaId: string, nome: string) {
  const limpo = nome.trim();
  if (!limpo) return;
  const supabase = await clienteServidor();
  await supabase.from('funil_etapa').update({ nome: limpo }).eq('id', etapaId);
  revalidatePath('/funil');
}
