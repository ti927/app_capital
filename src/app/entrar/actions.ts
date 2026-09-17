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

export async function pedirTrocaDeSenha(_anterior: unknown, dados: FormData) {
  const email = String(dados.get('email') ?? '').trim();
  if (!email) return { erro: 'Informe o e-mail.' };

  const supabase = await clienteServidor();
  await supabase.auth.resetPasswordForEmail(email);

  // Resposta igual com e-mail existente ou não: não revela quem tem conta.
  return { aviso: 'Se houver conta com esse e-mail, a solicitação foi enviada.' };
}

export async function sair() {
  const supabase = await clienteServidor();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/entrar');
}
