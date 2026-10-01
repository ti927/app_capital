/**
 * Sincronização com o Bubble: **só coleta cadastros novos**.
 *
 * Regra (specs/10-sincronizacao-bubble.md):
 *
 *  - entra o registro do Bubble cujo `_id` ainda não existe aqui em
 *    `bubble_id`; o que já existe não é tocado — nem atualizado, nem apagado;
 *  - filhos (e-mails, vínculos, observações, checklist...) só entram
 *    pendurados num pai que acabou de entrar. Pai antigo não ganha filho
 *    novo: sem `bubble_id` no filho não há como saber se ele já foi trazido;
 *  - ordem de dependência: fornecedor → cliente → operação → etapa, e no
 *    funil quadro → etapa/tag → cartão.
 *
 * A trava de "nunca atualiza, nunca apaga" é estrutural: a interface `Banco`
 * abaixo não tem update nem delete. O INSERT ainda leva `on conflict do
 * nothing`, para o caso de dois cliques simultâneos.
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

/** Tabelas que têm `bubble_id` — as únicas onde "novo" tem sentido. */
export type TabelaComBubble =
  | 'fornecedor'
  | 'cliente'
  | 'operacao'
  | 'etapa_operacao'
  | 'funil_etapa'
  | 'funil_tag'
  | 'funil_cartao';

/** Filhos: entram só pendurados num pai novo. */
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

/** Ordem em que o resultado é mostrado — a mesma da inserção. */
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

