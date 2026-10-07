/**
 * Sincronização com o Bubble: **espelha o Bubble aqui**, em sentido único
 * (Bubble → app). Decisão de 07/10/2026, specs/10-sincronizacao-bubble.md.
 *
 *  - registro cujo `_id` já existe aqui em `bubble_id`: os campos mapeados são
 *    atualizados com o valor do Bubble ("o Bubble ganha"); o que não existe é
 *    inserido;
 *  - registro sem `bubble_id` (criado só aqui) nunca é tocado: todo o
 *    caminho parte dos `bubble_id` lidos, e a interface `Banco` só atualiza
 *    por `id` de linha que veio dessa leitura;
 *  - registro que sumiu do Bubble é **arquivado** (`arquivado = true`) nas
 *    tabelas que têm a coluna, e só se a leitura COMPLETA daquele data type
 *    terminou sem erro. Nunca é apagado;
 *  - filhos (e-mails, vínculos, observações, checklist...) de pais novos e
 *    antigos são reconciliados por pai: entra o que falta, e sai só o que
 *    veio do Bubble (`origem_bubble`, db/011) e deixou de existir lá;
 *  - data type que o Bubble não expõe (404) não derruba nada, não arquiva e
 *    não remove: fica listado em `naoExpostos`;
 *  - ordem de dependência: fornecedor → cliente → operação → etapa, e no
 *    funil quadro → etapa/tag → cartão.
 *
 * O de-para é o mesmo da carga (`mapeamento.ts`) — uma fonte só.
 *
 * Este arquivo não fala com Supabase nem com a rede: recebe um `Banco` e uma
 * `Fonte`. É isso que deixa testar a regra sem banco (sincronizar.test.ts).
 */
import type { ResultadoBusca } from './api.ts';
import * as m from './mapeamento.ts';

type Linha = m.Linha;
type Mapa<V = string> = m.Mapa<V>;
type RegistroBubble = m.RegistroBubble;

/** Tabelas que têm `bubble_id`. */
export type TabelaComBubble =
  | 'fornecedor'
  | 'cliente'
  | 'operacao'
  | 'etapa_operacao'
  | 'funil_etapa'
  | 'funil_tag'
  | 'funil_cartao';

/** Dessas, as que têm a coluna `arquivado` — as únicas que podem ser arquivadas. */
export type TabelaArquivavel = 'fornecedor' | 'cliente' | 'operacao' | 'funil_cartao';
const ARQUIVAVEIS = new Set<string>(['fornecedor', 'cliente', 'operacao', 'funil_cartao']);

/** Filhos: reconciliados por pai. Todos têm `origem_bubble` (db/011). */
export type TabelaFilha =
  | 'fornecedor_tipo_operacao'
  | 'cliente_email'
  | 'cliente_visualizador'
  | 'operacao_observacao'
  | 'operacao_declinio'
  | 'etapa_instrumento'
  | 'etapa_checklist_item'
  | 'funil_cartao_tag'
  | 'funil_cartao_usuario';

/** Como reconciliar cada tabela filha. */
export interface ConfigFilha {
  /** Coluna que aponta para o pai. */
  pai: string;
  /** Colunas que identificam o filho dentro do pai (a chave natural). */
  chave: string[];
  /** A tabela tem coluna `id` própria (e não só chave composta). */
  temId: boolean;
  /** Colunas que, mudando no Bubble, atualizam o filho que já existe. */
  conteudo?: string[];
  /** A mesma chave pode repetir (observação com texto igual): conta ocorrências. */
  repete?: boolean;
}

