import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { sincronizarEventoDaTarefa } from '@/lib/google/agenda';
import { criarClienteDoCartaoCom } from '@/lib/funil/cliente-do-cartao';
import { acrescentarAoHistorico, mesclarCampos, mesmoNome, termoDeBusca } from './regras';

/**
 * As ferramentas do MCP do sistema (specs/12-mcp-e-readai.md).
 *
 * Todas usam o `supabase` **da pessoa** que conectou o Claude — o token dela —,
 * então a RLS (db/009) faz o recorte: o indicante pelo Claude vê e escreve o
 * mesmo que pelo app. As de operação e fornecedor ainda conferem master aqui
 * porque as telas desses são só de master, e a RLS deixa o catálogo aberto.
 *
 * Não há ferramenta de excluir. Excluir é no app, com uma pessoa clicando.
 */

export interface ContextoMcp {
  supabase: SupabaseClient;
  perfil: { id: string; nome: string; nivel_acesso: string };
  /** Endereço do app, para links e para o evento da agenda. */
  origem: string;
}

type Linha = Record<string, unknown>;

const responder = (dados: unknown) => ({
  content: [{ type: 'text' as const, text: JSON.stringify(dados, null, 2) }],
});
const falhar = (mensagem: string) => ({
  content: [{ type: 'text' as const, text: mensagem }],
  isError: true,
});

const DATA = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe('yyyy-mm-dd');
const TIPOS_TAREFA = ['reuniao', 'ligacao', 'follow_up', 'documento', 'outro'] as const;

