import { NextResponse, type NextRequest } from 'next/server';
import { clienteServidor } from '@/lib/supabase/servidor';
import { gravarConexao } from '@/lib/google/conexao';
import { gravarConexaoDrive } from '@/lib/google/drive';

/**
 * Retorno do OAuth do Google. Serve a três caminhos:
 *
 * - o login (`/entrar`), que só troca o código pela sessão;
 * - "Conectar Google Agenda" (`/conta/conexoes`, com `?agenda=1`), que pediu o
 *   escopo da agenda com `access_type=offline`. Nesse caso a troca devolve o
 *   `provider_refresh_token` — **uma vez só**: o Supabase não guarda. É aqui
 *   que ele vai, cifrado, para `google_conexao` (specs/11-google-agenda.md);
 * - "Conectar Google Drive" (`?drive=1`), o mesmo caminho para a conexão
 *   única da empresa, `google_drive_conexao` (specs/17). Só master conecta.
 */
export async function GET(requisicao: NextRequest) {
  const { searchParams, origin } = requisicao.nextUrl;
  const codigo = searchParams.get('code');
  const de = searchParams.get('de') ?? '/clientes';
  const agenda = searchParams.get('agenda') === '1';
  const drive = searchParams.get('drive') === '1';
  const conexoes = `${origin}/conta/conexoes`;

  if (codigo) {
    const supabase = await clienteServidor();
    const { data, error } = await supabase.auth.exchangeCodeForSession(codigo);

    if (!error && (agenda || drive)) {
      const qual = drive ? 'drive' : 'agenda';
      const refresh = data.session?.provider_refresh_token;
      if (!refresh) return NextResponse.redirect(`${conexoes}?erro=sem-token&de=${qual}`);

      if (drive) {
        // O Drive é da empresa: a sessão acabou de ser trocada, então o
        // perfil lido aqui é o de quem voltou do Google.
        const { data: perfil } = await supabase
          .from('perfil')
          .select('nivel_acesso')
          .eq('id', data.user.id)
          .maybeSingle();
        if (perfil?.nivel_acesso !== 'master') return NextResponse.redirect(`${conexoes}?erro=so-master&de=drive`);
      }

      try {
        if (drive) await gravarConexaoDrive(data.user.id, refresh, data.user.email ?? null);
        else await gravarConexao(data.user.id, refresh, data.user.email ?? null);
      } catch {
        return NextResponse.redirect(`${conexoes}?erro=gravar&de=${qual}`);
      }
      return NextResponse.redirect(`${conexoes}?conectada=${qual}`);
    }

    if (!error) {
      return NextResponse.redirect(`${origin}${de.startsWith('/') ? de : '/clientes'}`);
    }
  }

  if (agenda || drive) return NextResponse.redirect(`${conexoes}?erro=oauth&de=${drive ? 'drive' : 'agenda'}`);
  return NextResponse.redirect(`${origin}/entrar?erro=oauth`);
}
