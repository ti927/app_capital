import { clienteAdmin } from '@/lib/supabase/admin';
import { cifrar, decifrar } from './cripto';

/**
 * Quem conectou a agenda do Google, e com que token (specs/11-google-agenda.md).
 * Tudo pela `service_role`: `google_conexao` é fechada para a sessão do usuário
 * (db/010). Daqui para fora só sai o token decifrado para `agenda.ts`, e o
 * resto do app só pergunta "está conectado?".
 */

export async function gravarConexao(perfilId: string, refreshToken: string, emailGoogle: string | null) {
  const { error } = await clienteAdmin()
    .from('google_conexao')
    .upsert({
      perfil_id: perfilId,
      email_google: emailGoogle,
      refresh_token_cifrado: cifrar(refreshToken, process.env.GOOGLE_TOKEN_CHAVE),
      caiu_em: null,
    });
  if (error) throw new Error(`não consegui gravar a conexão com o Google: ${error.message}`);
}

/** O token decifrado, ou `null` se a pessoa não conectou ou a conexão caiu. */
export async function tokenDe(perfilId: string): Promise<string | null> {
  const { data } = await clienteAdmin()
    .from('google_conexao')
    .select('refresh_token_cifrado, caiu_em')
    .eq('perfil_id', perfilId)
    .maybeSingle();
  if (!data || data.caiu_em) return null;
  return decifrar(data.refresh_token_cifrado as string, process.env.GOOGLE_TOKEN_CHAVE);
}

/** Os perfis com agenda conectada e de pé. Só ids — nada de token. */
export async function perfisConectados(): Promise<Set<string>> {
  const { data } = await clienteAdmin().from('google_conexao').select('perfil_id').is('caiu_em', null);
  return new Set((data ?? []).map((l) => l.perfil_id as string));
}

export interface EstadoDaConexao {
  conectado: boolean;
  caiu: boolean;
  emailGoogle: string | null;
}

export async function estadoDe(perfilId: string): Promise<EstadoDaConexao> {
  const { data } = await clienteAdmin()
    .from('google_conexao')
    .select('email_google, caiu_em')
    .eq('perfil_id', perfilId)
    .maybeSingle();
  return {
    conectado: Boolean(data && !data.caiu_em),
    caiu: Boolean(data?.caiu_em),
    emailGoogle: (data?.email_google as string | null) ?? null,
  };
}

/** O Google recusou o token (revogado pela pessoa, senha trocada…). */
export async function marcarCaida(perfilId: string) {
  await clienteAdmin()
    .from('google_conexao')
    .update({ caiu_em: new Date().toISOString() })
    .eq('perfil_id', perfilId);
}

export async function apagarConexao(perfilId: string) {
  await clienteAdmin().from('google_conexao').delete().eq('perfil_id', perfilId);
}
