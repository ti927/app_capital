/**
 * Regras puras das ferramentas de master do MCP (specs/12-mcp-e-readai.md,
 * seção "Acesso total do master"). Sem banco e sem rede — `regras-master.test.ts`.
 */

/**
 * O que `consultar` lê. Tudo menos `google_conexao` (tokens do Google, fechada
 * até para master no app) — a RLS ainda recorta cada leitura.
 */
export const TABELAS_DE_LEITURA = [
  'cliente',
  'cliente_email',
  'cliente_visualizador',
  'fornecedor',
  'fornecedor_tipo_operacao',
  'operacao',
  'operacao_declinio',
  'operacao_observacao',
  'etapa_operacao',
  'etapa_checklist_item',
  'etapa_instrumento',
  'etapa_observacao',
  'funil_quadro',
  'funil_etapa',
  'funil_cartao',
  'funil_cartao_tag',
  'funil_cartao_usuario',
  'funil_tag',
  'funil_tarefa',
  'funil_tarefa_usuario',
  'perfil',
  'evento',
  'status_operacao',
  'status_etapa',
  'tipo_operacao',
  'formulario_resposta',
  'formulario_resposta_item',
] as const;
export type TabelaDeLeitura = (typeof TABELAS_DE_LEITURA)[number];

/**
 * Chave de cada tabela que `gravar` e `excluir` aceitam. `id` simples, ou as
 * colunas da chave composta das tabelas de vínculo. De fora, de propósito:
 * `perfil` (tem ferramentas próprias, que criam a conta junto), `evento` (log,
 * só leitura), `google_conexao`, as tabelas de apoio (status e tipos) e
 * `funil_quadro`.
 */
export const CHAVES_DE_ESCRITA = {
  cliente: ['id'],
  cliente_email: ['id'],
  cliente_visualizador: ['cliente_id', 'perfil_id'],
  fornecedor: ['id'],
  fornecedor_tipo_operacao: ['fornecedor_id', 'tipo_operacao_id', 'papel'],
  operacao: ['id'],
  operacao_declinio: ['operacao_id', 'fornecedor_id'],
  operacao_observacao: ['id'],
  etapa_operacao: ['id'],
  etapa_checklist_item: ['id'],
  etapa_instrumento: ['etapa_id', 'tipo_operacao_id'],
  etapa_observacao: ['id'],
  funil_etapa: ['id'],
  funil_cartao: ['id'],
  funil_cartao_tag: ['cartao_id', 'tag_id'],
  funil_cartao_usuario: ['cartao_id', 'perfil_id'],
  funil_tag: ['id'],
  funil_tarefa: ['id'],
  funil_tarefa_usuario: ['tarefa_id', 'perfil_id'],
} as const satisfies Record<string, readonly string[]>;
export type TabelaDeEscrita = keyof typeof CHAVES_DE_ESCRITA;
export const TABELAS_DE_ESCRITA = Object.keys(CHAVES_DE_ESCRITA) as [TabelaDeEscrita, ...TabelaDeEscrita[]];

/** Colunas que o banco cuida sozinho: o Claude não grava. */
const COLUNAS_DO_BANCO = new Set(['id', 'criado_em', 'atualizado_em', 'bubble_id', 'origem_bubble']);

const NOME = /^[a-z_][a-z0-9_]*$/;

/** Nome de coluna seguro para ir num filtro ou num `order` do PostgREST. */
export function colunaValida(nome: string) {
  return NOME.test(nome);
}

/**
 * O `select` do PostgREST: colunas, `*`, e tabela ligada entre parênteses
 * (`cliente(nome_razao)`). Nada de aspas, operador ou vírgula sobrando.
 */
export function selecaoValida(selecao: string) {
  return /^[a-z0-9_*,() :!]+$/.test(selecao) && !/,\s*,|^\s*,|,\s*$/.test(selecao);
}

/**
 * Os campos de um `gravar`: tira o que o banco cuida e recusa nome de coluna
 * esquisito. Devolve os campos limpos e os nomes recusados.
 */
export function limparCampos(campos: Record<string, unknown>) {
  const limpos: Record<string, unknown> = {};
  const recusados: string[] = [];
  for (const [k, v] of Object.entries(campos)) {
    if (!colunaValida(k) || COLUNAS_DO_BANCO.has(k)) recusados.push(k);
    else limpos[k] = v;
  }
  return { limpos, recusados };
}

/**
 * A chave completa de um registro para `excluir`: todas as colunas da chave,
 * nenhuma a mais. Devolve o que falta e o que sobra.
 */
export function chaveCompleta(tabela: TabelaDeEscrita, chave: Record<string, unknown>) {
  const colunas = CHAVES_DE_ESCRITA[tabela] as readonly string[];
  const faltam = colunas.filter((c) => chave[c] === undefined || chave[c] === null || chave[c] === '');
  const sobram = Object.keys(chave).filter((c) => !colunas.includes(c));
  return { ok: faltam.length === 0 && sobram.length === 0, faltam, sobram };
}

/** E-mail como o Supabase guarda: sem espaços, minúsculo. */
export function emailNormalizado(email: string) {
  return email.trim().toLowerCase();
}
