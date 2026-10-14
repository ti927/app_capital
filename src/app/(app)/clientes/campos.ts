/**
 * Ordem dos campos do pop-up de cliente — a mesma nas duas UIs (clássica e
 * moderna). `ordem-dos-campos.test.ts` confere que os dois diálogos renderizam
 * estes `name=` nesta sequência: é a garantia de que quem troca de UI não se
 * perde. Mudou a ordem? Muda aqui e nos dois diálogos.
 */
export const CAMPOS_CLIENTE = [
  'nome_razao',
  'cnpj',
  'diretor_gerente',
  'cidade',
  'telefone',
  'atividade_cia',
  'faturamento_anual',
  'margem_liquida',
  'ativos',
  'passivo_oneroso',
  'quem_indicou',
  'quem_visualiza',
  'demanda',
  'estimativa_faturamento',
  'parecer',
  'status',
] as const;
