#!/usr/bin/env node
/**
 * Servidor MCP do app_capital.
 *
 * Expõe o banco da Lure Capital como ferramentas para um agente — para
 * perguntar "quais operações estão paradas no fundo X?" sem abrir o SQL.
 *
 * **Só leitura, e a trava é do banco.** Nenhuma ferramenta escreve, e a sessão
 * abre com `set session characteristics as transaction read only`: UPDATE,
 * DELETE e DDL falham no servidor, não aqui. O motivo é simples: este servidor
 * conecta com a senha do Postgres, que ignora qualquer permissão, e a RLS do
 * projeto está desligada. Dar escrita aqui seria dar escrita irrestrita a quem
 * rodar o agente.
 *
 * Não use `options: '-c default_transaction_read_only=on'` na conexão: o
 * pooler do Supabase descarta opções de startup e a trava não vale nada —
 * medido, não suposto.
 *
 * Configuração e uso: mcp/README.md
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

/* ------------------------------------------------------------------ conexão */

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function conexao() {
  if (process.env.DIRECT_URL) return process.env.DIRECT_URL;

  // Sem variável de ambiente, lê o .env do projeto.
  const arquivo = path.join(RAIZ, '.env');
  if (!fs.existsSync(arquivo)) {
    throw new Error('Defina DIRECT_URL no ambiente, ou tenha um .env na raiz do projeto.');
  }
  const linhas = fs.readFileSync(arquivo, 'utf8').split(/\r?\n/);
  for (const l of linhas) {
    if (l.trimStart().startsWith('#') || !l.includes('=')) continue;
    const i = l.indexOf('=');
    if (l.slice(0, i).trim() === 'DIRECT_URL') return l.slice(i + 1).trim();
  }
  throw new Error('DIRECT_URL não encontrada no .env.');
}

const cliente = new pg.Client({
  connectionString: conexao(),
  ssl: { rejectUnauthorized: false },
});

/** Consulta parametrizada. Nunca concatene valor de entrada em SQL. */
async function consultar(sql, parametros = []) {
  const { rows } = await cliente.query(sql, parametros);
  return rows;
}

/** Resposta padrão: JSON, que é o que o agente lê melhor. */
const responder = (dados) => ({
  content: [{ type: 'text', text: JSON.stringify(dados, null, 2) }],
});

const servidor = new McpServer({ name: 'app-capital', version: '1.0.0' });

/* -------------------------------------------------------------- catálogos -- */

servidor.registerTool(
  'listar_tabelas_de_apoio',
  {
    title: 'Tabelas de apoio',
    description:
      'Os option sets migrados do Bubble: os 14 status de etapa, os 31 tipos de ' +
      'operação e os 4 status de operação. Use para saber os valores válidos ' +
      'antes de filtrar por eles.',
    inputSchema: {},
  },
  async () =>
    responder({
      status_etapa: await consultar('select id, chave, rotulo, ordem from status_etapa order by ordem'),
      tipo_operacao: await consultar('select id, chave, rotulo, ordem from tipo_operacao order by ordem'),
      status_operacao: await consultar('select id, chave, rotulo, ordem from status_operacao order by ordem'),
    }),
);

/* ---------------------------------------------------------------- clientes - */

servidor.registerTool(
  'buscar_clientes',
  {
    title: 'Buscar clientes',
    description:
      'Clientes por trecho do nome, razão social ou CNPJ. Sem termo, devolve os ' +
      'primeiros em ordem alfabética. Traz quantas operações cada um tem.',
    inputSchema: {
      termo: z.string().optional().describe('Trecho do nome, razão social ou CNPJ.'),
      incluir_arquivados: z.boolean().optional().describe('Padrão: false.'),
      limite: z.number().int().min(1).max(200).optional().describe('Padrão: 50.'),
    },
  },
  async ({ termo, incluir_arquivados = false, limite = 50 }) =>
    responder(
      await consultar(
        `select c.id, c.nome_razao, c.cnpj, c.cidade, c.status, c.demanda,
                c.faturamento_anual, c.arquivado,
                (select count(*) from operacao o where o.cliente_id = c.id) as operacoes
           from cliente c
          where ($1::text is null or c.nome_razao ilike '%' || $1 || '%' or c.cnpj ilike '%' || $1 || '%')
            and ($2::boolean or not c.arquivado)
          order by c.nome_razao
          limit $3`,
        [termo ?? null, incluir_arquivados, limite],
      ),
    ),
);

