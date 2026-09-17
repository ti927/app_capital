import type { NextRequest } from 'next/server';
import { renovarSessao } from '@/lib/supabase/sessao';

export async function middleware(requisicao: NextRequest) {
  return renovarSessao(requisicao);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