export const FILHAS: Record<TabelaFilha, ConfigFilha> = {
  fornecedor_tipo_operacao: { pai: 'fornecedor_id', chave: ['tipo_operacao_id', 'papel'], temId: false },
  cliente_email: { pai: 'cliente_id', chave: ['email'], temId: true },
  cliente_visualizador: { pai: 'cliente_id', chave: ['perfil_id'], temId: false },
  operacao_observacao: { pai: 'operacao_id', chave: ['texto'], temId: true, repete: true },
  operacao_declinio: { pai: 'operacao_id', chave: ['fornecedor_id'], temId: false },
  etapa_instrumento: { pai: 'etapa_id', chave: ['tipo_operacao_id'], temId: false },
  etapa_checklist_item: {
    pai: 'etapa_id',
    chave: ['chave'],
    temId: true,
    conteudo: ['rotulo', 'descricao', 'valor', 'ordem'],
  },
  funil_cartao_tag: { pai: 'cartao_id', chave: ['tag_id'], temId: false },
  funil_cartao_usuario: { pai: 'cartao_id', chave: ['perfil_id'], temId: false },
};

/** Ordem em que o resultado é mostrado — a mesma da gravação. */
export const ORDEM_DAS_TABELAS: Array<TabelaComBubble | TabelaFilha | 'funil_quadro'> = [
  'fornecedor',
  'fornecedor_tipo_operacao',
  'cliente',
  'cliente_email',
  'cliente_visualizador',
  'operacao',
  'operacao_observacao',
  'operacao_declinio',
  'etapa_operacao',
  'etapa_instrumento',
  'etapa_checklist_item',
  'funil_quadro',
  'funil_etapa',
  'funil_tag',
  'funil_cartao',
  'funil_cartao_tag',
  'funil_cartao_usuario',
];

/**
 * O banco, visto pela sincronização. Só mexe em linha que veio da leitura por
 * `bubble_id` (pais) ou por pai conhecido (filhos): não há "atualizar tudo".
 */
export interface Banco {
  /** `bubble_id → linha inteira` (com `id`) de tudo que já veio do Bubble. */
  atuais(tabela: TabelaComBubble): Promise<Mapa<Linha>>;
  /** `rotulo → id` de uma tabela de apoio. */
  catalogo(tabela: 'tipo_operacao' | 'status_operacao' | 'status_etapa'): Promise<Mapa<number>>;
  /** `email (minúsculo) → perfil.id`. */
  perfisPorEmail(): Promise<Mapa>;
  /** `nome → id` dos quadros do funil. */
  quadros(): Promise<Mapa>;
  /** Insere quadros que faltam; devolve `nome → id` dos que entraram. */
  inserirQuadros(nomes: string[]): Promise<Mapa>;
  /**
   * INSERT ... ON CONFLICT (bubble_id) DO NOTHING.
   * Devolve `bubble_id → id` só do que de fato entrou.
   */
  inserirNovos(tabela: TabelaComBubble, linhas: Linha[]): Promise<Mapa>;
  /** UPDATE por `id`, só das colunas que mudaram. Devolve quantas linhas. */
  atualizar(tabela: TabelaComBubble, mudancas: Array<{ id: string; valores: Linha }>): Promise<number>;
  /** `arquivado = true` nos ids. Nunca apaga. Devolve quantas linhas. */
  arquivar(tabela: TabelaArquivavel, ids: string[]): Promise<number>;
  /** Todos os filhos (de qualquer origem) dos pais dados, em ordem estável. */
  filhosDe(tabela: TabelaFilha, paiIds: string[]): Promise<Linha[]>;
  /** INSERT de filhos novos, ignorando duplicado. Devolve quantos entraram. */
  inserirFilhos(tabela: TabelaFilha, linhas: Linha[]): Promise<number>;
  /** UPSERT de filhos que já existem (marca `origem_bubble`, atualiza conteúdo). */
  atualizarFilhos(tabela: TabelaFilha, linhas: Linha[]): Promise<number>;
  /** DELETE de filhos (linhas como `filhosDe` devolveu). Devolve quantos. */
  removerFilhos(tabela: TabelaFilha, linhas: Linha[]): Promise<number>;
}

/** Os data types do Bubble que a sincronização lê. */
export const TIPOS_LIDOS = [
  'user',
  'fornecedor',
  'cliente',
  'tbl_infocliente',
  'opera__o',
  'tbl_observa__es',
  'etapas_opera__o',
  'funiletapa',
  'funiltag',
  'funilcartao',
] as const;
export type TipoLido = (typeof TIPOS_LIDOS)[number];

export type Fonte = (tipo: TipoLido) => Promise<ResultadoBusca>;

