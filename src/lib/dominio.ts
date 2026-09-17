/**
 * Tipos de domínio e as tabelas de apoio, espelhando db/002_dominio.sql.
 */

export type NivelAcesso = 'master' | 'indicante';

export interface Perfil {
  id: string;
  nome: string;
  email: string;
  nivel_acesso: NivelAcesso;
  ativo: boolean;
}

export interface Cliente {
  id: string;
  nome_razao: string;
  cnpj: string | null;
  cidade: string | null;
  telefone: string | null;
  email: string | null;
  atividade_cia: string | null;
  diretor_gerente: string | null;
  faturamento_anual: string | null;
  estimativa_faturamento: string | null;
  margem_liquida: string | null;
  passivo_oneroso: string | null;
  ativos: string | null;
  demanda: string | null;
  info_adicionais: string | null;
  parecer: string | null;
  status: string | null;
  quem_indicou: string | null;
  arquivado: boolean;
}

export interface Fornecedor {
  id: string;
  nome_fundo: string;
  contato: string | null;
  email: string | null;
  numero: string | null;
  cidade: string | null;
  pf_ou_pj: string | null;
  status: string | null;
  segmento_foco: string | null;
  segmento_nao_atua: string | null;
  operacao_minima: string | null;
  faturamento_minimo: string | null;
  fee: string | null;
  parecer: string | null;
  link_indicacao: string | null;
  arquivado: boolean;
}

export interface Operacao {
  id: string;
  identificador: string | null;
  cliente_id: string | null;
  status_operacao_id: number | null;
  demanda_inicial: string | null;
  demanda_final: string | null;
  destino_recurso: string | null;
  faturamento_anual: string | null;
  garantias_sugeridas: string | null;
  limites_fundos_assinados: string | null;
  prazo: string | null;
  carencia: string | null;
  pmts: string | null;
  comissao: string | null;
  parecer: string | null;
  tem_fee: boolean;
  nda_assinado: boolean;
  mandato_assinado: boolean;
  mandato_assinado_fornecedor: boolean;
  estruturacao_em_andamento: boolean;
  arquivado: boolean;
}

export interface EtapaOperacao {
  id: string;
  operacao_id: string;
  cliente_id: string | null;
  fornecedor_id: string | null;
  status_id: number | null;
  tipo_operacao_id: number | null;
  na_mao_de: string | null;
  dt_inicio: string | null;
  volume: string | null;
  administrador: string | null;
  assessoria_legal: string | null;
  gestor: string | null;
  atualizado_em: string;
}

export interface TabelaApoio {
  id: number;
  chave: string;
  rotulo: string;
  ordem: number;
}

export interface FunilCartao {
  id: string;
  quadro_id: string;
  etapa_id: string | null;
  empresa: string;
  contato: string | null;
  segmento: string | null;
  faturamento: string | null;
  indicante: string | null;
  parecer: string | null;
  historico: string | null;
  ordem: number;
  data_kb: string | null;
  data_call: string | null;
  arquivado: boolean;
  atualizado_em: string;
}

/* ---------------------------------------------------------------------------
   Status da etapa: os 14 valores caem em 7 grupos de cor.
   Os grupos e os tokens vêm de design/design-system/tokens.json.
   --------------------------------------------------------------------------- */

export type GrupoStatus =
  | 'inicio'
  | 'em-curso'
  | 'avanco'
  | 'fechado'
  | 'terminal-neutro'
  | 'pausado'
  | 'terminal-negativo';

const GRUPO_POR_CHAVE: Record<string, GrupoStatus> = {
  aguardando_interesse: 'inicio',
  teaser_enviado: 'inicio',
  documentacao_inicial_enviada: 'em-curso',
  docs_requeridos: 'em-curso',
  operacao_em_analise: 'em-curso',
  proposta_feita: 'em-curso',
  em_estudo: 'em-curso',
  operacao_aprovada: 'avanco',
  contrato_enviado: 'avanco',
  contrato_assinado: 'fechado',
  ja_cliente_do_fundo: 'terminal-neutro',
  paralisado: 'pausado',
  declinado_pelo_fundo: 'terminal-negativo',
  declinado_pelo_cliente: 'terminal-negativo',
};

/** Token de cor do chip para um status de etapa, pela chave. */
export function tokenDoStatus(chave: string | null | undefined): string {
  const grupo = chave ? GRUPO_POR_CHAVE[chave] : undefined;
  return `st-etapa-${grupo ?? 'inicio'}`;
}

/* --- opções de status que são texto livre no banco ------------------------- */

export const STATUS_CLIENTE = [
  'contato inicial',
  'mandato-nda em negociação',
  'mandato assinado com fee',
  'mandato assinado sem fee',
] as const;

export const STATUS_FORNECEDOR = [
  'contato inicial',
  'contrato-nda em negociação',
  'contrato-nda assinado com fee',
  'nda assinado sem fee',
] as const;

/* --- formatação ------------------------------------------------------------ */

/** `dd/mm/aaaa`. Entrada nula devolve string vazia. */
export function data(valor: string | null | undefined): string {
  if (!valor) return '';
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

/** `dd/mm`, usado na coluna "Alterado em:" da tabela de etapas. */
export function dataCurta(valor: string | null | undefined): string {
  if (!valor) return '';
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' });
}