export function registrarFerramentas(servidor: McpServer, ctx: ContextoMcp) {
  const { supabase, perfil, origem } = ctx;
  const ehMaster = perfil.nivel_acesso === 'master';

  async function quadroPrincipal() {
    const { data } = await supabase.from('funil_quadro').select('id').order('ordem').limit(1);
    return (data?.[0]?.id as string | undefined) ?? null;
  }

  async function colunas() {
    const { data } = await supabase.from('funil_etapa').select('id, nome, ordem, no_fluxo').order('ordem');
    return (data ?? []) as Array<{ id: string; nome: string; ordem: number; no_fluxo: boolean }>;
  }

  const nomesDasColunas = (etapas: Array<{ nome: string }>) => etapas.map((e) => e.nome).join(', ');

  /* ------------------------------------------------------------- leitura -- */

  servidor.registerTool(
    'quem_sou_eu',
    {
      title: 'Quem sou eu',
      description:
        'A conta do app em nome de quem o Claude está agindo, e o nível dela ' +
        '(master vê tudo; indicante só os clientes e cartões dele).',
      inputSchema: {},
    },
    async () => responder({ nome: perfil.nome, nivel: perfil.nivel_acesso }),
  );

  servidor.registerTool(
    'buscar_clientes',
    {
      title: 'Buscar clientes',
      description:
        'Clientes por trecho do nome/razão social ou CNPJ. Sem termo, os primeiros ' +
        'em ordem alfabética. Use antes de criar cartão, para não duplicar empresa.',
      inputSchema: {
        termo: z.string().optional().describe('Trecho do nome, razão social ou CNPJ.'),
        incluir_arquivados: z.boolean().optional().describe('Padrão: false.'),
        limite: z.number().int().min(1).max(200).optional().describe('Padrão: 50.'),
      },
    },
    async ({ termo, incluir_arquivados = false, limite = 50 }) => {
      let q = supabase
        .from('cliente')
        .select('id, nome_razao, cnpj, cidade, status, demanda, faturamento_anual, arquivado')
        .order('nome_razao')
        .limit(limite);
      const t = termoDeBusca(termo);
      if (t) q = q.or(`nome_razao.ilike.%${t}%,cnpj.ilike.%${t}%`);
      if (!incluir_arquivados) q = q.eq('arquivado', false);
      const { data, error } = await q;
      return error ? falhar(`Não consegui buscar: ${error.message}`) : responder(data);
    },
  );

  servidor.registerTool(
    'detalhar_cliente',
    {
      title: 'Detalhar cliente',
      description: 'Ficha completa de um cliente, com e-mails e operações.',
      inputSchema: { id: z.string().uuid().describe('id do cliente (de buscar_clientes).') },
    },
    async ({ id }) => {
      const [cliente, emails, operacoes] = await Promise.all([
        supabase.from('cliente').select('*').eq('id', id).maybeSingle(),
        supabase.from('cliente_email').select('email').eq('cliente_id', id),
        supabase
          .from('operacao')
          .select('id, identificador, demanda_inicial, prazo, parecer, arquivado, status_operacao(rotulo)')
          .eq('cliente_id', id),
      ]);
      if (!cliente.data) return falhar('Cliente não encontrado, ou fora do seu acesso.');
      return responder({
        ...cliente.data,
        emails: (emails.data ?? []).map((e) => e.email),
        operacoes: operacoes.data ?? [],
      });
    },
  );

  servidor.registerTool(
    'listar_funil',
    {
      title: 'Listar o funil',
      description:
        'O funil comercial por coluna, com os cartões de cada uma (empresa, contato, ' +
        'segmento, faturamento, indicante, data da call). Bom primeiro passo.',
      inputSchema: { incluir_arquivados: z.boolean().optional().describe('Padrão: false.') },
    },
    async ({ incluir_arquivados = false }) => {
      let q = supabase
        .from('funil_cartao')
        .select('id, etapa_id, empresa, contato, segmento, faturamento, indicante, data_call, arquivado, atualizado_em')
        .order('ordem');
      if (!incluir_arquivados) q = q.eq('arquivado', false);
      const [{ data: cartoes }, etapas] = await Promise.all([q, colunas()]);
      const lista = (cartoes ?? []) as Linha[];
      return responder(
        etapas.map((e) => ({
          coluna: e.nome,
          no_fluxo: e.no_fluxo,
          cartoes: lista.filter((c) => c.etapa_id === e.id),
        })),
      );
    },
  );

  servidor.registerTool(
    'detalhar_cartao',
    {
      title: 'Detalhar cartão',
      description: 'Um cartão do funil com histórico, parecer, tags e tarefas.',
      inputSchema: { id: z.string().uuid().describe('id do cartão (de listar_funil).') },
    },
    async ({ id }) => {
      const [cartao, tags, tarefas] = await Promise.all([
        supabase.from('funil_cartao').select('*, funil_etapa(nome)').eq('id', id).maybeSingle(),
        supabase.from('funil_cartao_tag').select('funil_tag(nome)').eq('cartao_id', id),
        supabase
          .from('funil_tarefa')
          .select('id, titulo, tipo, prazo, hora, concluida, responsavel_id, meet_link')
          .eq('cartao_id', id)
          .order('prazo'),
      ]);
      if (!cartao.data) return falhar('Cartão não encontrado, ou fora do seu acesso.');
      return responder({
        ...cartao.data,
        tags: (tags.data ?? []).map((t) => (t.funil_tag as unknown as { nome: string } | null)?.nome),
        tarefas: tarefas.data ?? [],
        link: `${origem}/funil`,
      });
    },
  );

  servidor.registerTool(
    'listar_tarefas',
    {
      title: 'Listar tarefas',
      description:
        'Tarefas do funil num intervalo de datas. Padrão: as suas, não concluídas, ' +
        'de qualquer data.',
      inputSchema: {
        de: DATA.optional(),
        ate: DATA.optional(),
        apenas_minhas: z.boolean().optional().describe('Padrão: true.'),
        incluir_concluidas: z.boolean().optional().describe('Padrão: false.'),
      },
    },
    async ({ de, ate, apenas_minhas = true, incluir_concluidas = false }) => {
      let q = supabase
        .from('funil_tarefa')
        .select('id, titulo, tipo, prazo, hora, concluida, meet_link, funil_cartao(id, empresa)')
        .order('prazo');
      if (apenas_minhas) q = q.eq('responsavel_id', perfil.id);
      if (!incluir_concluidas) q = q.eq('concluida', false);
      if (de) q = q.gte('prazo', de);
      if (ate) q = q.lte('prazo', ate);
      const { data, error } = await q;
      return error ? falhar(`Não consegui listar: ${error.message}`) : responder(data);
    },
  );

  servidor.registerTool(
    'buscar_operacoes',
    {
      title: 'Buscar operações (master)',
      description: 'Operações por identificador ou cliente. Só para master.',
      inputSchema: {
        termo: z.string().optional().describe('Trecho do identificador.'),
        cliente_id: z.string().uuid().optional(),
        limite: z.number().int().min(1).max(200).optional().describe('Padrão: 50.'),
      },
    },
    async ({ termo, cliente_id, limite = 50 }) => {
      if (!ehMaster) return falhar('Operações são só para master.');
      let q = supabase
        .from('operacao')
        .select('id, identificador, demanda_inicial, demanda_final, prazo, arquivado, cliente(nome_razao), status_operacao(rotulo)')
        .limit(limite);
      const t = termoDeBusca(termo);
      if (t) q = q.ilike('identificador', `%${t}%`);
      if (cliente_id) q = q.eq('cliente_id', cliente_id);
      const { data, error } = await q;
      return error ? falhar(`Não consegui buscar: ${error.message}`) : responder(data);
    },
  );

  servidor.registerTool(
    'buscar_fornecedores',
    {
      title: 'Buscar fornecedores (master)',
      description: 'Fundos/fornecedores por nome ou segmento foco. Só para master.',
      inputSchema: {
        termo: z.string().optional().describe('Trecho do nome do fundo ou do segmento foco.'),
        limite: z.number().int().min(1).max(200).optional().describe('Padrão: 50.'),
      },
    },
    async ({ termo, limite = 50 }) => {
      if (!ehMaster) return falhar('Fornecedores são só para master.');
      let q = supabase
        .from('fornecedor')
        .select('id, nome_fundo, contato, email, segmento_foco, segmento_nao_atua, operacao_minima, faturamento_minimo, fee, status')
        .eq('arquivado', false)
        .order('nome_fundo')
        .limit(limite);
      const t = termoDeBusca(termo);
      if (t) q = q.or(`nome_fundo.ilike.%${t}%,segmento_foco.ilike.%${t}%`);
      const { data, error } = await q;
      return error ? falhar(`Não consegui buscar: ${error.message}`) : responder(data);
    },
  );

  /* ------------------------------------------------------------- escrita -- */

  servidor.registerTool(
    'criar_cartao',
    {
      title: 'Criar cartão no funil',
      description:
        'Cria um cartão no funil comercial. Antes, confira com buscar_clientes e ' +
        'listar_funil se a empresa já não está lá. Sem coluna, vai para a primeira.',
      inputSchema: {
        empresa: z.string().min(1),
        contato: z.string().optional(),
        segmento: z.string().optional(),
        faturamento: z.string().optional().describe('Texto livre, como a equipe escreve: "40MM".'),
        indicante: z.string().optional(),
        parecer: z.string().optional(),
        historico: z.string().optional().describe('Primeira anotação do histórico.'),
        coluna: z.string().optional().describe('Nome da coluna do funil.'),
      },
    },
    async ({ coluna, historico, ...campos }) => {
      const quadroId = await quadroPrincipal();
      if (!quadroId) return falhar('Não achei o quadro do funil.');

      const etapas = await colunas();
      const etapa = coluna
        ? etapas.find((e) => mesmoNome(e.nome, coluna))
        : (etapas.find((e) => e.no_fluxo) ?? etapas[0]);
      if (coluna && !etapa) return falhar(`Não existe a coluna "${coluna}". Colunas: ${nomesDasColunas(etapas)}.`);

      const { data, error } = await supabase
        .from('funil_cartao')
        .insert({
          ...campos,
          quadro_id: quadroId,
          etapa_id: etapa?.id ?? null,
          historico: historico ? acrescentarAoHistorico(null, historico, perfil.nome, new Date()) : null,
        })
        .select('id, empresa')
        .single();
      if (error || !data) return falhar(`Não consegui criar o cartão: ${error?.message ?? 'sem retorno'}`);
      return responder({ ...data, coluna: etapa?.nome ?? null, link: `${origem}/funil` });
    },
  );

  servidor.registerTool(
    'atualizar_cartao',
    {
      title: 'Atualizar cartão',
      description:
        'Preenche campos de um cartão. Não sobrescreve campo já preenchido, a menos ' +
        'que sobrescrever=true — e diz quais ficaram como estavam. Para acrescentar ' +
        'ao histórico, use anotar_no_cartao.',
      inputSchema: {
        id: z.string().uuid(),
        empresa: z.string().optional(),
        contato: z.string().optional(),
        segmento: z.string().optional(),
        faturamento: z.string().optional(),
        indicante: z.string().optional(),
        parecer: z.string().optional(),
        data_call: DATA.optional(),
        sobrescrever: z.boolean().optional().describe('Padrão: false.'),
      },
    },
    async ({ id, sobrescrever = false, data_call, ...pedido }) => {
      const { data: atual } = await supabase
        .from('funil_cartao')
        .select('empresa, contato, segmento, faturamento, indicante, parecer, data_call')
        .eq('id', id)
        .maybeSingle();
      if (!atual) return falhar('Cartão não encontrado, ou fora do seu acesso.');

      const { gravar, mantidos } = mesclarCampos(atual, pedido, sobrescrever);
      const mudancas: Record<string, string> = { ...gravar };
      const ficaram: string[] = [...mantidos];
      if (data_call) {
        if (sobrescrever || !atual.data_call || atual.data_call === data_call) mudancas.data_call = data_call;
        else ficaram.push('data_call');
      }

      if (Object.keys(mudancas).length) {
        const { error } = await supabase.from('funil_cartao').update(mudancas).eq('id', id);
        if (error) return falhar(`Não consegui salvar: ${error.message}`);
      }
      return responder({ gravados: Object.keys(mudancas), mantidos_como_estavam: ficaram });
    },
  );

  servidor.registerTool(
    'anotar_no_cartao',
    {
      title: 'Anotar no histórico do cartão',
      description:
        'Acrescenta uma anotação ao histórico do cartão, com data e o seu nome. ' +
        'Nunca apaga o que já estava lá. Use para resumo de conversa ou reunião.',
      inputSchema: { id: z.string().uuid(), texto: z.string().min(1) },
    },
    async ({ id, texto }) => {
      const { data: atual } = await supabase.from('funil_cartao').select('historico').eq('id', id).maybeSingle();
      if (!atual) return falhar('Cartão não encontrado, ou fora do seu acesso.');
      const historico = acrescentarAoHistorico(atual.historico as string | null, texto, perfil.nome, new Date());
      const { error } = await supabase.from('funil_cartao').update({ historico }).eq('id', id);
      return error ? falhar(`Não consegui anotar: ${error.message}`) : responder({ ok: true });
    },
  );

  servidor.registerTool(
    'mover_cartao',
    {
      title: 'Mover cartão de coluna',
      description: 'Move o cartão para outra coluna do funil, pelo nome da coluna.',
      inputSchema: { id: z.string().uuid(), coluna: z.string().min(1) },
    },
    async ({ id, coluna }) => {
      const etapas = await colunas();
      const etapa = etapas.find((e) => mesmoNome(e.nome, coluna));
      if (!etapa) return falhar(`Não existe a coluna "${coluna}". Colunas: ${nomesDasColunas(etapas)}.`);
      const { data, error } = await supabase
        .from('funil_cartao')
        .update({ etapa_id: etapa.id })
        .eq('id', id)
        .select('id');
      if (error) return falhar(`Não consegui mover: ${error.message}`);
      if (!data?.length) return falhar('Cartão não encontrado, ou fora do seu acesso.');
      return responder({ ok: true, coluna: etapa.nome });
    },
  );

  servidor.registerTool(
    'criar_tarefa',
    {
      title: 'Criar tarefa no cartão',
      description:
        'Cria uma tarefa num cartão do funil. Tipo "reuniao" com prazo e hora vira ' +
        'evento com Google Meet na agenda do responsável (se ele conectou a agenda). ' +
        'convidar_email convida o contato do cliente para a reunião.',
      inputSchema: {
        cartao_id: z.string().uuid(),
        titulo: z.string().min(1),
        tipo: z.enum(TIPOS_TAREFA).optional(),
        prazo: DATA.optional(),
        hora: z.string().regex(/^\d{2}:\d{2}$/).optional().describe('HH:MM, horário de Brasília'),
        descricao: z.string().optional(),
        responsavel: z.string().optional().describe('Nome ou e-mail de quem faz. Padrão: você.'),
        convidar_email: z.string().email().optional(),
      },
    },
    async ({ cartao_id, responsavel, convidar_email, ...campos }) => {
      let responsavelId = perfil.id;
      if (responsavel) {
        const t = termoDeBusca(responsavel);
        if (!t) return falhar('Responsável inválido.');
        const { data: achados } = await supabase
          .from('perfil')
          .select('id, nome')
          .eq('ativo', true)
          .or(`nome.ilike.%${t}%,email.ilike.%${t}%`);
        if (!achados?.length) return falhar(`Ninguém ativo com "${responsavel}".`);
        if (achados.length > 1) {
          return falhar(`Mais de uma pessoa com "${responsavel}": ${achados.map((a) => a.nome).join(', ')}.`);
        }
        responsavelId = achados[0].id as string;
      }

      const { data: cartao } = await supabase.from('funil_cartao').select('quadro_id').eq('id', cartao_id).maybeSingle();
      if (!cartao) return falhar('Cartão não encontrado, ou fora do seu acesso.');

      const { data, error } = await supabase
        .from('funil_tarefa')
        .insert({
          ...campos,
          cartao_id,
          quadro_id: cartao.quadro_id,
          responsavel_id: responsavelId,
          convidar_contato: Boolean(convidar_email),
          email_convidado: convidar_email ?? null,
        })
        .select('id')
        .single();
      if (error || !data) return falhar(`Não consegui criar a tarefa: ${error?.message ?? 'sem retorno'}`);

      const { aviso } = await sincronizarEventoDaTarefa(data.id as string, origem);
      const { data: final } = await supabase.from('funil_tarefa').select('meet_link').eq('id', data.id).maybeSingle();
      return responder({
        id: data.id,
        meet_link: final?.meet_link ?? null,
        ...(aviso ? { aviso_agenda: `Tarefa criada, mas não foi para a agenda: ${aviso}` } : {}),
      });
    },
  );

  servidor.registerTool(
    'concluir_tarefa',
    {
      title: 'Concluir ou reabrir tarefa',
      description: 'Marca a tarefa como concluída (ou reabre com concluida=false).',
      inputSchema: { id: z.string().uuid(), concluida: z.boolean().optional().describe('Padrão: true.') },
    },
    async ({ id, concluida = true }) => {
      const { data, error } = await supabase
        .from('funil_tarefa')
        .update({ concluida, data_conclusao: concluida ? new Date().toISOString() : null })
        .eq('id', id)
        .select('id');
      if (error) return falhar(`Não consegui salvar: ${error.message}`);
      if (!data?.length) return falhar('Tarefa não encontrada, ou fora do seu acesso.');
      return responder({ ok: true });
    },
  );

  servidor.registerTool(
    'transformar_em_cliente',
    {
      title: 'Transformar cartão em cliente',
      description:
        'Cadastra o cliente a partir do cartão e liga os dois. Se já existe cliente ' +
        'com o mesmo nome, NÃO cria: devolve o existente. Só use forcar=true se a ' +
        'pessoa confirmar que é outra empresa.',
      inputSchema: { cartao_id: z.string().uuid(), forcar: z.boolean().optional() },
    },
    async ({ cartao_id, forcar = false }) => {
      const r = await criarClienteDoCartaoCom(supabase, perfil.id, cartao_id, forcar);
      if ('erro' in r) return falhar(r.erro);
      if ('duplicado' in r) {
        return responder({ criado: false, motivo: 'Já existe cliente com esse nome.', cliente_existente: r.duplicado });
      }
      return responder({ criado: true, cliente_id: r.clienteId, link: `${origem}/clientes` });
    },
  );
}
