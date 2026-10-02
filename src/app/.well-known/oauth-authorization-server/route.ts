import { EMISSOR } from '@/lib/mcp/origem';

/**
 * Clientes MCP mais antigos procuram os metadados do servidor de autorização
 * no próprio domínio do MCP, em vez de seguir o RFC 9728. Este endereço repassa
 * os do Supabase, que é quem de fato emite os tokens (specs/12).
 */
export async function GET() {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/.well-known/oauth-authorization-server/auth/v1`;
  const resposta = await fetch(url, { next: { revalidate: 3600 } });
  if (!resposta.ok) {
    return Response.json({ error: 'metadados indisponíveis', emissor: EMISSOR }, { status: 502 });
  }
  return Response.json(await resposta.json(), { headers: { 'Access-Control-Allow-Origin': '*' } });
}
