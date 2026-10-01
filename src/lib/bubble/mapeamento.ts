/**
 * De-para do Bubble para as tabelas daqui — uma fonte só.
 *
 * Usado por `scripts/carregar-supabase.mjs` (a carga completa, que roda pelo
 * terminal) e por `src/lib/bubble/sincronizar.ts` (o botão de sincronização,
 * que só coleta cadastros novos). Antes de existir este arquivo o de-para
 * morava dentro do script; copiá-lo para o botão seria abrir a porta para os
 * dois divergirem — e o dia em que a carga aprende um campo novo, o botão
 * continuaria descartando-o em silêncio. Ver specs/10-sincronizacao-bubble.md.
 *
 * Só funções puras e só sintaxe que o Node apaga (sem enum, sem namespace):
 * o script `.mjs` importa este `.ts` direto, com o type stripping do Node.
 * Por isso também os imports levam a extensão `.ts` e nada vem de `@/`.
 *
 * Cada função devolve um objeto `coluna → valor`. A ordem das chaves é a
 * ordem das colunas, e o script monta o INSERT a partir dela.
 */

/** Registro como vem da Data API do Bubble: chave é o nome do campo lá. */
export type RegistroBubble = Record<string, unknown>;

/** Linha pronta para inserir: chave é o nome da coluna aqui. */
export type Linha = Record<string, unknown>;

/** rótulo/id do Bubble → id daqui. */
export type Mapa<V = string> = Map<string, V>;

/** As tabelas de apoio que o de-para consulta por rótulo. */
export interface Catalogos {
  tipoOp: Mapa<number>;
  statusOp: Mapa<number>;
  statusEtapa: Mapa<number>;
}

/* --------------------------------------------------------------- primitivos */

/** Texto aparado, ou nulo para o que vem vazio. */
export const txt = (v: unknown): string | null =>
  v === undefined || v === null || v === '' ? null : String(v).trim();

/** Só `true` de verdade liga; o Bubble omite o campo que nunca foi marcado. */
export const bool = (v: unknown): boolean => v === true;

/** Lista de valores do Bubble (o campo some quando a lista está vazia). */
export const lista = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : []);

/** Data do Bubble (ISO) ou nulo. */
export const data = (v: unknown): Date | null => (v ? new Date(String(v)) : null);

/** `Created Date` do Bubble; na falta, agora. */
const criadoEm = (r: RegistroBubble): string | Date =>
  (r['Created Date'] as string | undefined) ?? new Date();

/** O `_id` do Bubble, que aqui vira `bubble_id`. */
export const bubbleId = (r: RegistroBubble): string => String(r._id);

/* --------------------------------------------------------------- fornecedor */

export function fornecedor(f: RegistroBubble): Linha {
  return {
    bubble_id: bubbleId(f),
    nome_fundo: txt(f['nome do fundo']) ?? '(sem nome)',
    contato: txt(f.contato),
    email: txt(f['email fornecedor']),
    numero: txt(f.numero),
    cidade: txt(f['cidade fornecedor']),
    pf_ou_pj: txt(f['PF ou PJ']),
    status: txt(f['status ']),
    segmento_foco: txt(f['segmento foco']),
    segmento_nao_atua: txt(f['segmento que não atua']),
    operacao_minima: txt(f['operação mínima']),
    faturamento_minimo: txt(f['faturamento minimo']),
    fee: txt(f.Fee),
    parecer: txt(f['parecer fornecedor']),
    link_indicacao: txt(f['link de indicação']),
    arquivado: bool(f.arquivado),
    criado_em: criadoEm(f),
  };
}

const PAPEIS_FORNECEDOR: Array<[string, string]> = [
  ['1°Linha', 'linha_1'],
  ['2°Linha', 'linha_2'],
  ['tipos de operações', 'atende'],
  ['tipos de operações não atendidas', 'nao_atende'],
];

/** Vínculos fornecedor × tipo de operação (sem `fornecedor_id`, que é de quem chama). */
export function fornecedorTipos(
  f: RegistroBubble,
  tipoOp: Mapa<number>,
  avisos: string[],
): Array<{ tipo_operacao_id: number; papel: string }> {
  const saida: Array<{ tipo_operacao_id: number; papel: string }> = [];
  for (const [campo, papel] of PAPEIS_FORNECEDOR) {
    for (const rotulo of lista(f[campo])) {
      const t = tipoOp.get(rotulo);
      if (t === undefined) {
        avisos.push(`tipo de operacao desconhecido em fornecedor: ${rotulo}`);
        continue;
      }
      saida.push({ tipo_operacao_id: t, papel });
    }
  }
  return saida;
}

