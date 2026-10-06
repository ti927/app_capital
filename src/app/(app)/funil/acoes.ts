'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { clienteServidor } from '@/lib/supabase/servidor';
import { perfilAtual } from '@/lib/perfil';
import { apagarEventoDaTarefa, sincronizarEventoDaTarefa } from '@/lib/google/agenda';
import { criarClienteDoCartaoCom } from '@/lib/funil/cliente-do-cartao';

/** O endereço do app nesta requisição — vai no link de volta do evento. */
async function origem() {
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const protocolo = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  return `${protocolo}://${host}`;
}

const COLUNAS_DO_EVENTO = 'google_evento_id, google_agenda_de, convidar_contato';

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

/**
 * Soltar o cartão numa posição exata: vai para a coluna `etapaId` e a coluna
 * inteira é renumerada na ordem que a tela mostrou na prévia pontilhada
 * (`ids`, já com o cartão no lugar). Com a RLS, só mexe no que a pessoa pode.
 */
export async function reposicionarCartao(cartaoId: string, etapaId: string, ids: string[]) {
  if (!ids.includes(cartaoId)) return;
  const supabase = await clienteServidor();
  await supabase.from('funil_cartao').update({ etapa_id: etapaId }).eq('id', cartaoId);
  await Promise.all(ids.map((id, ordem) => supabase.from('funil_cartao').update({ ordem }).eq('id', id)));
  revalidatePath('/funil');
}

export async function arquivarCartao(id: string, arquivado: boolean) {
  const supabase = await clienteServidor();
  await supabase.from('funil_cartao').update({ arquivado }).eq('id', id);
  revalidatePath('/funil');
}

export async function excluirCartao(id: string) {
  const supabase = await clienteServidor();
  // As tarefas caem em cascata com o cartão; os eventos delas, não — tira da
  // agenda antes, senão sobra reunião marcada de cartão que não existe mais.
  const { data: comEvento } = await supabase
    .from('funil_tarefa')
    .select(COLUNAS_DO_EVENTO)
    .eq('cartao_id', id)
    .not('google_evento_id', 'is', null);
  await Promise.all((comEvento ?? []).map((t) => apagarEventoDaTarefa(t)));

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
    // O interruptor só manda valor quando ligado (checkbox de formulário).
    convidar_contato: dados.get('convidar_contato') === 'on',
    email_convidado: texto(dados, 'email_convidado'),
  };
}

/**
 * Criar e gravar devolvem `aviso` quando a tarefa salvou mas a agenda do
 * Google não acompanhou — a agenda nunca impede salvar (specs/11).
 */
type RespostaDaTarefa = { erro?: string; ok?: boolean; aviso?: string } | null;

export async function criarTarefa(_anterior: unknown, dados: FormData): Promise<RespostaDaTarefa> {
  const supabase = await clienteServidor();

  const cartaoId = texto(dados, 'cartao_id');
  const quadroId = texto(dados, 'quadro_id');
  if (!cartaoId) return { erro: 'Escolha o cartão a que a tarefa pertence.' };
  if (!quadroId) return { erro: 'Não consegui identificar o quadro.' };

  const { data, error } = await supabase
    .from('funil_tarefa')
    .insert({ ...camposDaTarefa(dados), cartao_id: cartaoId, quadro_id: quadroId })
    .select('id')
    .single();
  if (error || !data) return { erro: 'Não consegui criar a tarefa.' };

  const { aviso } = await sincronizarEventoDaTarefa(data.id as string, await origem());

  revalidatePath('/funil');
  return { ok: true, aviso };
}

export async function gravarTarefa(_anterior: unknown, dados: FormData): Promise<RespostaDaTarefa> {
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

  const { aviso } = await sincronizarEventoDaTarefa(id, await origem());

  revalidatePath('/funil');
  return { ok: true, aviso };
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
  const { data } = await supabase.from('funil_tarefa').select(COLUNAS_DO_EVENTO).eq('id', id).maybeSingle();
  if (data) await apagarEventoDaTarefa(data);
  await supabase.from('funil_tarefa').delete().eq('id', id);
  revalidatePath('/funil');
}

/* -------------------------------------------------------- cartão → cliente */

/**
 * Cria o cliente a partir do cartão e guarda o vínculo. A regra (de-para dos
 * campos, sem duplicado por nome) mora em `src/lib/funil/cliente-do-cartao.ts`,
 * que o MCP também usa.
 */
export async function criarClienteDoCartao(cartaoId: string, forcar = false) {
  const perfil = await perfilAtual();
  const supabase = await clienteServidor();
  const resultado = await criarClienteDoCartaoCom(supabase, perfil.id, cartaoId, forcar);
  if ('ok' in resultado) {
    revalidatePath('/funil');
    revalidatePath('/clientes');
  }
  return resultado;
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
