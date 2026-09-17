import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/** Rotas que não exigem sessão. */
const PUBLICAS = ['/entrar', '/auth'];

/**
 * Renova a sessão a cada navegação e barra quem não está autenticado.
 * Chamado pelo middleware.
 */
export async function renovarSessao(requisicao: NextRequest) {
  let resposta = NextResponse.next({ request: requisicao });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return requisicao.cookies.getAll();
        },
        setAll(paraGravar: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          for (const { name, value } of paraGravar) {
            requisicao.cookies.set(name, value);
          }
          resposta = NextResponse.next({ request: requisicao });
          for (const { name, value, options } of paraGravar) {
            resposta.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // getUser() revalida o token no servidor. Não trocar por getSession(),
  // que lê o cookie sem conferir.
  const { data } = await supabase.auth.getUser();

  const caminho = requisicao.nextUrl.pathname;
  const ehPublica = PUBLICAS.some((p) => caminho.startsWith(p));

  if (!data.user && !ehPublica) {
    const url = requisicao.nextUrl.clone();
    url.pathname = '/entrar';
    url.searchParams.set('de', caminho);
    return NextResponse.redirect(url);
  }

  if (data.user && caminho === '/entrar') {
    const url = requisicao.nextUrl.clone();
    url.pathname = '/clientes';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return resposta;
}
