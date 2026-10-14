/**
 * Ordem dos campos do pop-up de operação — a mesma nas duas UIs (pedido de
 * 14/10/2026: os pares Cliente | Identificador, Faturamento anual | Status,
 * Demanda | Prazo, Garantias | Carência, e Destino do recurso sozinho). Ver
 * `clientes/campos.ts` e `ordem-dos-campos.test.ts`.
 *
 * PMTS, Comissão e Demanda final não aparecem em nenhuma das duas. O
 * interruptor "Estruturação em Andamento" mora no rodapé, fora desta lista.
 */
export const CAMPOS_OPERACAO = [
  'cliente_id',
  'identificador',
  'faturamento_anual',
  'status_operacao_id',
  'demanda_inicial',
  'prazo',
  'garantias_sugeridas',
  'carencia',
  'destino_recurso',
  'parecer_cliente',
  'parecer',
  'tem_fee',
  'nda_assinado',
  'mandato_assinado',
  'mandato_assinado_fornecedor',
  'declinios',
  'limites_fundos_assinados',
] as const;

/** Saíram da tela em 14/10/2026; a coluna e o dado ficam. */
export const CAMPOS_FORA_DA_TELA = ['pmts', 'comissao', 'demanda_final'] as const;