export interface LinhaDoResultado {
  tabela: string;
  novos: number;
  atualizados: number;
  arquivados: number;
  removidos: number;
}

export interface ResultadoSincronizacao {
  /** Por tabela, na ordem de `ORDEM_DAS_TABELAS`. Zero também aparece. */
  tabelas: LinhaDoResultado[];
  /** Data types que o Bubble não expõe na Data API (HTTP 404): nada deles foi sincronizado. */
  naoExpostos: string[];
  /** O que impediu uma tabela inteira (outro erro do Bubble, erro do banco). */
  erros: string[];
  /** O que foi pulado registro a registro (rótulo desconhecido, pai ausente). */
  avisos: string[];
}

/** Registros com `_id`, sem repetir. */
export function unicos(registros: RegistroBubble[]): RegistroBubble[] {
  const vistos = new Set<string>();
  const saida: RegistroBubble[] = [];
  for (const r of registros) {
    if (!r._id) continue;
    const id = m.bubbleId(r);
    if (vistos.has(id)) continue;
    vistos.add(id);
    saida.push(r);
  }
  return saida;
}

/** Registros cujo `_id` ainda não existe aqui (sem repetir, sem registro sem `_id`). */
export function soNovos(registros: RegistroBubble[], existentes: Mapa<unknown>): RegistroBubble[] {
  return unicos(registros).filter((r) => !existentes.has(m.bubbleId(r)));
}

/* ------------------------------------------------------------ comparação -- */

const COMECA_COM_DATA = /^\d{4}-\d{2}-\d{2}/;

function paraComparar(v: unknown): unknown {
  if (v === undefined) return null;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v.toISOString();
  return v;
}

/** Igualdade de valor de coluna: data é data (coluna `date` x ISO completo), o resto é JSON. */
export function iguais(novo: unknown, atual: unknown): boolean {
  const a = paraComparar(novo);
  const b = paraComparar(atual);
  if (a === b) return true;
  if (typeof a === 'string' && typeof b === 'string' && COMECA_COM_DATA.test(a) && COMECA_COM_DATA.test(b)) {
    if (a.length === 10 || b.length === 10) return a.slice(0, 10) === b.slice(0, 10);
    const ta = Date.parse(a);
    const tb = Date.parse(b);
    if (!Number.isNaN(ta) && !Number.isNaN(tb)) return ta === tb;
  }
  return JSON.stringify(a) === JSON.stringify(b);
}

/** Colunas que apontam para outra tabela: nulo aqui quer dizer "não achei", não "o Bubble limpou". */
const COLUNAS_DE_REFERENCIA = new Set([
  'cliente_id',
  'status_operacao_id',
  'fornecedor_id',
  'status_id',
  'tipo_operacao_id',
  'etapa_id',
  'quadro_id',
]);

/**
 * O que mudou entre a linha montada do Bubble e a que está no banco — só as
 * colunas diferentes. `criado_em` e `bubble_id` nunca entram (a data de
 * criação daqui é a do cadastro; na falta do campo o mapeamento põe "agora").
 * Referência que não se resolveu (nulo) também fica de fora: sobrescrever o
 * vínculo existente com nulo por não achar o rótulo apagaria dado.
 */
export function diferencas(nova: Linha, atual: Linha): Linha {
  const saida: Linha = {};
  for (const [coluna, valor] of Object.entries(nova)) {
    if (coluna === 'bubble_id' || coluna === 'criado_em') continue;
    if (valor === null && COLUNAS_DE_REFERENCIA.has(coluna)) continue;
    if (!iguais(valor, atual[coluna])) saida[coluna] = valor;
  }
  return saida;
}

/** Nome do data type como o editor do Bubble o mostra (para a tela dizer qual marcar). */
const NOME_DO_TIPO: Record<TipoLido, string> = {
  user: 'user',
  fornecedor: 'fornecedor',
  cliente: 'cliente',
  tbl_infocliente: 'tbl_infocliente',
  opera__o: 'operação',
  tbl_observa__es: 'tbl_observações',
  etapas_opera__o: 'etapas_operação',
  funiletapa: 'funiletapa',
  funiltag: 'funiltag',
  funilcartao: 'funilcartao',
};

