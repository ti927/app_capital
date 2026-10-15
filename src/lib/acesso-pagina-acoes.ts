'use server';

import { revalidatePath } from 'next/cache';
import { clienteServidor } from './supabase/servidor';
import { perfilAtual } from './perfil';
import type { Pagina } from './acesso-pagina';

/** Só estas páginas sabem receber indicante (specs/16); as outras seguem só de master. */
const LIBERAVEIS: readonly Pagina[] = ['operacao'];

/**
 * Configurações → Acesso às páginas: master liga ou desliga uma página de
 * master para um indicante. Grava em `acesso_pagina`, que a RLS deixa só
 * master escrever; a conferência aqui é a segunda trava.
 */
export async function liberarPagina(perfilId: string, pagina: Pagina, liberar: boolean) {
  if ((await perfilAtual()).nivel_acesso !== 'master') return { erro: 'Só master muda acesso.' };
  if (!LIBERAVEIS.includes(pagina)) return { erro: 'Esta página ainda não pode ser liberada.' };

  const supabase = await clienteServidor();
  const { error } = liberar
    ? await supabase
        .from('acesso_pagina')
        .upsert({ perfil_id: perfilId, pagina, nivel_acesso: 'indicante' }, { onConflict: 'perfil_id,pagina' })
    : await supabase.from('acesso_pagina').delete().eq('perfil_id', perfilId).eq('pagina', pagina);
  if (error) return { erro: 'Não consegui gravar. Tente de novo.' };

  // Menu lateral e porteiro das páginas leem a tabela a cada requisição.
  revalidatePath('/', 'layout');
  return { ok: true };
}