/* ------------------------------------------------------------------ cliente */

/**
 * `criado_por` fica de fora de propósito: db/008 decidiu que cliente vindo do
 * Bubble não tem autor daqui. Quem enxerga vem de `cliente_visualizador`.
 */
export function cliente(cl: RegistroBubble): Linha {
  return {
    bubble_id: bubbleId(cl),
    nome_razao: txt(cl['nome/razão']) ?? '(sem nome)',
    cnpj: txt(cl.CNPJ),
    cidade: txt(cl.cidade),
    telefone: txt(cl.telefone),
    email: txt(cl.emailcliente),
    atividade_cia: txt(cl['ativiade da CIA']),
    diretor_gerente: txt(cl['diretor/gerente']),
    faturamento_anual: txt(cl['faturamento anual']),
    estimativa_faturamento: txt(cl['estimativa de faturamento']),
    margem_liquida: txt(cl['margem líquida']),
    passivo_oneroso: txt(cl['passivo oneroso']),
    ativos: txt(cl.ativos),
    demanda: txt(cl.demanda),
    info_adicionais: txt(cl['info adicionais']),
    parecer: txt(cl['parecer.cliente']),
    status: txt(cl['status cliente']),
    quem_indicou: txt(cl['quem indicou ']),
    arquivado: bool(cl.arquivado),
    criado_em: criadoEm(cl),
  };
}

/** `tbl_infocliente`: e-mail extra de um cliente. Nulo quando não serve. */
export function clienteEmail(
  i: RegistroBubble,
  clienteId: Mapa,
): { cliente_id: string; email: string } | null {
  const cid = clienteId.get(String(i.qualcliente));
  const email = txt(i.emailcliente);
  return cid && email ? { cliente_id: cid, email } : null;
}

/** Usuários do Bubble que enxergam o cliente (`quem visualiza`). */
export const quemVisualiza = (cl: RegistroBubble): string[] => lista(cl['quem visualiza']);

/* ----------------------------------------------------------------- operacao */

export function operacao(o: RegistroBubble, clienteId: Mapa, cat: Catalogos): Linha {
  return {
    bubble_id: bubbleId(o),
    identificador: txt(o.identificador),
    cliente_id: clienteId.get(String(o['qual cliente'])) ?? null,
    status_operacao_id: cat.statusOp.get(String(o['Status Atual da Operação'])) ?? null,
    demanda_inicial: txt(o['demanda inicial']),
    demanda_final: txt(o['demanda final']),
    destino_recurso: txt(o['destino do recurso']),
    faturamento_anual: txt(o['faturamento anual']),
    garantias_sugeridas: txt(o['garantias sugeridas']),
    limites_fundos_assinados: txt(o['limites/fundos assinados']),
    prazo: txt(o.prazo),
    carencia: txt(o['carência']),
    pmts: txt(o.PMTS),
    comissao: txt(o['comissão']),
    parecer: txt(o['parecer operação']),
    tem_fee: bool(o['fee (yes/no)']),
    nda_assinado: bool(o['nda assinado']),
    mandato_assinado: bool(o['mandato assinado']),
    mandato_assinado_fornecedor: bool(o.mandatoassinadofor),
    estruturacao_em_andamento: bool(o['Estruturação em Andamento']),
    arquivado: bool(o.arquivado),
    criado_em: criadoEm(o),
  };
}

/** Observações em lista dentro da própria operação (`observação `). */
export const operacaoObservacoes = (o: RegistroBubble): string[] =>
  lista(o['observação ']).map(txt).filter((t): t is string => t !== null);

/** Fornecedores que declinaram (ids daqui). */
export function operacaoDeclinios(
  o: RegistroBubble,
  fornecedorId: Mapa,
  avisos: string[],
): string[] {
  const saida: string[] = [];
  for (const fid of lista(o['declínios '])) {
    const f = fornecedorId.get(fid);
    if (!f) {
      avisos.push('declinio com fornecedor desconhecido');
      continue;
    }
    saida.push(f);
  }
  return saida;
}

