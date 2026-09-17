import { NextResponse, type NextRequest } from 'next/server';
import { clienteServidor } from '@/lib/supabase/servidor';

/**
 * Retorno do OAuth. Serve para o Google quando o provedor for ligado no
 * Supabase — nada além disso precisa mudar para o Google entrar.
 */
export async function GET(requisicao: NextRequest) {
  const { searchParams, origin } = requisicao.nextUrl;
  const codigo = searchParams.get('code');
  const de = searchParams.get('de') ?? '/clientes';

  if (codigo) {
    const supabase = await clienteServidor();
    const { error } = await supabase.auth.exchangeCodeForSession(codigo);
    if (!error) {
      return NextResponse.redirect(`${origin}${de.startsWith('/') ? de : '/clientes'}`);
    }
  }

  return NextResponse.redirect(`${origin}/entrar?erro=oauth`);
}
