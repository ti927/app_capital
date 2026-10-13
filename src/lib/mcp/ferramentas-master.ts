import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { clienteAdmin } from '@/lib/supabase/admin';
import { apagarEventoDaTarefa, sincronizarEventoDaTarefa } from '@/lib/google/agenda';
import type { ContextoMcp } from './ferramentas';
import { acrescentarAoHistorico, dataCurta, mesmoNome, termoDeBusca } from './regras';
import {
  CHAVES_DE_ESCRITA,
  TABELAS_DE_ESCRITA,
  TABELAS_DE_LEITURA,
  chaveCompleta,
  colunaValida,
  emailNormalizado,
  limparCampos,
  selecaoValida,
} from './regras-master';

/**
 * Acesso total do master pelo Claude (specs/12-mcp-e-readai.md, seção "Acesso
 * total do master"): ler qualquer tabela para relatório, gravar e excluir em
 * qualquer cadastro, e cadastrar pessoas. Só é registrado para quem é master.
 *
 * Tudo, menos criar a conta de login de uma pessoa, usa o `supabase` com o
 * token de quem conectou: a RLS confere de novo que é master, e o log de
 * `evento` registra quem fez. Criar a conta no Auth exige a service_role —
 * fica no servidor, como sempre (CLAUDE.md, regra 2).
 *
 * Mais `registrar_reuniao`, que vale para todos: a ponte com o Read.ai.
 */

const responder = (dados: unknown) => ({
  content: [{ type: 'text' as const, text: JSON.stringify(dados, null, 2) }],
});
const falhar = (mensagem: string) => ({
  content: [{ type: 'text' as const, text: mensagem }],
  isError: true,
});

const DATA = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe('yyyy-mm-dd');
const VALOR = z.union([z.string(), z.number(), z.boolean(), z.null()]);
const OPERADORES = ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'contem', 'e_nulo', 'nao_nulo', 'em'] as const;
const NIVEIS = ['master', 'indicante'] as const;

/** Hoje em São Paulo, yyyy-mm-dd. */
const hoje = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());

const CAMPOS_DA_PESSOA = {
  telefone: z.string().optional(),
  regiao: z.string().optional(),
  cpf: z.string().optional(),
  cnpj: z.string().optional(),
  razao_social: z.string().optional(),
  vinculado_a_parceiro: z.string().optional().describe('Parceiro a que o indicante está ligado.'),
};