/** `tbl_observa__es`: observação avulsa de uma operação. */
export function observacaoAvulsa(
  t: RegistroBubble,
  operacaoId: Mapa,
): { operacao_id: string; texto: string; criado_em: string | Date } | null {
  const oid = operacaoId.get(String(t['cpo.qualoperação']));
  const texto = txt(t['cpo.observação']);
  return oid && texto ? { operacao_id: oid, texto, criado_em: criadoEm(t) } : null;
}

/* -------------------------------------------------------------------- etapa */

/** Id da operação (no Bubble) a que a etapa pertence. */
export const operacaoDaEtapa = (e: RegistroBubble): string => String(e['qual operação etapa']);

/**
 * Os campos da esteira. `Admnistrador` e `Gesto ` estão assim no Bubble
 * mesmo — o primeiro com o erro de digitação, o segundo com espaço no fim.
 * Conferido chave por chave no JSON extraído; não "corrigir" os nomes.
 *
 * Dos treze, só quatro aparecem no retrato de 15/09/2026 (gestor,
 * administrador, assessoria legal, volume) e num único registro. Os outros
 * nove não existem como chave em nenhuma das 388 linhas: o Bubble omite
 * campo que nunca foi preenchido. Ficam mapeados assim mesmo — sem isso, o
 * dia em que alguém preencher DTVM no Bubble, uma nova carga descarta o
 * valor em silêncio. Foi o que já acontecia até 21/09/2026.
 */
export function etapa(
  e: RegistroBubble,
  operacaoId: string,
  ids: { clienteId: Mapa; fornecedorId: Mapa },
  cat: Catalogos,
): Linha {
  return {
    bubble_id: bubbleId(e),
    operacao_id: operacaoId,
    cliente_id: ids.clienteId.get(String(e['qual cliente'])) ?? null,
    fornecedor_id: ids.fornecedorId.get(String(e['fundo etapa'])) ?? null,
    status_id: cat.statusEtapa.get(String(e['status etapa'])) ?? null,
    tipo_operacao_id: cat.tipoOp.get(String(e['tipo operação etapa'])) ?? null,
    na_mao_de: txt(e['na mão de etapa']),
    dt_inicio: data(e.DtInicio),
    volume: txt(e.volume),
    administrador: txt(e.Admnistrador),
    assessoria_legal: txt(e.AssessoriaLegal),
    gestor: txt(e['Gesto ']),
    dtvm: txt(e.DTVM),
    securitizadora: txt(e.securitizadora),
    agente_fiduciario: txt(e.AgenteFiduciario),
    custodiante: txt(e.Custodiante),
    emissor: txt(e.Emissor),
    estruturador: txt(e.Estruturador),
    demais: txt(e.Demais),
    ts_assinado: e.TsAssinado === true,
    op_de_pe: e.Opdepe === true,
    fee_recebido: e.FeeRecebido === true,
    criado_em: criadoEm(e),
  };
}

/** Instrumentos da etapa (ids de tipo de operação). */
export function etapaInstrumentos(e: RegistroBubble, tipoOp: Mapa<number>, avisos: string[]): number[] {
  const saida: number[] = [];
  for (const rotulo of lista(e.instrumento)) {
    const t = tipoOp.get(rotulo);
    if (t === undefined) {
      avisos.push(`instrumento desconhecido: ${rotulo}`);
      continue;
    }
    saida.push(t);
  }
  return saida;
}

const ITENS: Array<[string, string | null, string, string, number]> = [
  ['integralizacao_sub', 'Integralização de cota sub', 'IntegralizaçãoSubDesc', 'IntegralizaçãoSubValue', 1],
  ['int_senior', 'Integralização de cotas senior e mezo', 'IntSeniorDesc', 'IntSeniorValue', 2],
  ['inc_dc', 'Inclusão de DC', 'INcDCDesc', 'IncDCValue', 3],
  ['cmp1', null, 'Cmp1Desc', 'Cmp1Value', 4],
  ['cmp2', null, 'Cmp2Desc', 'Cmp2Value', 5],
  ['cmp3', null, 'Cmp3Desc', 'Cmp3Value', 6],
  ['cmp4', null, 'Cmp4Desc', 'Cmp4Value', 7],
  ['regulamento', 'Regulamento', 'RegulamentoDesc', 'RegulamentoValue', 8],
  ['arquivos', 'Arquivos de Remessa e Retorno', 'ArquivosDesc', 'ArquivosValue', 9],
  ['contrato_cessao', 'Contrato de Cessão', 'CnrtdeCessãoDesc', 'ContratoDeCessãoValue', 10],
  ['contrato_cobranca', 'Contrato de Cobrança', 'ContratoCobrançaDesc', 'ContratoCobrançaValue', 11],
];

