import { cache } from 'react';
import { redirect } from 'next/navigation';
import { clienteServidor } from './supabase/servidor';
import type { Perfil } from './dominio';

/**
 * Perfil do usuário da sessão. Redireciona para o login quando não há sessão.
 *
 * Enquanto a RLS está desligada (docs/seguranca.md), é este perfil que
 * determina o recorte das consultas. Quando `db/003_rls.sql` for aplicado, o
 * banco passa a garantir o mesmo recorte — as consultas não mudam.
 *
 * Embrulhado em `cache()` do React: o layout chama isto e a página chama de
 * novo, e a memória dura **uma requisição só** — sessão de um usuário nunca
 * vaza para a de outro.
 *
 * Não guardar isto em `unstable_cache`: tentei, e a função guardada leva junto
 * o cliente Supabase da requisição que a criou. Quando o cache vence, esse
 * cliente velho tenta renovar a sessão com um refresh token já gasto, e o
 * Supabase revoga a sessão inteira — o usuário era jogado para a tela de login
 * no meio do trabalho. O que se ganhava era uma consulta de ~80ms; o que se
 * perdia era a sessão.
 */
export const perfilAtual = cache(async function perfilAtual(): Promise<Perfil> {
  const supabase = await clienteServidor();

  // Ver a nota em supabase/sessao.ts sobre `getClaims()`.
  const { data: autenticado } = await supabase.auth.getUser();
  const id = autenticado.user?.id;
  if (!id) redirect('/entrar');

  const { data: perfil } = await supabase
    .from('perfil')
    .select('id, nome, email, nivel_acesso, ativo')
    .eq('id', id)
    .single();

  if (!perfil) {
    // Conta existe no auth mas não tem perfil: acesso não liberado.
    redirect('/sem-acesso');
  }

  return perfil as Perfil;
});

/** `true` quando o usuário da sessão é master. */
export async function ehMaster(): Promise<boolean> {
  const perfil = await perfilAtual();
  return perfil.nivel_acesso === 'master';
}