export function registrarFerramentasMaster(servidor: McpServer, ctx: ContextoMcp) {
  const { supabase, perfil, origem } = ctx;

  /* ------------------------------------------------------------ leitura -- */

  servidor.registerTool(
    'consultar',
    {
      title: 'Consultar qualquer tabela (master)',
      description:
        'Lê linhas de uma tabela do app, com filtros, ordem e paginação — para relatórios. ' +
        'Devolve o total que bate com os filtros e a página pedida (até 1000 linhas por vez; ' +
        'use pular para a próxima). colunas aceita tabela ligada: ' +
        '"id, identificador, cliente(nome_razao), status_operacao(rotulo)". ' +
        'Tabelas principais: cliente, fornecedor, operacao, etapa_operacao (esteira), ' +
        'funil_cartao, funil_tarefa, perfil (pessoas), evento (log de toda mudança, com antes/depois).',
      inputSchema: {
        tabela: z.enum(TABELAS_DE_LEITURA),
        colunas: z.string().optional().describe('Padrão: "*".'),
        filtros: z
          .array(
            z.object({
              coluna: z.string(),
              operador: z.enum(OPERADORES).describe('contem = trecho de texto, sem caixa; em = valor é uma lista'),
              valor: z.union([VALOR, z.array(z.union([z.string(), z.number()]))]).optional(),
            }),
          )
          .optional(),
        ordenar_por: z.string().optional(),
        crescente: z.boolean().optional().describe('Padrão: true.'),
        limite: z.number().int().min(1).max(1000).optional().describe('Padrão: 200.'),
        pular: z.number().int().min(0).optional().describe('Padrão: 0.'),
      },
    },
    async ({ tabela, colunas = '*', filtros = [], ordenar_por, crescente = true, limite = 200, pular = 0 }) => {
      if (!selecaoValida(colunas)) return falhar(`colunas inválidas: "${colunas}".`);
      let q = supabase.from(tabela).select(colunas, { count: 'exact' });
      for (const { coluna, operador, valor } of filtros) {
        if (!colunaValida(coluna)) return falhar(`Coluna inválida: "${coluna}".`);
        switch (operador) {
          case 'contem': {
            const t = termoDeBusca(String(valor ?? ''));
            if (t) q = q.ilike(coluna, `%${t}%`);
            break;
          }
          case 'e_nulo':
            q = q.is(coluna, null);
            break;
          case 'nao_nulo':
            q = q.not(coluna, 'is', null);
            break;
          case 'em':
            if (!Array.isArray(valor)) return falhar(`O filtro "em" de ${coluna} precisa de uma lista.`);
            q = q.in(coluna, valor);
            break;
          default:
            if (Array.isArray(valor)) return falhar(`O filtro ${operador} de ${coluna} não aceita lista.`);
            if (valor === undefined || valor === null) return falhar(`O filtro ${operador} de ${coluna} precisa de valor (para vazio, use e_nulo).`);
            q = q.filter(coluna, operador, String(valor));
        }
      }
      if (ordenar_por) {
        if (!colunaValida(ordenar_por)) return falhar(`Coluna inválida: "${ordenar_por}".`);
        q = q.order(ordenar_por, { ascending: crescente });
      }
      const { data, count, error } = await q.range(pular, pular + limite - 1);
      if (error) return falhar(`Não consegui consultar: ${error.message}`);
      return responder({ total: count, pular, linhas: data });
    },
  );

  /* ------------------------------------------------------------ escrita -- */

  servidor.registerTool(
    'gravar',
    {
      title: 'Criar ou alterar registro (master)',
      description:
        'Cria (sem id) ou altera (com id) um registro em qualquer cadastro: cliente, fornecedor, ' +
        'operacao, etapa_operacao, observações, tags, vínculos, funil_cartao, funil_tarefa… ' +
        'Antes de criar, procure com consultar para não duplicar. Antes de alterar, leia o ' +
        'registro: o que for mandado em campos SUBSTITUI o valor atual. Vínculos (tabelas com ' +
        'chave composta, como cliente_visualizador) só se criam — para tirar, use excluir. ' +
        'Tarefa de reunião com prazo e hora vai para o Google Agenda do responsável. ' +
        'Pessoas não se gravam aqui: use cadastrar_pessoa / atualizar_pessoa.',
      inputSchema: {
        tabela: z.enum(TABELAS_DE_ESCRITA),
        id: z.union([z.string(), z.number()]).optional().describe('id do registro a alterar. Sem id, cria.'),
        campos: z.record(z.string(), z.unknown()).describe('coluna → valor.'),
      },
    },
    async ({ tabela, id, campos }) => {
      const { limpos, recusados } = limparCampos(campos);
      if (recusados.length) return falhar(`Colunas que não se gravam: ${recusados.join(', ')}.`);
      if (!Object.keys(limpos).length) return falhar('Nada para gravar.');

      if (id !== undefined) {
        if (CHAVES_DE_ESCRITA[tabela].join() !== 'id') {
          return falhar(`${tabela} é um vínculo (chave composta): não se altera — exclua e crie de novo.`);
        }
        const { data, error } = await supabase.from(tabela).update(limpos).eq('id', id).select();
        if (error) return falhar(`Não consegui salvar: ${error.message}`);
        if (!data?.length) return falhar('Registro não encontrado.');
        const aviso = tabela === 'funil_tarefa' ? (await sincronizarEventoDaTarefa(String(id), origem)).aviso : undefined;
        return responder({ alterado: data[0], ...(aviso ? { aviso_agenda: aviso } : {}) });
      }

      // Os mesmos valores de partida que o app põe ao criar pela tela.
      const novo: Record<string, unknown> = { ...limpos };
      if ((tabela === 'cliente' || tabela === 'funil_cartao') && !novo.criado_por) novo.criado_por = perfil.id;
      if ((tabela === 'operacao_observacao' || tabela === 'etapa_observacao') && !novo.autor_id) novo.autor_id = perfil.id;
      if (tabela === 'funil_cartao' && !novo.quadro_id) {
        const { data: q } = await supabase.from('funil_quadro').select('id').order('ordem').limit(1);
        novo.quadro_id = q?.[0]?.id;
      }
      if (tabela === 'funil_tarefa' && !novo.quadro_id && novo.cartao_id) {
        const { data: c } = await supabase.from('funil_cartao').select('quadro_id').eq('id', novo.cartao_id).maybeSingle();
        novo.quadro_id = c?.quadro_id;
      }
      if (tabela === 'funil_tarefa' && !novo.responsavel_id) novo.responsavel_id = perfil.id;

      const { data, error } = await supabase.from(tabela).insert(novo).select();
      if (error || !data?.length) return falhar(`Não consegui criar: ${error?.message ?? 'sem retorno'}`);
      const criado = data[0] as Record<string, unknown>;
      const aviso =
        tabela === 'funil_tarefa' ? (await sincronizarEventoDaTarefa(String(criado.id), origem)).aviso : undefined;
      return responder({ criado, ...(aviso ? { aviso_agenda: aviso } : {}) });
    },
  );

  servidor.registerTool(
    'excluir',
    {
      title: 'Excluir registro (master)',
      description:
        'Apaga um registro DE VEZ (fica só no log de evento). ANTES de chamar, mostre à pessoa o ' +
        'que vai ser apagado e espere ela confirmar com um "sim" — nunca exclua por conta própria, ' +
        'nem em lote sem confirmar item por item. Prefira arquivar (gravar arquivado=true) quando ' +
        'a pessoa só quer tirar da frente. chave: {"id": …}, ou as colunas da chave composta ' +
        '(ex.: cliente_visualizador → {"cliente_id": …, "perfil_id": …}).',
      inputSchema: {
        tabela: z.enum(TABELAS_DE_ESCRITA),
        chave: z.record(z.string(), z.union([z.string(), z.number()])),
        pessoa_confirmou: z.literal(true).describe('Só true depois de a pessoa dizer "sim" a esta exclusão.'),
      },
    },
    async ({ tabela, chave }) => {
      const c = chaveCompleta(tabela, chave);
      if (!c.ok) {
        return falhar(
          `Chave de ${tabela}: ${CHAVES_DE_ESCRITA[tabela].join(', ')}.` +
            (c.faltam.length ? ` Faltou: ${c.faltam.join(', ')}.` : '') +
            (c.sobram.length ? ` Sobrou: ${c.sobram.join(', ')}.` : ''),
        );
      }

      // Tarefa com evento na agenda: tira da agenda antes, como o app faz.
      let aviso: string | undefined;
      if (tabela === 'funil_tarefa') {
        const { data: t } = await supabase
          .from('funil_tarefa')
          .select('google_evento_id, google_agenda_de, convidar_contato')
          .eq('id', chave.id)
          .maybeSingle();
        if (t) aviso = (await apagarEventoDaTarefa(t as Parameters<typeof apagarEventoDaTarefa>[0])).aviso;
      }

      let q = supabase.from(tabela).delete();
      for (const [k, v] of Object.entries(chave)) q = q.eq(k, v);
      const { data, error } = await q.select();
      if (error) return falhar(`Não consegui excluir: ${error.message}`);
      if (!data?.length) return falhar('Registro não encontrado.');
      return responder({ excluido: data[0], ...(aviso ? { aviso_agenda: aviso } : {}) });
    },
  );

  /* ------------------------------------------------------------ pessoas -- */

  servidor.registerTool(
    'listar_pessoas',
    {
      title: 'Listar pessoas (master)',
      description: 'Quem tem conta no app: nome, e-mail, nível (master/indicante) e se está ativo.',
      inputSchema: { incluir_inativos: z.boolean().optional().describe('Padrão: false.') },
    },
    async ({ incluir_inativos = false }) => {
      let q = supabase
        .from('perfil')
        .select('id, nome, email, nivel_acesso, ativo, telefone, regiao, vinculado_a_parceiro, criado_em')
        .order('nome');
      if (!incluir_inativos) q = q.eq('ativo', true);
      const { data, error } = await q;
      return error ? falhar(`Não consegui listar: ${error.message}`) : responder(data);
    },
  );

  servidor.registerTool(
    'cadastrar_pessoa',
    {
      title: 'Cadastrar pessoa no app (master)',
      description:
        'Dá acesso ao app a uma pessoa nova. O login é só pelo Google: o e-mail tem que ser a ' +
        'conta Google com que ela vai entrar. indicante só vê os clientes e cartões dele; master ' +
        'vê e faz tudo. Confirme nome, e-mail e nível com a pessoa antes de cadastrar.',
      inputSchema: {
        email: z.string().email(),
        nome: z.string().min(1),
        nivel_acesso: z.enum(NIVEIS).optional().describe('Padrão: indicante.'),
        ...CAMPOS_DA_PESSOA,
      },
    },
    async ({ email, nome, nivel_acesso = 'indicante', ...extras }) => {
      const e = emailNormalizado(email);
      const { data: existente } = await supabase.from('perfil').select('id, nome, ativo').eq('email', e).maybeSingle();
      if (existente) {
        return falhar(
          `Já existe pessoa com ${e}: ${existente.nome}${existente.ativo ? '' : ' (inativa — reative com atualizar_pessoa)'}.`,
        );
      }

      // A conta de login: só a service_role cria. Se a pessoa já entrou uma
      // vez com o Google (sem perfil, ficou sem acesso), a conta já existe.
      const admin = clienteAdmin();
      let usuarioId: string | null = null;
      let criouConta = false;
      const criada = await admin.auth.admin.createUser({ email: e, email_confirm: true, user_metadata: { full_name: nome } });
      if (criada.data.user) {
        usuarioId = criada.data.user.id;
        criouConta = true;
      } else {
        for (let pagina = 1; pagina <= 10 && !usuarioId; pagina++) {
          const { data } = await admin.auth.admin.listUsers({ page: pagina, perPage: 1000 });
          usuarioId = data.users.find((u) => u.email?.toLowerCase() === e)?.id ?? null;
          if (data.users.length < 1000) break;
        }
        if (!usuarioId) return falhar(`Não consegui criar a conta: ${criada.error?.message ?? 'sem retorno'}`);
      }

      // O perfil vai com o token de quem pediu: a RLS confere que é master e
      // o log registra quem cadastrou.
      const { error } = await supabase
        .from('perfil')
        .insert({ id: usuarioId, nome: nome.trim(), email: e, nivel_acesso, ativo: true, ...extras });
      if (error) {
        if (criouConta) await admin.auth.admin.deleteUser(usuarioId);
        return falhar(`Não consegui cadastrar: ${error.message}`);
      }
      return responder({
        id: usuarioId,
        nome,
        email: e,
        nivel_acesso,
        como_entrar: `Abrir ${origem} e clicar em "Entrar com o Google" usando ${e}.`,
      });
    },
  );

  servidor.registerTool(
    'atualizar_pessoa',
    {
      title: 'Alterar pessoa (master)',
      description:
        'Muda dados, nível (master/indicante) ou desativa/reativa uma pessoa. Desativada, ela ' +
        'perde o acesso ao app na hora. O e-mail não muda (é o login).',
      inputSchema: {
        id: z.string().uuid().describe('id da pessoa (de listar_pessoas).'),
        nome: z.string().min(1).optional(),
        nivel_acesso: z.enum(NIVEIS).optional(),
        ativo: z.boolean().optional(),
        ...CAMPOS_DA_PESSOA,
      },
    },
    async ({ id, ...mudancas }) => {
      if (id === perfil.id && (mudancas.ativo === false || mudancas.nivel_acesso === 'indicante')) {
        return falhar('Você não pode tirar o seu próprio acesso de master — peça a outro master.');
      }
      const gravar = Object.fromEntries(Object.entries(mudancas).filter(([, v]) => v !== undefined));
      if (!Object.keys(gravar).length) return falhar('Nada para mudar.');
      const { data, error } = await supabase
        .from('perfil')
        .update(gravar)
        .eq('id', id)
        .select('id, nome, email, nivel_acesso, ativo');
      if (error) return falhar(`Não consegui salvar: ${error.message}`);
      if (!data?.length) return falhar('Pessoa não encontrada.');
      return responder(data[0]);
    },
  );
}