servidor.registerTool(
  'detalhar_cliente',
  {
    title: 'Detalhar cliente',
    description: 'Ficha completa de um cliente, com e-mails, quem o enxerga e as operações dele.',
    inputSchema: { cliente_id: z.string().uuid().describe('id do cliente.') },
  },
  async ({ cliente_id }) => {
    const [cadastro] = await consultar('select * from cliente where id = $1', [cliente_id]);
    if (!cadastro) return responder({ erro: 'Cliente não encontrado.' });
    return responder({
      cadastro,
      emails: await consultar('select email from cliente_email where cliente_id = $1 order by email', [cliente_id]),
      quem_visualiza: await consultar(
        `select p.nome, p.email, p.nivel_acesso
           from cliente_visualizador v join perfil p on p.id = v.perfil_id
          where v.cliente_id = $1 order by p.nome`,
        [cliente_id],
      ),
      operacoes: await consultar(
        `select o.id, o.identificador, so.rotulo as status, o.demanda_inicial,
                o.demanda_final, o.arquivado
           from operacao o left join status_operacao so on so.id = o.status_operacao_id
          where o.cliente_id = $1 order by o.identificador`,
        [cliente_id],
      ),
    });
  },
);

/* ------------------------------------------------------------- fornecedores */

servidor.registerTool(
  'buscar_fornecedores',
  {
    title: 'Buscar fornecedores',
    description:
      'Fundos por nome, segmento foco ou tipo de operação que atendem. ' +
      '`tipo_operacao` aceita o rótulo — use listar_tabelas_de_apoio para ver quais existem.',
    inputSchema: {
      termo: z.string().optional().describe('Trecho do nome do fundo ou do segmento foco.'),
      tipo_operacao: z.string().optional().describe('Rótulo do tipo, ex.: "CRI", "Capital de Giro".'),
      incluir_arquivados: z.boolean().optional().describe('Padrão: false.'),
      limite: z.number().int().min(1).max(200).optional().describe('Padrão: 50.'),
    },
  },
  async ({ termo, tipo_operacao, incluir_arquivados = false, limite = 50 }) =>
    responder(
      await consultar(
        `select f.id, f.nome_fundo, f.contato, f.cidade, f.status, f.segmento_foco,
                f.operacao_minima, f.faturamento_minimo, f.arquivado,
                (select string_agg(t.rotulo, ', ' order by t.ordem)
                   from fornecedor_tipo_operacao ft join tipo_operacao t on t.id = ft.tipo_operacao_id
                  where ft.fornecedor_id = f.id and ft.papel = 'atende') as atende
           from fornecedor f
          where ($1::text is null or f.nome_fundo ilike '%' || $1 || '%' or f.segmento_foco ilike '%' || $1 || '%')
            and ($2::text is null or exists (
                  select 1 from fornecedor_tipo_operacao ft join tipo_operacao t on t.id = ft.tipo_operacao_id
                   where ft.fornecedor_id = f.id and ft.papel = 'atende' and t.rotulo ilike $2))
            and ($3::boolean or not f.arquivado)
          order by f.nome_fundo
          limit $4`,
        [termo ?? null, tipo_operacao ?? null, incluir_arquivados, limite],
      ),
    ),
);

/* --------------------------------------------------------------- operações - */

servidor.registerTool(
  'buscar_operacoes',
  {
    title: 'Buscar operações',
    description:
      'Operações com o nome do cliente, o status e quantas etapas têm. ' +
      'Filtra por cliente, por status da operação e por fundo envolvido.',
    inputSchema: {
      termo: z.string().optional().describe('Trecho do nome do cliente ou do identificador.'),
      status: z.string().optional().describe('Rótulo do status: Inicial, Em andamento, Operação Aprovada, Excluído ou Paralisado.'),
      fundo: z.string().optional().describe('Trecho do nome de um fundo envolvido em alguma etapa.'),
      incluir_arquivadas: z.boolean().optional().describe('Padrão: false.'),
      limite: z.number().int().min(1).max(200).optional().describe('Padrão: 50.'),
    },
  },
  async ({ termo, status, fundo, incluir_arquivadas = false, limite = 50 }) =>
    responder(
      await consultar(
        `select o.id, o.identificador, c.nome_razao as cliente, so.rotulo as status,
                o.demanda_inicial, o.demanda_final, o.comissao, o.arquivado,
                (select count(*) from etapa_operacao e where e.operacao_id = o.id) as etapas
           from operacao o
           left join cliente c on c.id = o.cliente_id
           left join status_operacao so on so.id = o.status_operacao_id
          where ($1::text is null or c.nome_razao ilike '%' || $1 || '%' or o.identificador ilike '%' || $1 || '%')
            and ($2::text is null or so.rotulo ilike $2)
            and ($3::text is null or exists (
                  select 1 from etapa_operacao e join fornecedor f on f.id = e.fornecedor_id
                   where e.operacao_id = o.id and f.nome_fundo ilike '%' || $3 || '%'))
            and ($4::boolean or not o.arquivado)
          order by c.nome_razao nulls last, o.identificador
          limit $5`,
        [termo ?? null, status ?? null, fundo ?? null, incluir_arquivadas, limite],
      ),
    ),
);

