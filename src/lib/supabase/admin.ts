import { createClient } from '@supabase/supabase-js';

/**
 * Cliente com a `service_role`: ignora RLS e GRANT. **Só servidor** — a chave
 * não tem `NEXT_PUBLIC_`, então nem chega ao bundle, e a trava abaixo acusa se
 * alguém importar isto num componente client (CLAUDE.md, regra 2).
 *
 * Existe para duas coisas: `google_conexao` (db/010), que é fechada para
 * `anon` e `authenticated` de propósito, e criar a conta de login de quem o
 * master cadastra pelo MCP (`cadastrar_pessoa`, specs/12). Não use para contornar o recorte de acesso
 * das telas — para isso é `clienteServidor()`, com a sessão do usuário.
 */
export function clienteAdmin() {
  if (typeof window !== 'undefined') {
    throw new Error('clienteAdmin() chamado no navegador');
  }
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!chave) throw new Error('SUPABASE_SERVICE_ROLE_KEY ausente');

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, chave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
