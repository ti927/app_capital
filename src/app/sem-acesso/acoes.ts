'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { clienteServidor } from '@/lib/supabase/servidor';

/**
 * "Sair e entrar com outra conta": encerra a sessão do Supabase, apaga os
 * cookies dela e volta para /entrar já abrindo o seletor de contas do Google
 * (`?trocar=1` → `prompt=select_account` em entrar/formulario.tsx).
 *
 * Quem cai aqui entrou com uma conta Google que não tem perfil no app (ou tem
 * perfil inativo): sem o seletor, o Google entraria de novo na mesma conta.
 */
export async function sairEEntrarComOutraConta() {
  const supabase = await clienteServidor();
  await supabase.auth.signOut();

  // O signOut já pede para apagar os cookies da sessão; aqui garante que não
  // sobre nenhum pedaço (o @supabase/ssr divide o token em sb-…-auth-token.0, .1…).
  const jarro = await cookies();
  for (const c of jarro.getAll()) {
    if (c.name.startsWith('sb-')) jarro.delete(c.name);
  }

  revalidatePath('/', 'layout');
  redirect('/entrar?trocar=1');
}
