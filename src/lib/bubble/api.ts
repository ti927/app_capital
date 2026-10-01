/**
 * Leitura da Data API do Bubble — paginada de 100 em 100.
 *
 * Usado por `scripts/extrair-bubble.mjs` e pela sincronização. Só função
 * pura de rede: a chave entra por parâmetro, quem chama decide de onde ela
 * vem (o `.env` no script, `process.env` no servidor). Nunca no navegador.
 */

/** Live e version-test são bancos separados no Bubble (scripts/extrair-bubble.mjs). */
export type RaizBubble = 'live' | 'version-test';

export const urlDaRaiz = (app: string, raiz: RaizBubble): string =>
  raiz === 'live' ? app : `${app}/version-test`;

export type ResultadoBusca =
  | { ok: true; linhas: Array<Record<string, unknown>> }
  | { ok: false; status: number };

/**
 * Todos os registros de um data type. `ok: false` quando o Bubble responde
 * erro — 404 é o tipo que não foi exposto na Data API daquela raiz.
 */
export async function buscarTipo(
  url: string,
  chave: string,
  tipo: string,
  buscar: typeof fetch = fetch,
): Promise<ResultadoBusca> {
  const linhas: Array<Record<string, unknown>> = [];
  let cursor = 0;
  for (;;) {
    const r = await buscar(`${url}/api/1.1/obj/${tipo}?limit=100&cursor=${cursor}`, {
      headers: { Authorization: `Bearer ${chave}` },
      cache: 'no-store',
    });
    if (!r.ok) return { ok: false, status: r.status };
    const { response } = (await r.json()) as {
      response: { results: Array<Record<string, unknown>>; remaining: number; count: number };
    };
    linhas.push(...response.results);
    if (response.remaining === 0 || response.count === 0) return { ok: true, linhas };
    cursor += response.count;
  }
}
