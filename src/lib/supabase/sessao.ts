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

  /**
   * `getClaims()` confere a ASSINATURA do token localmente, contra a chave
   * pública do projeto (que ele busca uma vez e guarda). `getUser()` fazia uma
   * ida à rede ao Supabase Auth **em toda requisição** — e o middleware roda
   * antes de a página começar, então esse tempo entrava inteiro na conta do
   * usuário.
   *
   * Não trocar por `getSession()`: aquele lê o cookie sem conferir nada, e aí
   * um cookie forjado passa.
   */
  const { data } = await supabase.auth.getClaims();
  const usuario = data?.claims ?? null;

  const caminho = requisicao.nextUrl.pathname;
  const ehPublica = PUBLICAS.some((p) => caminho.startsWith(p));

  if (!usuario && !ehPublica) {
    const url = requisicao.nextUrl.clone();
    url.pathname = '/entrar';
    url.searchParams.set('de', caminho);
    return NextResponse.redirect(url);
  }

  if (usuario && caminho === '/entrar') {
    const url = requisicao.nextUrl.clone();
    url.pathname = '/clientes';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return resposta;
}