const mensagemDeErro = (e: unknown) => (e instanceof Error ? e.message : String(e));

export async function sincronizar(banco: Banco, fonte: Fonte): Promise<ResultadoSincronizacao> {
  const contagem = new Map<string, LinhaDoResultado>(
    ORDEM_DAS_TABELAS.map((t) => [t, { tabela: t, novos: 0, atualizados: 0, arquivados: 0, removidos: 0 }]),
  );
  const somar = (t: string, campo: 'novos' | 'atualizados' | 'arquivados' | 'removidos', n: number) => {
    const c = contagem.get(t);
    if (c) c[campo] += n;
  };
  const naoExpostos: string[] = [];
  const erros: string[] = [];
  const avisos: string[] = [];

  // ------------------------------------------------------------- leitura
  const lidos = await Promise.all(TIPOS_LIDOS.map(async (t) => [t, await fonte(t)] as const));
  const dados = new Map<TipoLido, RegistroBubble[] | null>();
  for (const [tipo, r] of lidos) {
    if (r.ok) {
      dados.set(tipo, r.linhas);
    } else {
      dados.set(tipo, null);
      if (r.status === 404) naoExpostos.push(NOME_DO_TIPO[tipo]);
      else erros.push(`${NOME_DO_TIPO[tipo]}: HTTP ${r.status} do Bubble. Nada deste tipo foi sincronizado.`);
    }
  }
  const de = (t: TipoLido) => dados.get(t) ?? [];
  /** Leitura completa e sem erro — a condição para arquivar e remover. */
  const leu = (t: TipoLido) => Array.isArray(dados.get(t));

  const cat: m.Catalogos = {
    tipoOp: await banco.catalogo('tipo_operacao'),
    statusOp: await banco.catalogo('status_operacao'),
    statusEtapa: await banco.catalogo('status_etapa'),
  };

  // Usuário do Bubble → perfil daqui, pelo e-mail (como em criar-usuarios.mjs).
  // Usuário novo no Bubble não vira conta: exige auth.users (fora do escopo).
  const perfilPorEmail = await banco.perfisPorEmail();
  const perfilDoUsuario: Mapa = new Map();
  for (const u of de('user')) {
    const email = m.emailDoUsuario(u);
    const pid = email ? perfilPorEmail.get(email) : undefined;
    if (pid) perfilDoUsuario.set(m.bubbleId(u), pid);
  }
  const perfisDe = (ids: string[], onde: string): string[] => {
    const saida: string[] = [];
    for (const uid of ids) {
      const pid = perfilDoUsuario.get(uid);
      if (pid) saida.push(pid);
      else avisos.push(`${onde}: usuario do Bubble sem conta aqui, vinculo pulado`);
    }
    return saida;
  };

  interface ResultadoPasso {
    /** `bubble_id → id` de tudo que existe aqui agora (antigos + novos). */
    todos: Mapa;
    /** Registros do Bubble (sem repetição) ou `null` se o tipo não foi lido. */
    doBubble: RegistroBubble[] | null;
  }

  /**
   * Um passo de tabela-pai: insere o que falta, atualiza o que mudou e, se a
   * leitura foi completa, arquiva o que sumiu.
   */
  async function passo(
    tabela: TabelaComBubble,
    tipo: TipoLido,
    montar: (r: RegistroBubble) => Linha | null,
  ): Promise<ResultadoPasso> {
    const atuais = await banco.atuais(tabela);
    const todos: Mapa = new Map([...atuais].map(([b, l]) => [b, String(l.id)]));
    if (!leu(tipo)) return { todos, doBubble: null };
    const registros = unicos(de(tipo));
    const ids = new Set(registros.map(m.bubbleId));

    // inserir os novos
    const linhas: Linha[] = [];
    for (const r of registros) {
      if (atuais.has(m.bubbleId(r))) continue;
      const l = montar(r);
      if (l) linhas.push(l);
    }
    if (linhas.length) {
      try {
        const inseridos = await banco.inserirNovos(tabela, linhas);
        for (const [b, id] of inseridos) todos.set(b, id);
        somar(tabela, 'novos', inseridos.size);
      } catch (e) {
        erros.push(`${tabela}: ${mensagemDeErro(e)}`);
      }
    }

    // atualizar os que já existem e mudaram — o Bubble ganha
    const mudancas: Array<{ id: string; valores: Linha }> = [];
    for (const r of registros) {
      const atual = atuais.get(m.bubbleId(r));
      if (!atual) continue;
      const l = montar(r);
      if (!l) continue;
      const valores = diferencas(l, atual);
      if (Object.keys(valores).length) mudancas.push({ id: String(atual.id), valores });
    }
    if (mudancas.length) {
      try {
        somar(tabela, 'atualizados', await banco.atualizar(tabela, mudancas));
      } catch (e) {
        erros.push(`${tabela}: ${mensagemDeErro(e)}`);
      }
    }

    // arquivar o que sumiu do Bubble (só com leitura completa)
    if (ARQUIVAVEIS.has(tabela)) {
      const sumiram = [...atuais].filter(([b, l]) => !ids.has(b) && l.arquivado !== true);
      if (sumiram.length && registros.length === 0) {
        avisos.push(
          `${tabela}: o Bubble devolveu zero registros e ${sumiram.length} existem aqui; nada foi arquivado (confira as permissões da API)`,
        );
      } else if (sumiram.length) {
        try {
          const n = await banco.arquivar(
            tabela as TabelaArquivavel,
            sumiram.map(([, l]) => String(l.id)),
          );
          somar(tabela, 'arquivados', n);
        } catch (e) {
          erros.push(`${tabela}: ${mensagemDeErro(e)}`);
        }
      }
    }
    return { todos, doBubble: registros };
  }

  /** Chave do filho: pai + colunas da chave natural (+ ocorrência, quando repete). */
  function chavesDe(cfg: ConfigFilha, linhas: Linha[]): string[] {
    const vistos = new Map<string, number>();
    return linhas.map((l) => {
      const base = `${String(l[cfg.pai])}|${cfg.chave.map((c) => String(l[c])).join('|')}`;
      const n = vistos.get(base) ?? 0;
      vistos.set(base, n + 1);
      return cfg.repete ? `${base}#${n}` : base;
    });
  }

  /**
   * Reconcilia os filhos de uma tabela com o que o Bubble tem.
   *
   *  - `desejados`: o que o Bubble diz que existe (com a coluna do pai preenchida);
   *  - `escopo`: os pais cujo conjunto de filhos o Bubble define por inteiro.
   *    Só neles se remove. `null` = a leitura necessária falhou: só insere.
   */
  async function reconciliar(tabela: TabelaFilha, desejados: Linha[], escopo: string[] | null) {
    const cfg = FILHAS[tabela];
    const desejadosOk = desejados.filter((l) => l[cfg.pai]);
    const pais = new Set<string>([...(escopo ?? []), ...desejadosOk.map((l) => String(l[cfg.pai]))]);
    if (!pais.size) return;

    try {
      const existentes = await banco.filhosDe(tabela, [...pais]);
      const chaveExistente = chavesDe(cfg, existentes);
      const porChave = new Map(existentes.map((l, i) => [chaveExistente[i], l]));

      const chaveDesejada = chavesDe(cfg, desejadosOk);
      const vistas = new Set<string>();
      const novos: Linha[] = [];
      const jaExistem: Linha[] = [];
      let alterados = 0;
      desejadosOk.forEach((l, i) => {
        const k = chaveDesejada[i];
        if (vistas.has(k)) return; // o Bubble listou duas vezes
        vistas.add(k);
        const ex = porChave.get(k);
        if (!ex) {
          novos.push({ ...l, origem_bubble: true });
          return;
        }
        const mudouConteudo = (cfg.conteudo ?? []).some((c) => !iguais(l[c], ex[c]));
        if (mudouConteudo) alterados++;
        // Já existe: se veio da carga (origem false) passa a ser reconhecido
        // como do Bubble; se o conteúdo mudou, atualiza.
        if (mudouConteudo || ex.origem_bubble !== true) {
          jaExistem.push({ ...l, ...(cfg.temId ? { id: ex.id } : {}), origem_bubble: true });
        }
      });

      if (novos.length) somar(tabela, 'novos', await banco.inserirFilhos(tabela, novos));
      if (jaExistem.length) {
        await banco.atualizarFilhos(tabela, jaExistem);
        somar(tabela, 'atualizados', alterados);
      }

      if (escopo) {
        const noEscopo = new Set(escopo);
        const sairam = existentes.filter(
          (l, i) => l.origem_bubble === true && noEscopo.has(String(l[cfg.pai])) && !vistas.has(chaveExistente[i]),
        );
        if (sairam.length) somar(tabela, 'removidos', await banco.removerFilhos(tabela, sairam));
      }
    } catch (e) {
      erros.push(`${tabela}: ${mensagemDeErro(e)}`);
    }
  }

  /** Ids daqui dos pais que o Bubble listou (o escopo da remoção). */
  const idsDosPais = (doBubble: RegistroBubble[] | null, todos: Mapa): string[] =>
    (doBubble ?? []).map((r) => todos.get(m.bubbleId(r))).filter((id): id is string => id !== undefined);

  // ---------------------------------------------------------- fornecedor
  const forn = await passo('fornecedor', 'fornecedor', m.fornecedor);
  await reconciliar(
    'fornecedor_tipo_operacao',
    (forn.doBubble ?? []).flatMap((f) => {
      const fornecedor_id = forn.todos.get(m.bubbleId(f));
      return fornecedor_id ? m.fornecedorTipos(f, cat.tipoOp, avisos).map((v) => ({ fornecedor_id, ...v })) : [];
    }),
    forn.doBubble ? idsDosPais(forn.doBubble, forn.todos) : null,
  );

  // ------------------------------------------------------------- cliente
  const cli = await passo('cliente', 'cliente', m.cliente);
  await reconciliar(
    'cliente_email',
    de('tbl_infocliente')
      .map((i) => m.clienteEmail(i, cli.todos))
      .filter((l): l is { cliente_id: string; email: string } => l !== null),
    leu('cliente') && leu('tbl_infocliente') ? idsDosPais(cli.doBubble, cli.todos) : null,
  );
  // Vínculo com usuário precisa da leitura de `user`; sem ela não há como
  // resolver ninguém, e "nenhum vínculo" apagaria os que existem.
  if (leu('user')) {
    await reconciliar(
      'cliente_visualizador',
      (cli.doBubble ?? []).flatMap((c) => {
        const cliente_id = cli.todos.get(m.bubbleId(c));
        return cliente_id
          ? perfisDe(m.quemVisualiza(c), 'cliente').map((perfil_id) => ({ cliente_id, perfil_id }))
          : [];
      }),
      cli.doBubble ? idsDosPais(cli.doBubble, cli.todos) : null,
    );
  }

  // ------------------------------------------------------------ operacao
  const op = await passo('operacao', 'opera__o', (o) => m.operacao(o, cli.todos, cat));
  await reconciliar(
    'operacao_observacao',
    [
      ...(op.doBubble ?? []).flatMap((o) => {
        const operacao_id = op.todos.get(m.bubbleId(o));
        return operacao_id ? m.operacaoObservacoes(o).map((texto) => ({ operacao_id, texto })) : [];
      }),
      ...de('tbl_observa__es')
        .map((t) => m.observacaoAvulsa(t, op.todos))
        .filter((l): l is NonNullable<typeof l> => l !== null),
    ],
    // as observações vêm de dois tipos; só com os dois lidos o conjunto é completo
    leu('opera__o') && leu('tbl_observa__es') ? idsDosPais(op.doBubble, op.todos) : null,
  );
  await reconciliar(
    'operacao_declinio',
    (op.doBubble ?? []).flatMap((o) => {
      const operacao_id = op.todos.get(m.bubbleId(o));
      return operacao_id
        ? m.operacaoDeclinios(o, forn.todos, avisos).map((fornecedor_id) => ({ operacao_id, fornecedor_id }))
        : [];
    }),
    op.doBubble ? idsDosPais(op.doBubble, op.todos) : null,
  );

  // --------------------------------------------------------------- etapa
  const et = await passo('etapa_operacao', 'etapas_opera__o', (e) => {
    const oid = op.todos.get(m.operacaoDaEtapa(e));
    if (!oid) {
      avisos.push('etapa sem operacao correspondente, pulada');
      return null;
    }
    return m.etapa(e, oid, { clienteId: cli.todos, fornecedorId: forn.todos }, cat);
  });
  await reconciliar(
    'etapa_instrumento',
    (et.doBubble ?? []).flatMap((e) => {
      const etapa_id = et.todos.get(m.bubbleId(e));
      return etapa_id
        ? m.etapaInstrumentos(e, cat.tipoOp, avisos).map((tipo_operacao_id) => ({ etapa_id, tipo_operacao_id }))
        : [];
    }),
    et.doBubble ? idsDosPais(et.doBubble, et.todos) : null,
  );
  await reconciliar(
    'etapa_checklist_item',
    (et.doBubble ?? []).flatMap((e) => {
      const etapa_id = et.todos.get(m.bubbleId(e));
      return etapa_id ? m.etapaChecklist(e).map((item) => ({ etapa_id, ...item })) : [];
    }),
    et.doBubble ? idsDosPais(et.doBubble, et.todos) : null,
  );

  // --------------------------------------------------------------- funil
  const quadroId = await banco.quadros();
  const faltam = m
    .quadrosDoFunil(de('funilcartao'), de('funiletapa'), de('funiltag'))
    .filter((nome) => !quadroId.has(nome));
  if (faltam.length) {
    try {
      const novos = await banco.inserirQuadros(faltam);
      for (const [nome, id] of novos) quadroId.set(nome, id);
      somar('funil_quadro', 'novos', novos.size);
    } catch (e) {
      erros.push(`funil_quadro: ${mensagemDeErro(e)}`);
    }
  }
  const quadroPadrao = [...quadroId.values()][0] ?? null;

  const etf = await passo('funil_etapa', 'funiletapa', (e) => m.funilEtapa(e, quadroId, quadroPadrao));
  const tag = await passo('funil_tag', 'funiltag', (t) => m.funilTag(t, quadroId, quadroPadrao));
  const car = await passo('funil_cartao', 'funilcartao', (k) =>
    m.funilCartao(k, quadroId, quadroPadrao, etf.todos),
  );
  await reconciliar(
    'funil_cartao_tag',
    (car.doBubble ?? []).flatMap((k) => {
      const cartao_id = car.todos.get(m.bubbleId(k));
      return cartao_id ? m.funilCartaoTags(k, tag.todos).map((tag_id) => ({ cartao_id, tag_id })) : [];
    }),
    // tag que não se resolve é ignorada; sem ler funiltag toda tag "sumiria"
    car.doBubble && leu('funiltag') ? idsDosPais(car.doBubble, car.todos) : null,
  );
  if (leu('user')) {
    await reconciliar(
      'funil_cartao_usuario',
      (car.doBubble ?? []).flatMap((k) => {
        const cartao_id = car.todos.get(m.bubbleId(k));
        return cartao_id
          ? perfisDe(m.usuariosDoCartao(k), 'funil_cartao').map((perfil_id) => ({ cartao_id, perfil_id }))
          : [];
      }),
      car.doBubble ? idsDosPais(car.doBubble, car.todos) : null,
    );
  }

  return {
    tabelas: ORDEM_DAS_TABELAS.map((t) => contagem.get(t) as LinhaDoResultado),
    naoExpostos,
    erros,
    avisos: resumirAvisos(avisos),
  };
}

/** "3x etapa sem operacao..." em vez de três linhas iguais. */
export function resumirAvisos(avisos: string[]): string[] {
  const cont = new Map<string, number>();
  for (const a of avisos) cont.set(a, (cont.get(a) ?? 0) + 1);
  return [...cont].map(([a, n]) => (n > 1 ? `${n}x ${a}` : a));
}
