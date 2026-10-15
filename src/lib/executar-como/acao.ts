'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { clienteAdmin } from '@/lib/supabase/admin';
import { clienteServidor } from '@/lib/supabase/servidor';
import { perfilAtual } from '@/lib/perfil';
import { COOKIE_EXECUTAR_COMO, DURACAO_MS, assinarSelo, podeExecutarComo } from './regras';
import { segredoDoSelo, seloAtual } from './servidor';

/**
 * "Executar como" (specs/15-executar-como.md). Só a conta de
 * `EXECUTAR_COMO_EMAIL` — conferido aqui, no servidor, a cada chamada; o botão
 * escondido não é a trava.
 *
 * A troca não envia e-mail: a service_role gera um link mágico para a pessoa
 * (`generateLink`) e o servidor troca o código pela sessão dela na hora
 * (`verifyOtp`). Um cookie assinado e httpOnly guarda quem era a conta
 * original, por 8 horas, para o "Voltar".
 */

async function trocarSessaoPara(email: string) {
  const admin = clienteAdmin();
  const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email });
  const token = data?.properties?.hashed_token;
  if (error || !token) throw new Error('não consegui gerar o acesso');
  const supabase = await clienteServidor();
  const { error: erro } = await supabase.auth.verifyOtp({ token_hash: token, type: 'magiclink' });
  if (erro) throw new Error('não consegui trocar a sessão');
}

export async function entrarComo(alvoId: string): Promise<{ erro?: string }> {
  const perfil = await perfilAtual();
  if (!podeExecutarComo(perfil, process.env.EXECUTAR_COMO_EMAIL)) return { erro: 'Sem permissão para executar como outra pessoa.' };
  if (alvoId === perfil.id) return { erro: 'Essa já é a sua conta.' };

  const admin = clienteAdmin();
  const { data: alvo } = await admin.from('perfil').select('id, email, ativo').eq('id', alvoId).maybeSingle();
  if (!alvo?.ativo || !alvo.email) return { erro: 'Pessoa inativa ou não encontrada.' };

  try {
    await trocarSessaoPara(alvo.email as string);
  } catch (e) {
    return { erro: `Não consegui entrar como essa pessoa: ${(e as Error).message}.` };
  }

  (await cookies()).set(
    COOKIE_EXECUTAR_COMO,
    assinarSelo({ original: perfil.id, alvo: alvo.id as string, expira: Date.now() + DURACAO_MS }, segredoDoSelo()),
    { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: DURACAO_MS / 1000 },
  );
  revalidatePath('/', 'layout');
  redirect('/clientes');
}

export async function voltarParaMinhaConta() {
  const supabase = await clienteServidor();
  const { data } = await supabase.auth.getUser();
  const selo = data.user ? await seloAtual(data.user.id) : null;
  const jarro = await cookies();
  jarro.delete(COOKIE_EXECUTAR_COMO);

  // Sem selo válido, ou a conta original já não pode executar como: sai de vez.
  const admin = clienteAdmin();
  const original = selo
    ? (await admin.from('perfil').select('id, email, nivel_acesso, ativo').eq('id', selo.original).maybeSingle()).data
    : null;
  if (!original || !podeExecutarComo(original as { email: string; nivel_acesso: string; ativo: boolean }, process.env.EXECUTAR_COMO_EMAIL)) {
    await supabase.auth.signOut();
    redirect('/entrar');
  }

  try {
    await trocarSessaoPara(original.email as string);
  } catch {
    await supabase.auth.signOut();
    redirect('/entrar');
  }
  revalidatePath('/', 'layout');
  redirect('/clientes');
}
