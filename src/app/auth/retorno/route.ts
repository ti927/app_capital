import { NextResponse, type NextRequest } from 'next/server';
import { clienteServidor } from '@/lib/supabase/servidor';
import { gravarConexao } from '@/lib/google/conexao';

/**
 * Retorno do OAuth do Google. Serve a dois caminhos:
 *
 * - o login (`/entrar`), que só troca o código pela sessão;
 * - "Conectar Google Agenda" (`/conta/agenda`, com `?agenda=1`), que pediu o
 *   escopo da agenda com `access_type=offline`. Nesse caso a troca devolve o
 *   `provider_refresh_token` — **uma vez só**: o Supabase não guarda. É aqui
 *   que ele vai, cifrado, para `google_conexao` (specs/11-google-agenda.md).
 */
export async function GET(requisicao: NextRequest) {
  const { searchParams, origin } = requisicao.nextUrl;
  const codigo = searchParams.get('code');
  const de = searchParams.get('de') ?? '/clientes';
  const agenda = searchParams.get('agenda') === '1';

  if (codigo) {
    const supabase = await clienteServidor();
    const { data, error } = await supabase.auth.exchangeCodeForSession(codigo);

    if (!error && agenda) {
      const refresh = data.session?.provider_refresh_token;
      if (!refresh) return NextResponse.redirect(`${origin}/conta/agenda?erro=sem-token`);
      try {
        await gravarConexao(data.user.id, refresh, data.user.email ?? null);
      } catch {
        return NextResponse.redirect(`${origin}/conta/agenda?erro=gravar`);
      }
      return NextResponse.redirect(`${origin}/conta/agenda?conectada=1`);
    }

    if (!error) {
      return NextResponse.redirect(`${origin}${de.startsWith('/') ? de : '/clientes'}`);
    }
  }

  return NextResponse.redirect(agenda ? `${origin}/conta/agenda?erro=oauth` : `${origin}/entrar?erro=oauth`);
}
