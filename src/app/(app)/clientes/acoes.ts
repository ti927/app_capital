'use server';

import { revalidatePath } from 'next/cache';
import { clienteServidor } from '@/lib/supabase/servidor';
import { perfilAtual } from '@/lib/perfil';

const texto = (dados: FormData, chave: string) => {
  const v = String(dados.get(chave) ?? '').trim();
  return v === '' ? null : v;
};

/** Criar e editar são o mesmo formulário: o `id` decide qual é. */
export async function gravarCliente(_anterior: unknown, dados: FormData) {
  const perfil = await perfilAtual();
  const supabase = await clienteServidor();

  const id = String(dados.get('id') ?? '');
  const nome = texto(dados, 'nome_razao');
  if (!nome) return { erro: 'O nome/razão social é obrigatório.' };

  const campos = {
    nome_razao: nome,
    cnpj: texto(dados, 'cnpj'),
    cidade: texto(dados, 'cidade'),
    telefone: texto(dados, 'telefone'),
    diretor_gerente: texto(dados, 'diretor_gerente'),
    atividade_cia: texto(dados, 'atividade_cia'),
    faturamento_anual: texto(dados, 'faturamento_anual'),
    margem_liquida: texto(dados, 'margem_liquida'),
    ativos: texto(dados, 'ativos'),
    passivo_oneroso: texto(dados, 'passivo_oneroso'),
    quem_indicou: texto(dados, 'quem_indicou'),
    demanda: texto(dados, 'demanda'),
    estimativa_faturamento: texto(dados, 'estimativa_faturamento'),
    parecer: texto(dados, 'parecer'),
    status: texto(dados, 'status'),
  };

  if (id) {
    const { error } = await supabase.from('cliente').update(campos).eq('id', id);
    if (error) return { erro: 'Não consegui salvar. Tente de novo.' };
  } else {
    // `criado_por` fecha a outra metade do recorte do indicante: ele enxerga
    // quem cadastrou, mesmo que ninguém o tenha posto em "quem visualiza".
    const { data, error } = await supabase
      .from('cliente')
      .insert({ ...campos, criado_por: perfil.id })
      .select('id')
      .single();
    if (error || !data) return { erro: 'Não consegui cadastrar. Tente de novo.' };

    // Quem cria enxerga. No original isso era feito por workflow, com um ID de
    // usuário cravado em código; aqui é o autor da ação.
    await supabase.from('cliente_visualizador').insert({ cliente_id: data.id, perfil_id: perfil.id });

    // Cadastro puxado de um cartão do funil: liga os dois, senão o mesmo
    // cartão continuaria sendo oferecido em "Puxar do funil".
    const cartaoId = texto(dados, 'cartao_id');
    if (cartaoId) {
      await supabase.from('funil_cartao').update({ cliente_id: data.id }).eq('id', cartaoId);
      revalidatePath('/funil');
    }
  }

  // "Quem visualiza" só master edita.
  if (perfil.nivel_acesso === 'master' && id) {
    const escolhidos = dados.getAll('quem_visualiza').map(String).filter(Boolean);
    await supabase.from('cliente_visualizador').delete().eq('cliente_id', id);
    if (escolhidos.length) {
      await supabase
        .from('cliente_visualizador')
        .insert(escolhidos.map((perfil_id) => ({ cliente_id: id, perfil_id })));
    }
  }

  revalidatePath('/clientes');
  return { ok: true };
}

export async function arquivarCliente(id: string, arquivado: boolean) {
  const supabase = await clienteServidor();
  await supabase.from('cliente').update({ arquivado }).eq('id', id);
  revalidatePath('/clientes');
}

export async function excluirCliente(id: string) {
  const supabase = await clienteServidor();
  await supabase.from('cliente').delete().eq('id', id);
  revalidatePath('/clientes');
}

export async function adicionarEmail(clienteId: string, email: string) {
  const limpo = email.trim();
  if (!limpo) return;
  const supabase = await clienteServidor();
  await supabase.from('cliente_email').insert({ cliente_id: clienteId, email: limpo });
  revalidatePath('/clientes');
}

export async function removerEmail(id: number) {
  const supabase = await clienteServidor();
  await supabase.from('cliente_email').delete().eq('id', id);
  revalidatePath('/clientes');
}
