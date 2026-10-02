import { metadadosDoRecurso, origemDe } from '@/lib/mcp/origem';

/** RFC 9728 — onde o Claude acha o servidor de login do MCP (specs/12). */
export function GET(req: Request) {
  return Response.json(metadadosDoRecurso(origemDe(req)), {
    headers: { 'Access-Control-Allow-Origin': '*' },
  });
}
