import { createHmac } from 'node:crypto';
import { cookies } from 'next/headers';
import { COOKIE_EXECUTAR_COMO, lerSelo, type Selo } from './regras';

/**
 * Lado servidor do "executar como". O segredo do selo é derivado da
 * service_role — nunca sai do servidor e não precisa de variável nova. Trocar a
 * service_role invalida os selos em curso, o que é o comportamento certo.
 */
export function segredoDoSelo(): string {
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!chave) throw new Error('SUPABASE_SERVICE_ROLE_KEY ausente');
  return createHmac('sha256', chave).update('lure:executar-como:v1').digest('hex');
}

/**
 * O selo da troca em curso, se houver um válido para a sessão de agora (o
 * `alvo` do selo tem de ser quem está logado). Selo de outra sessão não vale.
 */
export async function seloAtual(usuarioId: string): Promise<Selo | null> {
  const valor = (await cookies()).get(COOKIE_EXECUTAR_COMO)?.value;
  if (!valor) return null;
  const selo = lerSelo(valor, segredoDoSelo(), Date.now());
  return selo && selo.alvo === usuarioId ? selo : null;
}