/** Só leitura e inserção. Não existe update nem delete aqui, de propósito. */
export interface Banco {
  /** `bubble_id → id` de tudo que já existe na tabela. */
  idsPorBubble(tabela: TabelaComBubble): Promise<Mapa>;
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
  /** INSERT de filhos, ignorando duplicado. Devolve quantos entraram. */
  inserirFilhos(tabela: TabelaFilha, linhas: Linha[]): Promise<number>;
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

export interface ResultadoSincronizacao {
  /** Novos por tabela, na ordem de `ORDEM_DAS_TABELAS`. Zero também aparece. */
  novos: Array<{ tabela: string; quantidade: number }>;
  /** O que impediu uma tabela inteira (data type fora da API, erro do banco). */
  erros: string[];
  /** O que foi pulado registro a registro (rótulo desconhecido, pai ausente). */
  avisos: string[];
}

/**
 * Registros cujo `_id` ainda não existe aqui. Também descarta `_id` repetido
 * dentro do próprio lote. É a regra inteira de "só cadastros novos".
 */
export function soNovos(registros: RegistroBubble[], existentes: Mapa): RegistroBubble[] {
  const vistos = new Set<string>();
  const saida: RegistroBubble[] = [];
  for (const r of registros) {
    const id = m.bubbleId(r);
    if (!r._id || existentes.has(id) || vistos.has(id)) continue;
    vistos.add(id);
    saida.push(r);
  }
  return saida;
}

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
  const contagem = new Map<string, number>(ORDEM_DAS_TABELAS.map((t) => [t, 0]));
  const somar = (t: string, n: number) => contagem.set(t, (contagem.get(t) ?? 0) + n);
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
      erros.push(
        r.status === 404
          ? `${NOME_DO_TIPO[tipo]}: HTTP 404 — o data type não está exposto na Data API desta raiz do Bubble (Settings › API). Pulado.`
          : `${NOME_DO_TIPO[tipo]}: HTTP ${r.status} do Bubble. Pulado.`,
      );
    }
  }
  const de = (t: TipoLido) => dados.get(t) ?? [];
  const leu = (t: TipoLido) => dados.get(t) !== null;

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

  /**
   * Um passo: lê o que já existe, separa os novos, insere, e devolve o mapa
   * completo `bubble_id → id` (antigos + novos) e o conjunto dos que entraram.
   */
  async function passo(
    tabela: TabelaComBubble,
    tipo: TipoLido,
    montar: (r: RegistroBubble) => Linha | null,
  ): Promise<{ todos: Mapa; entraram: RegistroBubble[] }> {
    const todos = await banco.idsPorBubble(tabela);
    if (!leu(tipo)) return { todos, entraram: [] };
    const novos = soNovos(de(tipo), todos);
    const linhas: Linha[] = [];
    const candidatos: RegistroBubble[] = [];
    for (const r of novos) {
      const l = montar(r);
      if (l) {
        linhas.push(l);
        candidatos.push(r);
      }
    }
    if (!linhas.length) return { todos, entraram: [] };
    try {
      const inseridos = await banco.inserirNovos(tabela, linhas);
      for (const [b, id] of inseridos) todos.set(b, id);
      somar(tabela, inseridos.size);
      return { todos, entraram: candidatos.filter((r) => inseridos.has(m.bubbleId(r))) };
    } catch (e) {
      erros.push(`${tabela}: ${mensagemDeErro(e)}`);
      return { todos, entraram: [] };
    }
  }

  async function filhos(tabela: TabelaFilha, linhas: Linha[]) {
    if (!linhas.length) return;
    try {
      somar(tabela, await banco.inserirFilhos(tabela, linhas));
    } catch (e) {
      erros.push(`${tabela}: ${mensagemDeErro(e)}`);
    }
  }

  // ---------------------------------------------------------- fornecedor
  const forn = await passo('fornecedor', 'fornecedor', m.fornecedor);
  await filhos(
    'fornecedor_tipo_operacao',
    forn.entraram.flatMap((f) => {
      const fornecedor_id = forn.todos.get(m.bubbleId(f));
      return m.fornecedorTipos(f, cat.tipoOp, avisos).map((v) => ({ fornecedor_id, ...v }));
    }),
  );

  // ------------------------------------------------------------- cliente
  const cli = await passo('cliente', 'cliente', m.cliente);
  const clientesNovos: Mapa = new Map(
    cli.entraram.map((c) => [m.bubbleId(c), cli.todos.get(m.bubbleId(c)) as string]),
  );
  await filhos(
    'cliente_email',
    de('tbl_infocliente')
      .filter((i) => clientesNovos.has(String(i.qualcliente)))
      .map((i) => m.clienteEmail(i, clientesNovos))
      .filter((l): l is { cliente_id: string; email: string } => l !== null),
  );
  await filhos(
    'cliente_visualizador',
    cli.entraram.flatMap((c) => {
      const cliente_id = clientesNovos.get(m.bubbleId(c));
      return perfisDe(m.quemVisualiza(c), 'cliente').map((perfil_id) => ({ cliente_id, perfil_id }));
    }),
  );

  // ------------------------------------------------------------ operacao
  const op = await passo('operacao', 'opera__o', (o) => m.operacao(o, cli.todos, cat));
  const operacoesNovas: Mapa = new Map(
    op.entraram.map((o) => [m.bubbleId(o), op.todos.get(m.bubbleId(o)) as string]),
  );
  await filhos('operacao_observacao', [
    ...op.entraram.flatMap((o) =>
      m.operacaoObservacoes(o).map((texto) => ({ operacao_id: operacoesNovas.get(m.bubbleId(o)), texto })),
    ),
    ...de('tbl_observa__es')
      .map((t) => m.observacaoAvulsa(t, operacoesNovas))
      .filter((l): l is NonNullable<typeof l> => l !== null),
  ]);
  await filhos(
    'operacao_declinio',
    op.entraram.flatMap((o) => {
      const operacao_id = operacoesNovas.get(m.bubbleId(o));
      return m
        .operacaoDeclinios(o, forn.todos, avisos)
        .map((fornecedor_id) => ({ operacao_id, fornecedor_id }));
    }),
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
  await filhos(
    'etapa_instrumento',
    et.entraram.flatMap((e) => {
      const etapa_id = et.todos.get(m.bubbleId(e));
      return m
        .etapaInstrumentos(e, cat.tipoOp, avisos)
        .map((tipo_operacao_id) => ({ etapa_id, tipo_operacao_id }));
    }),
  );
  await filhos(
    'etapa_checklist_item',
    et.entraram.flatMap((e) => {
      const etapa_id = et.todos.get(m.bubbleId(e));
      return m.etapaChecklist(e).map((item) => ({ etapa_id, ...item }));
    }),
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
      somar('funil_quadro', novos.size);
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
  await filhos(
    'funil_cartao_tag',
    car.entraram.flatMap((k) => {
      const cartao_id = car.todos.get(m.bubbleId(k));
      return m.funilCartaoTags(k, tag.todos).map((tag_id) => ({ cartao_id, tag_id }));
    }),
  );
  await filhos(
    'funil_cartao_usuario',
    car.entraram.flatMap((k) => {
      const cartao_id = car.todos.get(m.bubbleId(k));
      return perfisDe(m.usuariosDoCartao(k), 'funil_cartao').map((perfil_id) => ({ cartao_id, perfil_id }));
    }),
  );

  return {
    novos: ORDEM_DAS_TABELAS.map((tabela) => ({ tabela, quantidade: contagem.get(tabela) ?? 0 })),
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
