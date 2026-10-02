import { metadadosDoRecurso, origemDe } from '@/lib/mcp/origem';

/**
 * A mesma descoberta, no caminho com o sufixo do recurso — é o que o
 * `WWW-Authenticate` de `/api/mcp` aponta, e o que clientes novos tentam primeiro.
 */
export function GET(req: Request) {
  return Response.json(metadadosDoRecurso(origemDe(req)), {
    headers: { 'Access-Control-Allow-Origin': '*' },
  });
}
