'use server';

import { revalidatePath } from 'next/cache';
import { clienteServidor } from '@/lib/supabase/servidor';
import { perfilAtual } from '@/lib/perfil';

const texto = (dados: FormData, chave: string) => {
  const v = String(dados.get(chave) ?? '').trim();
  return v === '' ? null : v;
};
const marcado = (dados: FormData, chave: string) => dados.get(chave) === 'on';
const numero = (dados: FormData, chave: string) => {
  const v = String(dados.get(chave) ?? '');
  return v === '' ? null : Number(v);
};

export async function gravarOperacao(_anterior: unknown, dados: FormData) {
  const supabase = await clienteServidor();
  const id = String(dados.get('id') ?? '');

  const campos = {
    identificador: texto(dados, 'identificador'),
    cliente_id: texto(dados, 'cliente_id'),
    status_operacao_id: numero(dados, 'status_operacao_id'),
    garantias_sugeridas: texto(dados, 'garantias_sugeridas'),
    limites_fundos_assinados: texto(dados, 'limites_fundos_assinados'),
    pmts: texto(dados, 'pmts'),
    prazo: texto(dados, 'prazo'),
    carencia: texto(dados, 'carencia'),
    demanda_inicial: texto(dados, 'demanda_inicial'),
    demanda_final: texto(dados, 'demanda_final'),
    destino_recurso: texto(dados, 'destino_recurso'),
    comissao: texto(dados, 'comissao'),
    parecer: texto(dados, 'parecer'),
    tem_fee: marcado(dados, 'tem_fee'),
    nda_assinado: marcado(dados, 'nda_assinado'),
    mandato_assinado: marcado(dados, 'mandato_assinado'),
  };

  let alvo = id;
  if (id) {
    const { error } = await supabase.from('operacao').update(campos).eq('id', id);
    if (error) return { erro: 'Não consegui salvar. Tente de novo.' };
  } else {
    const { data, error } = await supabase.from('operacao').insert(campos).select('id').single();
    if (error || !data) return { erro: 'Não consegui cadastrar. Tente de novo.' };
    alvo = data.id as string;
  }

  // Declínios: regrava o conjunto inteiro.
  const declinios = dados.getAll('declinios').map(String).filter(Boolean);
  await supabase.from('operacao_declinio').delete().eq('operacao_id', alvo);
  if (declinios.length) {
    await supabase
      .from('operacao_declinio')
      .insert(declinios.map((fornecedor_id) => ({ operacao_id: alvo, fornecedor_id })));
  }

  revalidatePath('/operacoes');
  return { ok: true, id: alvo };
}

export async function arquivarOperacao(id: string, arquivado: boolean) {
  const supabase = await clienteServidor();
  await supabase.from('operacao').update({ arquivado }).eq('id', id);
  revalidatePath('/operacoes');
}

export async function excluirOperacao(id: string) {
  const supabase = await clienteServidor();
  await supabase.from('operacao').delete().eq('id', id);
  revalidatePath('/operacoes');
}

/* ------------------------------------------------------------ observações -- */

export async function adicionarObservacao(operacaoId: string, texto: string) {
  const limpo = texto.trim();
  if (!limpo) return;
  const perfil = await perfilAtual();
  const supabase = await clienteServidor();
  await supabase
    .from('operacao_observacao')
    .insert({ operacao_id: operacaoId, texto: limpo, autor_id: perfil.id });
  revalidatePath('/operacoes');
}

export async function excluirObservacao(id: number) {
  const supabase = await clienteServidor();
  await supabase.from('operacao_observacao').delete().eq('id', id);
  revalidatePath('/operacoes');
}

/* ------------------------------------------------------------------ etapas - */

export interface DadosEtapa {
  fornecedor_id: string | null;
  tipo_operacao_id: number | null;
  na_mao_de: string | null;
  status_id: number | null;
}

export async function criarEtapa(operacaoId: string, dados: DadosEtapa) {
  const supabase = await clienteServidor();
  const { data: operacao } = await supabase
    .from('operacao')
    .select('cliente_id')
    .eq('id', operacaoId)
    .single();

  await supabase.from('etapa_operacao').insert({
    operacao_id: operacaoId,
    cliente_id: operacao?.cliente_id ?? null,
    ...dados,
  });
  revalidatePath('/operacoes');
}

export async function atualizarEtapa(id: string, dados: DadosEtapa) {
  const supabase = await clienteServidor();
  await supabase.from('etapa_operacao').update(dados).eq('id', id);
  revalidatePath('/operacoes');
}

export async function excluirEtapa(id: string) {
  const supabase = await clienteServidor();
  await supabase.from('etapa_operacao').delete().eq('id', id);
  revalidatePath('/operacoes');
}
