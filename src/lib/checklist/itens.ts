/**
 * Checklist de documentos do cliente (specs/18-checklist-documentos.md).
 *
 * Regras puras — sem banco e sem rede (`itens.test.ts`): a lista padrão, a
 * ordem dos status e a varredura que reconhece um item pelo caminho do
 * arquivo no Drive ("Contábil/2023/Balanço patrimonial.pdf").
 */

export const STATUS = ['nao_recebido', 'recebido', 'parcial', 'nao_se_aplica'] as const;
export type StatusDoItem = (typeof STATUS)[number];

export const ROTULO_DO_STATUS: Record<StatusDoItem, string> = {
  nao_recebido: 'Não recebido',
  recebido: 'Recebido',
  parcial: 'Recebido parcial',
  nao_se_aplica: 'Não se aplica',
};

/** O clique anda nesta ordem e volta ao começo. */
export function proximoStatus(atual: StatusDoItem): StatusDoItem {
  return STATUS[(STATUS.indexOf(atual) + 1) % STATUS.length];
}

/**
 * Como a varredura reconhece um item: basta UMA das alternativas; numa
 * alternativa, TODOS os grupos precisam aparecer; num grupo, qualquer termo.
 * Termos já vêm normalizados (sem acento, minúsculos). Ano de 4 dígitos casa
 * só como número inteiro ("2023", não "20231").
 */
type Regra = string[][][];

export interface ItemPadrao {
  chave: string;
  titulo: string;
  regra: Regra;
}

const BP = ['bp', 'balanco patrimonial', 'balanco', 'balancos'];
const DRE = ['dre', 'demonstracao do resultado', 'demonstracao de resultado', 'demonstrativo de resultado'];
const FATURAMENTO = ['faturamento', 'faturamentos'];

const anual = (prefixo: string, titulo: string, termos: string[], anos: number[]): ItemPadrao[] =>
  anos.map((ano) => ({ chave: `${prefixo}-${ano}`, titulo: `${titulo} ${ano}`, regra: [[termos, [String(ano)]]] }));

export const ITENS_PADRAO: ItemPadrao[] = [
  ...anual('bp', 'BP', BP, [2023, 2024, 2025]),
  { chave: 'balancete-2026', titulo: 'Balancete 2026', regra: [[['balancete', 'balancetes'], ['2026']]] },
  ...anual('dre', 'DRE', DRE, [2023, 2024, 2025, 2026]),
  ...anual('faturamento', 'Faturamento mensal', FATURAMENTO, [2023, 2024, 2025, 2026]),
  {
    chave: 'contrato-social',
    titulo: 'Contrato social consolidado atualizado',
    regra: [[['contrato social', 'alteracao contratual', 'consolidacao contratual', 'estatuto social']]],
  },
  {
    chave: 'auditoria',
    titulo: 'Relatório da Auditoria (caso seja auditado)',
    regra: [[['auditoria', 'auditado', 'auditados', 'auditor', 'auditores']]],
  },
  {
    chave: 'irpf-socios',
    titulo: 'Declaração de IRPF dos sócios',
    regra: [[['irpf', 'dirpf', 'imposto de renda']]],
  },
  {
    chave: 'organograma',
    titulo: 'Organograma Societário',
    regra: [[['organograma', 'estrutura societaria']]],
  },
  {
    chave: 'apresentacao',
    titulo: 'Apresentação Institucional ou um resumo das atividades',
    regra: [[['apresentacao institucional', 'institucional', 'resumo das atividades', 'book']]],
  },
  {
    chave: 'endividamento',
    titulo:
      'Relação de endividamento contendo credor, montante tomado, saldo devedor, prazo, PMT, garantia e taxa de juros.',
    regra: [[['endividamento', 'endividamentos', 'divida', 'dividas', 'passivo bancario']]],
  },
  {
    chave: 'aging',
    titulo:
      'Aging da carteira - histórico de recebimento de clientes contendo data de vencimento e data de liquidação (a fim de identificar média de inadimplência).',
    regra: [[['aging', 'inadimplencia', 'historico de recebimento', 'historico de recebimentos']]],
  },
  {
    chave: 'abc-clientes',
    titulo: 'Curva ABC de clientes',
    regra: [[['abc'], ['cliente', 'clientes']]],
  },
  {
    chave: 'abc-fornecedores',
    titulo: 'Curva ABC de fornecedores',
    regra: [[['abc'], ['fornecedor', 'fornecedores']]],
  },
  {
    chave: 'matricula-garantias',
    titulo: 'Matrícula das Garantias',
    regra: [[['matricula', 'matriculas']]],
  },
  {
    chave: 'avaliacao-garantias',
    titulo: 'Avaliação das Garantias',
    regra: [[['laudo', 'laudos']], [['avaliacao', 'avaliacoes'], ['garantia', 'garantias', 'imovel', 'imoveis']]],
  },
];

