'use server';

import { revalidatePath } from 'next/cache';
import { perfilAtual } from '@/lib/perfil';
import { apagarConexao } from '@/lib/google/conexao';
import { revogarNoGoogle } from '@/lib/google/agenda';

/**
 * Desconecta a agenda de quem está logado — e só dela: o perfil vem da sessão,
 * nunca de parâmetro. Os eventos já criados ficam na agenda; o que para é a
 * sincronização.
 */
export async function desconectarAgenda() {
  const perfil = await perfilAtual();
  await revogarNoGoogle(perfil.id);
  await apagarConexao(perfil.id);
  revalidatePath('/conta/agenda');
}
