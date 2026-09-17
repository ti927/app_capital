import { redirect } from 'next/navigation';
import { clienteServidor } from './supabase/servidor';
import type { Perfil } from './dominio';

/**
 * Perfil do usuário da sessão. Redireciona para o login quando não há sessão.
 *
 * Enquanto a RLS está desligada (docs/seguranca.md), é este perfil que
 * determina o recorte das consultas. Quando `db/003_rls.sql` for aplicado, o
 * banco passa a garantir o mesmo recorte — as consultas não mudam.
 */
export async function perfilAtual(): Promise<Perfil> {
  const supabase = await clienteServidor();

  const { data: autenticado } = await supabase.auth.getUser();
  if (!autenticado.user) redirect('/entrar');

  const { data: perfil } = await supabase
    .from('perfil')
    .select('id, nome, email, nivel_acesso, ativo')
    .eq('id', autenticado.user.id)
    .single();

  if (!perfil) {
    // Conta existe no auth mas não tem perfil: acesso não liberado.
    redirect('/sem-acesso');
  }

  return perfil as Perfil;
}

/** `true` quando o usuário da sessão é master. */
export async function ehMaster(): Promise<boolean> {
  const perfil = await perfilAtual();
  return perfil.nivel_acesso === 'master';
}
