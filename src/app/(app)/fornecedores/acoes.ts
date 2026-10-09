'use server';

import { revalidatePath } from 'next/cache';
import { clienteServidor } from '@/lib/supabase/servidor';
import { diferenca } from '@/lib/diferenca';

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

  // O que o formulário quer: (tipo, papel) de cada vínculo.
  const chave = (v: { tipo_operacao_id: number; papel: string }) => `${v.tipo_operacao_id}:${v.papel}`;
  const quer = [
    ...new Map(
      PAPEIS.flatMap(([campo, papel]) =>
        numeros(dados, campo).map((tipo_operacao_id) => ({ tipo_operacao_id, papel })),
      ).map((v) => [chave(v), v] as const),
    ).values(),
  ];

  let alvo = id;
  let atuais: Array<{ tipo_operacao_id: number; papel: string }> | null = [];
  if (id) {
    // O update e a leitura dos vínculos atuais não dependem um do outro.
    const [atualizado, lidos] = await Promise.all([
      supabase.from('fornecedor').update(campos).eq('id', id),
      supabase.from('fornecedor_tipo_operacao').select('tipo_operacao_id, papel').eq('fornecedor_id', id),
    ]);
    if (atualizado.error) return { erro: 'Não consegui salvar. Tente de novo.' };
    atuais = lidos.error ? null : (lidos.data as Array<{ tipo_operacao_id: number; papel: string }>);
  } else {
    const { data, error } = await supabase.from('fornecedor').insert(campos).select('id').single();
    if (error || !data) return { erro: 'Não consegui cadastrar. Tente de novo.' };
    alvo = data.id as string;
  }

  if (atuais === null) {
    // Sem a leitura, regrava os quatro papéis de uma vez, como sempre foi.
    await supabase.from('fornecedor_tipo_operacao').delete().eq('fornecedor_id', alvo);
    if (quer.length) {
      await supabase
        .from('fornecedor_tipo_operacao')
        .insert(quer.map((v) => ({ fornecedor_id: alvo, ...v })));
    }
  } else {
    // Só a diferença vai ao banco; sem mudança, nenhuma ida.
    const { remover, incluir } = diferenca(atuais.map(chave), quer.map(chave));
    const saem = new Map<string, number[]>();
    for (const c of remover) {
      const [tipo, papel] = c.split(':');
      saem.set(papel, [...(saem.get(papel) ?? []), Number(tipo)]);
    }
    const entram = new Set(incluir);
    await Promise.all([
      ...[...saem].map(([papel, tipos]) =>
        supabase
          .from('fornecedor_tipo_operacao')
          .delete()
          .eq('fornecedor_id', alvo)
          .eq('papel', papel)
          .in('tipo_operacao_id', tipos),
      ),
      entram.size
        ? supabase
            .from('fornecedor_tipo_operacao')
            .insert(quer.filter((v) => entram.has(chave(v))).map((v) => ({ fornecedor_id: alvo, ...v })))
        : null,
    ]);
  }

  revalidatePath('/fornecedores');
  return { ok: true, id: alvo };
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