/**
 * A ponte com o Read.ai (specs/12): o Claude lê a reunião pelo conector do
 * Read.ai e registra aqui numa chamada só. Vale para todos — a RLS recorta.
 */
export function registrarReuniao(servidor: McpServer, ctx: ContextoMcp) {
  const { supabase, perfil, origem } = ctx;

  async function idDoResponsavel(quem: string | undefined): Promise<{ id: string } | { erro: string }> {
    if (!quem) return { id: perfil.id };
    const t = termoDeBusca(quem);
    if (!t) return { erro: `Responsável inválido: "${quem}".` };
    const { data } = await supabase.from('perfil').select('id, nome').eq('ativo', true).or(`nome.ilike.%${t}%,email.ilike.%${t}%`);
    if (!data?.length) return { erro: `Ninguém ativo com "${quem}".` };
    if (data.length > 1) return { erro: `Mais de uma pessoa com "${quem}": ${data.map((p) => p.nome).join(', ')}.` };
    return { id: data[0].id as string };
  }

  type Cartao = { id: string; empresa: string; quadro_id: string; historico: string | null; data_call: string | null };
  const COLS = 'id, empresa, quadro_id, historico, data_call';

  servidor.registerTool(
    'registrar_reuniao',
    {
      title: 'Registrar reunião no funil',
      description:
        'Registra uma reunião (por exemplo, lida do Read.ai) no cartão da empresa: anota o resumo ' +
        'no histórico com data e participantes, preenche a data da call se estiver vazia e cria ' +
        'uma tarefa de follow-up para cada próximo passo. Acha o cartão pelo nome da empresa; se ' +
        'não existir, cria (na primeira coluna, ou em coluna). Se houver mais de um parecido, ' +
        'devolve os candidatos — repita com cartao_id.',
      inputSchema: {
        empresa: z.string().min(1),
        resumo: z.string().min(1),
        data: DATA.optional().describe('Data da reunião. Padrão: hoje.'),
        participantes: z.array(z.string()).optional(),
        proximos_passos: z
          .array(
            z.object({
              titulo: z.string().min(1),
              prazo: DATA.optional(),
              responsavel: z.string().optional().describe('Nome ou e-mail. Padrão: você.'),
            }),
          )
          .optional(),
        cartao_id: z.string().uuid().optional(),
        contato: z.string().optional().describe('Usado só se o cartão for criado agora.'),
        coluna: z.string().optional().describe('Coluna do cartão criado agora.'),
        criar_cartao_se_nao_existir: z.boolean().optional().describe('Padrão: true.'),
      },
    },
    async ({
      empresa,
      resumo,
      data = hoje(),
      participantes = [],
      proximos_passos = [],
      cartao_id,
      contato,
      coluna,
      criar_cartao_se_nao_existir = true,
    }) => {
      // Responsáveis antes de gravar qualquer coisa: nome ambíguo não pode
      // deixar a reunião registrada pela metade.
      const responsaveis: string[] = [];
      for (const p of proximos_passos) {
        const r = await idDoResponsavel(p.responsavel);
        if ('erro' in r) return falhar(r.erro);
        responsaveis.push(r.id);
      }

      let cartao: Cartao | null = null;
      let criado = false;

      if (cartao_id) {
        const { data: c } = await supabase.from('funil_cartao').select(COLS).eq('id', cartao_id).maybeSingle();
        if (!c) return falhar('Cartão não encontrado, ou fora do seu acesso.');
        cartao = c as Cartao;
      } else {
        const t = termoDeBusca(empresa);
        const { data: achados } = await supabase
          .from('funil_cartao')
          .select(COLS)
          .eq('arquivado', false)
          .ilike('empresa', `%${t ?? ''}%`)
          .limit(20);
        const lista = (achados ?? []) as Cartao[];
        const exatos = lista.filter((c) => mesmoNome(c.empresa, empresa));
        if (exatos.length === 1) cartao = exatos[0];
        else if (lista.length) {
          return falhar(
            `Mais de um cartão parecido com "${empresa}": ` +
              (exatos.length ? exatos : lista).map((c) => `${c.empresa} (${c.id})`).join('; ') +
              '. Repita com cartao_id.',
          );
        }
      }

      if (!cartao) {
        if (!criar_cartao_se_nao_existir) return falhar(`Não há cartão de "${empresa}" no funil.`);
        const [{ data: quadros }, { data: etapas }] = await Promise.all([
          supabase.from('funil_quadro').select('id').order('ordem').limit(1),
          supabase.from('funil_etapa').select('id, nome, no_fluxo').order('ordem'),
        ]);
        const lista = (etapas ?? []) as Array<{ id: string; nome: string; no_fluxo: boolean }>;
        const etapa = coluna ? lista.find((e) => mesmoNome(e.nome, coluna)) : (lista.find((e) => e.no_fluxo) ?? lista[0]);
        if (coluna && !etapa) return falhar(`Não existe a coluna "${coluna}". Colunas: ${lista.map((e) => e.nome).join(', ')}.`);
        const { data: novo, error } = await supabase
          .from('funil_cartao')
          .insert({
            empresa: empresa.trim(),
            contato: contato ?? null,
            quadro_id: quadros?.[0]?.id,
            etapa_id: etapa?.id ?? null,
            criado_por: perfil.id,
          })
          .select(COLS)
          .single();
        if (error || !novo) return falhar(`Não consegui criar o cartão: ${error?.message ?? 'sem retorno'}`);
        cartao = novo as Cartao;
        criado = true;
      }

      const [a, m, d] = data.split('-');
      const linhas = [
        `Reunião de ${d}/${m}/${a}` + (participantes.length ? ` — participantes: ${participantes.join(', ')}` : ''),
        resumo.trim(),
      ];
      if (proximos_passos.length) linhas.push('Próximos passos:', ...proximos_passos.map((p) => `- ${p.titulo}`));
      const historico = acrescentarAoHistorico(cartao.historico, linhas.join('\n'), perfil.nome, new Date());

      const { error: erroCartao } = await supabase
        .from('funil_cartao')
        .update({ historico, ...(cartao.data_call ? {} : { data_call: data }) })
        .eq('id', cartao.id);
      if (erroCartao) return falhar(`Não consegui anotar no cartão: ${erroCartao.message}`);

      let tarefas = 0;
      for (const [i, p] of proximos_passos.entries()) {
        const { error } = await supabase.from('funil_tarefa').insert({
          cartao_id: cartao.id,
          quadro_id: cartao.quadro_id,
          titulo: p.titulo,
          tipo: 'follow_up',
          prazo: p.prazo ?? null,
          responsavel_id: responsaveis[i],
        });
        if (error) return falhar(`Anotei a reunião, mas não criei a tarefa "${p.titulo}": ${error.message}`);
        tarefas += 1;
      }

      return responder({
        cartao_id: cartao.id,
        empresa: cartao.empresa,
        cartao_criado_agora: criado,
        data_da_reuniao: dataCurta(new Date(`${data}T12:00:00-03:00`)),
        tarefas_criadas: tarefas,
        link: `${origem}/funil`,
      });
    },
  );
}
