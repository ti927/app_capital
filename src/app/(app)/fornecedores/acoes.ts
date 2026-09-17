'use server';

import { revalidatePath } from 'next/cache';
import { clienteServidor } from '@/lib/supabase/servidor';

const texto = (dados: FormData, chave: string) => {
  const v = String(dados.get(chave) ?? '').trim();
  return v === '' ? null : v;
};

const numeros = (dados: FormData, chave: string) =>
  dados.getAll(chave).map((v) => Number(v)).filter((n) => Number.isFinite(n));

/** Os quatro papéis do fornecedor sobre os 31 tipos de operação. */
const PAPEIS = [
  ['tipos_operacoes', 'atende'],
  ['linha_1', 'linha_1'],
  ['linha_2', 'linha_2'],
  ['nao_atendidas', 'nao_atende'],
] as const;

export async function gravarFornecedor(_anterior: unknown, dados: FormData) {
  const supabase = await clienteServidor();

  const id = String(dados.get('id') ?? '');
  const nome = texto(dados, 'nome_fundo');
  if (!nome) return { erro: 'O nome do fundo é obrigatório.' };

  const campos = {
    nome_fundo: nome,
    cidade: texto(dados, 'cidade'),
    numero: texto(dados, 'numero'),
    email: texto(dados, 'email'),
    contato: texto(dados, 'contato'),
    pf_ou_pj: texto(dados, 'pf_ou_pj'),
    fee: texto(dados, 'fee'),
    parecer: texto(dados, 'parecer'),
    status: texto(dados, 'status'),
    link_indicacao: texto(dados, 'link_indicacao'),
    faturamento_minimo: texto(dados, 'faturamento_minimo'),
    operacao_minima: texto(dados, 'operacao_minima'),
    segmento_foco: texto(dados, 'segmento_foco'),
    segmento_nao_atua: texto(dados, 'segmento_nao_atua'),
  };

  let alvo = id;
  if (id) {
    const { error } = await supabase.from('fornecedor').update(campos).eq('id', id);
    if (error) return { erro: 'Não consegui salvar. Tente de novo.' };
  } else {
    const { data, error } = await supabase.from('fornecedor').insert(campos).select('id').single();
    if (error || !data) return { erro: 'Não consegui cadastrar. Tente de novo.' };
    alvo = data.id as string;
  }

  // Regrava os quatro papéis de uma vez: é mais simples que diferenciar, e o
  // volume é pequeno (31 tipos, 73 fornecedores).
  await supabase.from('fornecedor_tipo_operacao').delete().eq('fornecedor_id', alvo);
  const vinculos = PAPEIS.flatMap(([campo, papel]) =>
    numeros(dados, campo).map((tipo_operacao_id) => ({
      fornecedor_id: alvo,
      tipo_operacao_id,
      papel,
    })),
  );
  if (vinculos.length) await supabase.from('fornecedor_tipo_operacao').insert(vinculos);

  revalidatePath('/fornecedores');
  return { ok: true };
}

export async function arquivarFornecedor(id: string, arquivado: boolean) {
  const supabase = await clienteServidor();
  await supabase.from('fornecedor').update({ arquivado }).eq('id', id);
  revalidatePath('/fornecedores');
}

export async function excluirFornecedor(id: string) {
  const supabase = await clienteServidor();
  await supabase.from('fornecedor').delete().eq('id', id);
  revalidatePath('/fornecedores');
}