servidor.registerTool(
  'detalhar_operacao',
  {
    title: 'Detalhar operação',
    description:
      'A operação com suas etapas (uma por fundo), as observações e os declínios. ' +
      'É a visão que a tela de Operação mostra no diálogo.',
    inputSchema: { operacao_id: z.string().uuid().describe('id da operação.') },
  },
  async ({ operacao_id }) => {
    const [operacao] = await consultar(
      `select o.*, c.nome_razao as cliente, so.rotulo as status
         from operacao o
         left join cliente c on c.id = o.cliente_id
         left join status_operacao so on so.id = o.status_operacao_id
        where o.id = $1`,
      [operacao_id],
    );
    if (!operacao) return responder({ erro: 'Operação não encontrada.' });
    return responder({
      operacao,
      etapas: await consultar(
        `select e.id, f.nome_fundo as fundo, t.rotulo as tipo_operacao,
                s.rotulo as status, e.na_mao_de, e.volume, e.dt_inicio, e.atualizado_em
           from etapa_operacao e
           left join fornecedor f on f.id = e.fornecedor_id
           left join tipo_operacao t on t.id = e.tipo_operacao_id
           left join status_etapa s on s.id = e.status_id
          where e.operacao_id = $1
          order by f.nome_fundo nulls last`,
        [operacao_id],
      ),
      observacoes: await consultar(
        'select texto, criado_em from operacao_observacao where operacao_id = $1 order by criado_em',
        [operacao_id],
      ),
      declinios: await consultar(
        `select f.nome_fundo from operacao_declinio d join fornecedor f on f.id = d.fornecedor_id
          where d.operacao_id = $1 order by f.nome_fundo`,
        [operacao_id],
      ),
    });
  },
);

/* ------------------------------------------------------------------ funil -- */

servidor.registerTool(
  'listar_funil',
  {
    title: 'Funil comercial',
    description: 'O quadro do funil por coluna, com os cartões e as tags de cada um.',
    inputSchema: {
      incluir_arquivados: z.boolean().optional().describe('Padrão: false.'),
    },
  },
  async ({ incluir_arquivados = false }) =>
    responder(
      await consultar(
        `select et.nome as coluna, et.ordem,
                k.empresa, k.contato, k.segmento, k.faturamento, k.indicante,
                k.data_call, k.data_kb, k.arquivado,
                (select string_agg(tg.nome, ', ' order by tg.nome)
                   from funil_cartao_tag ct join funil_tag tg on tg.id = ct.tag_id
                  where ct.cartao_id = k.id) as tags
           from funil_cartao k
           left join funil_etapa et on et.id = k.etapa_id
          where ($1::boolean or not k.arquivado)
          order by et.ordem nulls last, k.ordem`,
        [incluir_arquivados],
      ),
    ),
);

/* --------------------------------------------------------------- panorama -- */

servidor.registerTool(
  'panorama',
  {
    title: 'Panorama da base',
    description:
      'Contagens e distribuições: quantos clientes, fundos e operações, como se ' +
      'distribuem os status das etapas e quantas operações cada fundo tem. ' +
      'Bom ponto de partida antes de perguntas específicas.',
    inputSchema: {},
  },
  async () =>
    responder({
      contagens: (
        await consultar(`
          select
            (select count(*) from cliente where not arquivado)    as clientes,
            (select count(*) from fornecedor where not arquivado) as fornecedores,
            (select count(*) from operacao where not arquivado)   as operacoes,
            (select count(*) from etapa_operacao)                 as etapas,
            (select count(*) from funil_cartao where not arquivado) as cartoes_no_funil,
            (select count(*) from perfil where ativo)             as contas`)
      )[0],
      status_das_etapas: await consultar(
        `select s.rotulo, count(*)::int as etapas
           from etapa_operacao e join status_etapa s on s.id = e.status_id
          group by s.rotulo order by 2 desc`,
      ),
      operacoes_por_status: await consultar(
        `select so.rotulo, count(*)::int as operacoes
           from operacao o join status_operacao so on so.id = o.status_operacao_id
          where not o.arquivado group by so.rotulo order by 2 desc`,
      ),
      fundos_mais_acionados: await consultar(
        `select f.nome_fundo, count(*)::int as etapas
           from etapa_operacao e join fornecedor f on f.id = e.fornecedor_id
          group by f.nome_fundo order by 2 desc limit 10`,
      ),
    }),
);

/* ------------------------------------------------------------------ início - */

await cliente.connect();

// A trava de leitura tem que vir depois do connect: é um comando de sessão,
// não uma opção de conexão. Daqui para a frente o banco recusa toda escrita.
await cliente.query('set session characteristics as transaction read only');

await servidor.connect(new StdioServerTransport());

for (const sinal of ['SIGINT', 'SIGTERM']) {
  process.on(sinal, async () => {
    await cliente.end().catch(() => {});
    process.exit(0);
  });
}
