/**
 * Regras puras das ferramentas de escrita do MCP (specs/12-mcp-e-readai.md).
 * Sem banco e sem rede — `regras.test.ts`.
 */

export const CAMPOS_DO_CARTAO = ['empresa', 'contato', 'segmento', 'faturamento', 'indicante', 'parecer'] as const;
export type CampoDoCartao = (typeof CAMPOS_DO_CARTAO)[number];

const vazio = (v: unknown) => v === null || v === undefined || String(v).trim() === '';

/**
 * O que gravar num `atualizar_cartao`. Sem `sobrescrever`, campo que já tem
 * valor fica como está — quem preencheu à mão ganha do Claude. Devolve também
 * o que foi deixado de lado, para o Claude poder dizer isso à pessoa.
 */
export function mesclarCampos(
  atual: Partial<Record<CampoDoCartao, string | null>>,
  pedido: Partial<Record<CampoDoCartao, string | undefined>>,
  sobrescrever: boolean,
) {
  const gravar: Partial<Record<CampoDoCartao, string>> = {};
  const mantidos: CampoDoCartao[] = [];

  for (const campo of CAMPOS_DO_CARTAO) {
    const novo = pedido[campo];
    if (vazio(novo)) continue;
    if (!sobrescrever && !vazio(atual[campo]) && atual[campo] !== novo) {
      mantidos.push(campo);
      continue;
    }
    gravar[campo] = (novo as string).trim();
  }
  return { gravar, mantidos };
}

/** `dd/mm/aaaa` no fuso de São Paulo — é a data que a equipe lê. */
export function dataCurta(agora: Date) {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' }).format(agora);
}

/**
 * Acrescenta uma anotação ao histórico do cartão, com data e autor, sem
 * apagar nada do que havia. Anotação nova vai no fim, como o histórico do
 * Bubble era escrito.
 */
export function acrescentarAoHistorico(historico: string | null, texto: string, autor: string, agora: Date) {
  const nota = `[${dataCurta(agora)} — ${autor}] ${texto.trim()}`;
  return historico && historico.trim() ? `${historico.trimEnd()}\n\n${nota}` : nota;
}

/**
 * Texto de busca vai dentro de um filtro `or=(…)` do PostgREST, onde vírgula
 * e parênteses são sintaxe. Tira esses caracteres e os curingas, para a busca
 * ser sempre "contém este trecho".
 */
export function termoDeBusca(termo: string | undefined | null) {
  const limpo = (termo ?? '').replace(/[,()%*\\]/g, ' ').replace(/\s+/g, ' ').trim();
  return limpo === '' ? null : limpo;
}

/** Nome de coluna do funil comparado sem caixa e sem acento. */
export function mesmoNome(a: string, b: string) {
  const n = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().toLowerCase();
  return n(a) === n(b);
}
