import { cache } from 'react';
import { unstable_cache } from 'next/cache';
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
 * Embrulhado em `cache()`: o layout chama isto e a página chama de novo, e
 * cada chamada custava `auth.getUser()` (ida à rede) mais uma consulta a
 * `perfil`. Com o cache do React são quatro idas a menos por navegação, e a
 * memória dura uma requisição só — sessão de um usuário nunca vaza para a de
 * outro.
 */
export const perfilAtual = cache(async function perfilAtual(): Promise<Perfil> {
  const supabase = await clienteServidor();

  // Assinatura conferida localmente — ver a nota em supabase/sessao.ts.
  const { data: token } = await supabase.auth.getClaims();
  const id = token?.claims?.sub;
  if (!id) redirect('/entrar');

  const perfil = await linhaDoPerfil(id, supabase);

  if (!perfil) {
    // Conta existe no auth mas não tem perfil: acesso não liberado.
    redirect('/sem-acesso');
  }

  return perfil;
});

/**
 * A linha de `perfil` guardada por 60s, por usuário. São cinco contas e o
 * nível de acesso muda uma vez por mês: consultar isso em toda navegação era
 * uma ida ao banco para trazer sempre a mesma coisa. O nível novo aparece no
 * minuto seguinte — e `Configurações` continua mostrando o estado real, porque
 * lê a tabela direto.
 */
const linhaDoPerfil = (id: string, supabase: Awaited<ReturnType<typeof clienteServidor>>) =>
  unstable_cache(
    async () => {
      // O cliente vem de fora de propósito: `unstable_cache` não deixa ler
      // `cookies()` lá dentro — é dado da requisição, e o cache é de todas.
      const { data } = await supabase
        .from('perfil')
        .select('id, nome, email, nivel_acesso, ativo')
        .eq('id', id)
        .single();
      return (data as Perfil | null) ?? null;
    },
    ['perfil', id],
    { revalidate: 60, tags: ['perfil'] },
  )();

/** `true` quando o usuário da sessão é master. */
export async function ehMaster(): Promise<boolean> {
  const perfil = await perfilAtual();
  return perfil.nivel_acesso === 'master';
}
