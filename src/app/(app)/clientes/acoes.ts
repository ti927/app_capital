'use server';

import { revalidatePath } from 'next/cache';
import { clienteServidor } from '@/lib/supabase/servidor';
import { perfilAtual } from '@/lib/perfil';
import { diferenca } from '@/lib/diferenca';

const texto = (dados: FormData, chave: string) => {
  const v = String(dados.get(chave) ?? '').trim();
  return v === '' ? null : v;
};

/** Criar e editar são o mesmo formulário: o `id` decide qual é. */
export async function gravarCliente(_anterior: unknown, dados: FormData) {
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

  let salvoId = id;
  if (id) {
    // Edição: o perfil, o update e a leitura dos vínculos atuais não dependem
    // um do outro — uma ida só, em vez de quatro em fila. (O perfil só decide
    // se "quem visualiza" é gravado; o update corre igual para todos.)
    const [perfil, atualizado, vinculos] = await Promise.all([
      perfilAtual(),
      supabase.from('cliente').update(campos).eq('id', id),
      supabase.from('cliente_visualizador').select('perfil_id').eq('cliente_id', id),
    ]);
    if (atualizado.error) return { erro: 'Não consegui salvar. Tente de novo.' };

    // "Quem visualiza" só master edita. Grava só a diferença: sem mudança, nenhuma ida.
    if (perfil.nivel_acesso === 'master') {
      const escolhidos = dados.getAll('quem_visualiza').map(String).filter(Boolean);
      if (vinculos.error) {
        // Sem a leitura, regrava o conjunto inteiro, como sempre foi.
        await supabase.from('cliente_visualizador').delete().eq('cliente_id', id);
        if (escolhidos.length) {
          await supabase
            .from('cliente_visualizador')
            .insert(escolhidos.map((perfil_id) => ({ cliente_id: id, perfil_id })));
        }
      } else {
        const { remover, incluir } = diferenca(
          (vinculos.data ?? []).map((v) => v.perfil_id as string),
          escolhidos,
        );
        await Promise.all([
          remover.length
            ? supabase.from('cliente_visualizador').delete().eq('cliente_id', id).in('perfil_id', remover)
            : null,
          incluir.length
            ? supabase
                .from('cliente_visualizador')
                .insert(incluir.map((perfil_id) => ({ cliente_id: id, perfil_id })))
            : null,
        ]);
      }
    }
  } else {
    const perfil = await perfilAtual();
    // `criado_por` fecha a outra metade do recorte do indicante: ele enxerga
    // quem cadastrou, mesmo que ninguém o tenha posto em "quem visualiza".
    const { data, error } = await supabase
      .from('cliente')
      .insert({ ...campos, criado_por: perfil.id })
      .select('id')
      .single();
    if (error || !data) return { erro: 'Não consegui cadastrar. Tente de novo.' };
    salvoId = data.id as string;

    // Quem cria enxerga. No original isso era feito por workflow, com um ID de
    // usuário cravado em código; aqui é o autor da ação.
    // Master pode escolher mais gente já no cadastro (policy: só master
    // insere vínculo de outra pessoa); os demais só se põem.
    const extras =
      perfil.nivel_acesso === 'master' ? dados.getAll('quem_visualiza').map(String).filter(Boolean) : [];
    const ids = [...new Set([perfil.id, ...extras])];
    await supabase
      .from('cliente_visualizador')
      .insert(ids.map((perfil_id) => ({ cliente_id: data.id, perfil_id })));

    // Cadastro puxado de um cartão do funil: liga os dois, senão o mesmo
    // cartão continuaria sendo oferecido em "Puxar do funil".
    const cartaoId = texto(dados, 'cartao_id');
    if (cartaoId) {
      await supabase.from('funil_cartao').update({ cliente_id: data.id }).eq('id', cartaoId);
      revalidatePath('/funil');
    }
  }

  revalidatePath('/clientes');
  return { ok: true, id: salvoId };
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