/** Itens de checklist preenchidos na etapa (sem `etapa_id`). */
export function etapaChecklist(e: RegistroBubble): Linha[] {
  const saida: Linha[] = [];
  for (const [chave, rotuloFixo, campoDesc, campoValor, ordem] of ITENS) {
    const descricao = txt(e[campoDesc]);
    const valor = e[campoValor];
    if (descricao === null && (valor === undefined || valor === null)) continue;
    const rotulo = rotuloFixo ?? txt(e['nomeCmp' + chave.slice(3)]) ?? `Campo ${chave.slice(3)}`;
    saida.push({ chave, rotulo, descricao, valor: valor ?? null, ordem });
  }
  return saida;
}

/* -------------------------------------------------------------------- funil */

/** Nomes de quadro citados por cartões, etapas e tags do funil. */
export function quadrosDoFunil(...listas: RegistroBubble[][]): string[] {
  const nomes = new Set<string>();
  for (const l of listas) for (const o of l) if (o.Quadro) nomes.add(String(o.Quadro));
  return [...nomes];
}

const quadroDe = (o: RegistroBubble, quadroId: Mapa, padrao: string | null) =>
  quadroId.get(String(o.Quadro)) ?? padrao;

export function funilEtapa(e: RegistroBubble, quadroId: Mapa, padrao: string | null): Linha {
  return {
    bubble_id: bubbleId(e),
    quadro_id: quadroDe(e, quadroId, padrao),
    nome: txt(e.NomeEtapa) ?? '(sem nome)',
    ordem: (e.Ordem as number | undefined) ?? 0,
    no_fluxo: e.NoFluxo !== false,
  };
}

export function funilTag(t: RegistroBubble, quadroId: Mapa, padrao: string | null): Linha {
  return {
    bubble_id: bubbleId(t),
    quadro_id: quadroDe(t, quadroId, padrao),
    nome: txt(t.NomeTag) ?? '(sem nome)',
    cor: txt(t.CorTag),
    ativo: t.Ativo !== false,
  };
}

export function funilCartao(
  k: RegistroBubble,
  quadroId: Mapa,
  padrao: string | null,
  etapaFunilId: Mapa,
): Linha {
  return {
    bubble_id: bubbleId(k),
    quadro_id: quadroDe(k, quadroId, padrao),
    etapa_id: etapaFunilId.get(String(k.QualEtapa)) ?? null,
    empresa: txt(k.Empresa) ?? '(sem empresa)',
    contato: txt(k.Contato),
    segmento: txt(k.Segmento),
    faturamento: txt(k.Faturamento),
    indicante: txt(k.Indicante),
    parecer: txt(k.Parecer),
    historico: txt(k.Historico),
    ordem: (k.Ordem as number | undefined) ?? 0,
    data_kb: data(k.DataKB),
    data_call: data(k.DataCall),
    arquivado: k.Arquivado === true,
    criado_em: criadoEm(k),
  };
}

/** Tags do cartão (ids daqui); tag desconhecida é ignorada, como na carga. */
export const funilCartaoTags = (k: RegistroBubble, tagId: Mapa): string[] =>
  lista(k.QuaisTags)
    .map((t) => tagId.get(t))
    .filter((t): t is string => t !== undefined);

/** Usuários do Bubble ligados ao cartão. */
export const usuariosDoCartao = (k: RegistroBubble): string[] => lista(k.Usuarios);

/* --------------------------------------------------------------- usuários */

/** E-mail de um `user` do Bubble, em minúsculas. É a ponte com `perfil`. */
export const emailDoUsuario = (u: RegistroBubble): string | null => {
  const autenticacao = u.authentication as { email?: { email?: string } } | undefined;
  return autenticacao?.email?.email?.toLowerCase() ?? null;
};
