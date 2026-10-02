/**
 * Endereço público do app a partir da requisição — atrás da Vercel o host
 * verdadeiro vem em `x-forwarded-host`. Usado pelo MCP e pela descoberta do
 * OAuth, que precisam anunciar a própria URL.
 */
export function origemDe(req: Request) {
  const h = req.headers;
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const protocolo = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  return `${protocolo}://${host}`;
}

/** O servidor de autorização: o OAuth 2.1 do Supabase (specs/12). */
export const EMISSOR = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1`;

/** Metadados do recurso protegido (RFC 9728) — o que o Claude lê para achar o login. */
export function metadadosDoRecurso(origem: string) {
  return {
    resource: `${origem}/api/mcp`,
    authorization_servers: [EMISSOR],
    bearer_methods_supported: ['header'],
    resource_name: 'Lure Capital',
  };
}
