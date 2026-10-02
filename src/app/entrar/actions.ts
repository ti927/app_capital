'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { clienteServidor } from '@/lib/supabase/servidor';

export async function entrarComSenha(_anterior: unknown, dados: FormData) {
  const email = String(dados.get('email') ?? '').trim();
  const senha = String(dados.get('senha') ?? '');
  const de = String(dados.get('de') ?? '/clientes');

  if (!email || !senha) return { erro: 'Preencha e-mail e senha.' };

  const supabase = await clienteServidor();
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });

  if (error) return { erro: 'E-mail ou senha incorretos.' };

  revalidatePath('/', 'layout');
  redirect(de.startsWith('/') ? de : '/clientes');
}

export async function sair() {
  const supabase = await clienteServidor();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/entrar');
}
