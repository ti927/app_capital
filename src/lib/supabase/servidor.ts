import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Cliente Supabase para Server Components, Route Handlers e Server Actions.
 * Usa a anon key: quem manda no que o usuário enxerga é a sessão dele.
 *
 * Nota: a RLS está desligada por decisão do projeto (docs/seguranca.md).
 * Enquanto estiver assim, o recorte por nível de acesso é feito na consulta,
 * aqui na aplicação. Quando `db/003_rls.sql` for aplicado, o banco passa a
 * garantir o mesmo recorte e estas consultas continuam válidas.
 */
export async function clienteServidor() {
  const armazem = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return armazem.getAll();
        },
        setAll(paraGravar: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          try {
            for (const { name, value, options } of paraGravar) {
              armazem.set(name, value, options);
            }
          } catch {
            // Server Component não pode gravar cookie. O middleware renova a
            // sessão, então ignorar aqui é seguro.
          }
        },
      },
    },
  );
}
