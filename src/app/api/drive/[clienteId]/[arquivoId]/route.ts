import { NextResponse, type NextRequest } from 'next/server';
import { clienteServidor } from '@/lib/supabase/servidor';
import { ErroDrive, baixarArquivo, dentroDe, pastaDoCliente } from '@/lib/google/drive';

/**
 * Abre um arquivo do Drive da Lure pelo app (specs/17). O indicante não tem
 * acesso ao Drive, então os bytes passam por aqui — depois de duas travas:
 * (1) a pessoa enxerga o cliente (RLS, pela sessão dela) e (2) o arquivo está
 * dentro da pasta desse cliente. `?baixar=1` troca "abrir" por "baixar".
 */
export async function GET(
  requisicao: NextRequest,
  { params }: { params: Promise<{ clienteId: string; arquivoId: string }> },
) {
  const { clienteId, arquivoId } = await params;
  const supabase = await clienteServidor();

  const { data: cliente } = await supabase.from('cliente').select('nome_razao').eq('id', clienteId).maybeSingle();
  if (!cliente) return new NextResponse('Cliente não encontrado.', { status: 404 });

  try {
    const { pasta } = await pastaDoCliente(cliente.nome_razao as string);
    if (!pasta || !(await dentroDe(arquivoId, pasta.id))) {
      return new NextResponse('Arquivo não encontrado na pasta deste cliente.', { status: 404 });
    }

    const { corpo, tipo, nome } = await baixarArquivo(arquivoId);
    // Abre na tela só o que não executa nada: um HTML ou SVG do Drive, servido
    // inline pelo domínio do app, rodaria script com a sessão de quem abriu.
    const seguro = ['application/pdf', 'image/png', 'image/jpeg', 'image/gif', 'image/webp', 'text/plain'].some((t) => tipo.startsWith(t));
    const modo = requisicao.nextUrl.searchParams.get('baixar') === '1' || !seguro ? 'attachment' : 'inline';
    return new NextResponse(corpo, {
      headers: {
        'Content-Type': tipo,
        'Content-Disposition': `${modo}; filename*=UTF-8''${encodeURIComponent(nome)}`,
        'Cache-Control': 'private, max-age=300',
        'X-Content-Type-Options': 'nosniff',
        // O visualizador de PDF do Chrome não abre com `sandbox`: a trava vai só no resto.
        ...(seguro ? {} : { 'Content-Security-Policy': "default-src 'none'; sandbox" }),
      },
    });
  } catch (e) {
    const texto = e instanceof ErroDrive ? e.message : 'erro inesperado ao ler o Drive';
    return new NextResponse(`Não consegui abrir o arquivo: ${texto}.`, { status: 502 });
  }
}
