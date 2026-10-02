import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Rotas que não exigem sessão de navegador. O MCP (`/api/mcp`) se autentica
 * pelo token OAuth no cabeçalho, e `/.well-known` é a descoberta do login
 * dele (specs/12) — nenhum dos dois tem cookie.
 */
const PUBLICAS = ['/entrar', '/auth', '/api/mcp', '/.well-known'];

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
   * `getUser()` revalida o token no servidor. Não trocar por `getSession()`,
   * que lê o cookie sem conferir nada.
   *
   * `getClaims()` confere a assinatura localmente (o projeto usa ES256) e
   * evitaria esta ida à rede. **Já foi medido duas vezes, e não compensa:**
   *
   *   18/09/2026  ~19ms de 377ms
   *   21/09/2026  372ms contra 375ms — mediana de 7 passadas, empate
   *
   * A segunda medição foi feita de propósito porque o log do servidor mostra
   * `getUser()` levando ~68ms: parecia dinheiro no chão. Não é — esses 68ms
   * correm junto com o prefetch da rota, não na frente do clique. Trocar aqui
   * seria abrir mão de uma revogação de sessão que o servidor confere, em
   * troca de nada. Não medir de novo sem mudar alguma outra coisa antes.
   */
  const { data } = await supabase.auth.getUser();
  const usuario = data.user;

  const caminho = requisicao.nextUrl.pathname;
  const ehPublica = PUBLICAS.some((p) => caminho.startsWith(p));

  if (!usuario && !ehPublica) {
    const url = requisicao.nextUrl.clone();
    url.pathname = '/entrar';
    // Com a query: a tela de autorização do OAuth (/oauth/consent) depende do
    // `authorization_id` para continuar depois do login.
    url.search = '';
    url.searchParams.set('de', caminho + requisicao.nextUrl.search);
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