const PADRAO_POR_CHAVE = new Map(ITENS_PADRAO.map((i) => [i.chave, i]));
export const itemPadrao = (chave: string) => PADRAO_POR_CHAVE.get(chave) ?? null;

/* -------------------------------------------------------------- varredura -- */

/** Sem acento, minúsculo, só letras e números separados por um espaço. */
export function normalizar(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function temTermo(texto: string, termo: string) {
  if (/^\d{4}$/.test(termo)) return new RegExp(`(^|\\D)${termo}(\\D|$)`).test(texto);
  return ` ${texto} `.includes(` ${termo} `);
}

export function casa(regra: Regra, caminho: string) {
  const texto = normalizar(caminho);
  return regra.some((alternativa) => alternativa.every((grupo) => grupo.some((termo) => temTermo(texto, termo))));
}

const PALAVRAS_VAZIAS = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'a', 'o', 'as', 'os', 'para', 'com', 'ou']);

/**
 * Item extra (título livre): todas as palavras com conteúdo do título
 * precisam estar no caminho. Sem palavra útil, nunca casa.
 */
export function regraDoTitulo(titulo: string): Regra {
  const palavras = normalizar(titulo)
    .split(' ')
    .filter((p) => p.length >= 3 && !PALAVRAS_VAZIAS.has(p));
  return palavras.length ? [palavras.map((p) => [p])] : [];
}

export interface ArquivoVarrido {
  id: string;
  nome: string;
  /** Caminho a partir da pasta do cliente, com o nome do arquivo no fim. */
  caminho: string;
}

/** Os arquivos que comprovam o item, na ordem em que vieram. */
export function arquivosDoItem(regra: Regra, arquivos: ArquivoVarrido[]) {
  return regra.length ? arquivos.filter((a) => casa(regra, a.caminho)) : [];
}

/* ------------------------------------------------------------ composição -- */

export interface LinhaGravada {
  id: string;
  chave: string | null;
  titulo: string | null;
  status: StatusDoItem | null;
  origem: 'app' | 'mcp';
  observacao: string | null;
  criado_em: string;
}

export interface ItemDaChecklist {
  /** `chave` do item padrão, ou o id da linha do item extra. */
  ref: string;
  titulo: string;
  extra: boolean;
  status: StatusDoItem;
  /** De onde veio o status: marcado à mão (app/Claude), achado no Drive, ou nada. */
  fonte: 'app' | 'mcp' | 'drive' | 'nenhuma';
  observacao: string | null;
  arquivos: ArquivoVarrido[];
}

/**
 * Junta os itens padrão, os extras e a varredura. Marcação à mão ganha
 * sempre; sem ela, achou arquivo é "recebido". `arquivos` nulo = não deu
 * para varrer (Drive fora ou sem pasta): fica só o que foi marcado à mão.
 */
export function montarChecklist(linhas: LinhaGravada[], arquivos: ArquivoVarrido[] | null): ItemDaChecklist[] {
  const porChave = new Map(linhas.filter((l) => l.chave).map((l) => [l.chave as string, l]));
  const extras = linhas.filter((l) => l.titulo).sort((a, b) => a.criado_em.localeCompare(b.criado_em));

  const compor = (ref: string, titulo: string, extra: boolean, regra: Regra, linha?: LinhaGravada): ItemDaChecklist => {
    const achados = arquivos ? arquivosDoItem(regra, arquivos).slice(0, 5) : [];
    const manual = linha?.status ?? null;
    return {
      ref,
      titulo,
      extra,
      status: manual ?? (achados.length ? 'recebido' : 'nao_recebido'),
      fonte: manual && linha ? linha.origem : achados.length ? 'drive' : 'nenhuma',
      observacao: linha?.observacao ?? null,
      arquivos: achados,
    };
  };

  return [
    ...ITENS_PADRAO.map((i) => compor(i.chave, i.titulo, false, i.regra, porChave.get(i.chave))),
    ...extras.map((l) => compor(l.id, l.titulo as string, true, regraDoTitulo(l.titulo as string), l)),
  ];
}
