import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { createClient } from '@supabase/supabase-js';
import { registrarFerramentas } from '@/lib/mcp/ferramentas';
import { origemDe } from '@/lib/mcp/origem';

/**
 * MCP do sistema (specs/12-mcp-e-readai.md).
 *
 * O Claude chega com um token OAuth emitido pelo Supabase para a pessoa que
 * aprovou em `/oauth/consent`. O cliente Supabase daqui usa **esse token**, com
 * a anon key — nada de service_role: a RLS (db/009) recorta cada consulta
 * como se a pessoa estivesse no app.
 *
 * Sem estado entre requisições (modo stateless do transporte): cada chamada
 * monta o servidor, atende e acaba. É o que cabe numa função da Vercel.
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function naoAutorizado(origem: string, motivo: string) {
  return new Response(JSON.stringify({ error: 'invalid_token', error_description: motivo }), {
    status: 401,
    headers: {
      'Content-Type': 'application/json',
      // É por aqui que o Claude descobre onde fazer login (RFC 9728).
      'WWW-Authenticate': `Bearer resource_metadata="${origem}/.well-known/oauth-protected-resource/api/mcp"`,
    },
  });
}

async function atender(req: Request) {
  const origem = origemDe(req);
  const token = req.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return naoAutorizado(origem, 'faltou o token');

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: usuario } = await supabase.auth.getUser(token);
  if (!usuario.user) return naoAutorizado(origem, 'token inválido ou vencido');

  const { data: perfil } = await supabase
    .from('perfil')
    .select('id, nome, nivel_acesso, ativo')
    .eq('id', usuario.user.id)
    .maybeSingle();
  if (!perfil?.ativo) {
    return new Response(JSON.stringify({ error: 'forbidden', error_description: 'conta sem acesso ao app' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const servidor = new McpServer({ name: 'lure-capital', version: '1.0.0' });
  registrarFerramentas(servidor, {
    supabase,
    perfil: { id: perfil.id as string, nome: perfil.nome as string, nivel_acesso: perfil.nivel_acesso as string },
    origem,
  });

  const transporte = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  await servidor.connect(transporte);
  return transporte.handleRequest(req);
}

export { atender as GET, atender as POST, atender as DELETE };
