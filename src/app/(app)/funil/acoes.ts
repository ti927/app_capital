'use server';

import { revalidatePath } from 'next/cache';
import { clienteServidor } from '@/lib/supabase/servidor';

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

export async function moverColuna(etapaId: string, ordem: number) {
  const supabase = await clienteServidor();
  await supabase.from('funil_etapa').update({ ordem }).eq('id', etapaId);
  revalidatePath('/funil');
}

export async function excluirColuna(id: string) {
  const supabase = await clienteServidor();
  // Os cartões da coluna ficam sem etapa, não somem.
  await supabase.from('funil_cartao').update({ etapa_id: null }).eq('etapa_id', id);
  await supabase.from('funil_etapa').delete().eq('id', id);
  revalidatePath('/funil');
}
