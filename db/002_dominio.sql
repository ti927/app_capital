-- =============================================================================
-- 002_dominio.sql — tabelas de domínio
--
-- Fonte: specs/bubble/documentacao-completa.md, FASE 2 (2.2 a 2.10).
-- Depende de 001_fundacao.sql.
--
-- Os option sets `status.tbl` e `tipo operação op` viram tabela, não enum: têm
-- rótulo, ordem e mudam com o negócio. A coluna `chave_bubble` guarda o valor
-- interno antigo para o de-para da migração — em dois casos ele não bate com o
-- rótulo (ver seed) e é por isso que a coluna existe.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tabelas de apoio (option sets)
-- -----------------------------------------------------------------------------

create table public.status_etapa (
  id            smallint primary key,
  chave         text not null unique,
  rotulo        text not null,
  chave_bubble  text not null,
  ordem         smallint not null
);

comment on column public.status_etapa.chave_bubble is
  'Valor interno no Bubble. Em "ja_cliente_do_fundo" e "declinado_pelo_fundo" ele '
  'não acompanha o rótulo — dívida herdada, mantida só para o de-para.';

insert into public.status_etapa (id, chave, rotulo, chave_bubble, ordem) values
  ( 1, 'aguardando_interesse',          'aguardando interesse',          'aguardando_interesse',           1),
  ( 2, 'teaser_enviado',                'teaser enviado',                'teaser_enviado',                 2),
  ( 3, 'documentacao_inicial_enviada',  'documentação inicial enviada',  'documenta__o_inicial_enviada',   3),
  ( 4, 'docs_requeridos',               'docs requeridos',               'docs_requeridos',                4),
  ( 5, 'operacao_em_analise',           'operação em análise',           'opera__o_em_an_lise',            5),
  ( 6, 'proposta_feita',                'proposta feita',                'proposta_feita',                 6),
  ( 7, 'em_estudo',                     'em estudo',                     'em_estudo',                      7),
  ( 8, 'operacao_aprovada',             'operação aprovada',             'opera__o_aprovada',              8),
  ( 9, 'contrato_enviado',              'contrato enviado',              'contrato_enviado',               9),
  (10, 'contrato_assinado',             'contrato assinado',             'contrato_assinado',             10),
  (11, 'ja_cliente_do_fundo',           'já cliente do fundo',           'opera__o_declinada',            11),
  (12, 'paralisado',                    'paralisado',                    'paralisado',                    12),
  (13, 'declinado_pelo_fundo',          'declinado pelo fundo',          'declinado',                     13),
  (14, 'declinado_pelo_cliente',        'declinado pelo cliente',        'declinado_pelo_cliente',        14);

create table public.tipo_operacao (
  id            smallint primary key,
  chave         text not null unique,
  rotulo        text not null,
  chave_bubble  text not null,
  ordem         smallint not null
);

insert into public.tipo_operacao (id, chave, rotulo, chave_bubble, ordem) values
  ( 1, 'antecipacao_de_contratos',     'Antecipação de Contratos',      'antecipa__o_de_contratos',     0),
  ( 2, 'antecipacao_de_recebiveis',    'Antecipação de Recebíveis',     'antecipa__o_de_receb_veis',    1),
  ( 3, 'aquisicao_de_ativos',          'Aquisição de Ativos',           'aquisi__o_de_ativos',          2),
  ( 4, 'bndes',                        'BNDES',                         'bndes',                        3),
  ( 5, 'cambio',                       'Câmbio',                        'c_mbio_e_derivativos',         4),
  ( 6, 'capital_de_giro',              'Capital de Giro',               'capital_de_giro',              5),
  ( 7, 'cda_wa',                       'CDA - WA',                      'cda___wa',                     6),
  ( 8, 'cr',                           'CR',                            'cr',                           7),
  ( 9, 'ccb',                          'CCB',                           'ccb',                          8),
  (10, 'cci',                          'CCI',                           'cci',                          9),
  (11, 'cpr',                          'CPR',                           'cpr',                         10),
  (12, 'cra',                          'CRA',                           'cra',                         11),
  (13, 'cri',                          'CRI',                           'cri',                         12),
  (14, 'custeio',                      'Custeio',                       'custeio',                     13),
  (15, 'debentures',                   'Debêntures',                    'deb_ntures',                  14),
  (16, 'fco',                          'FCO',                           'fco',                         15),
  (17, 'fgi',                          'FGI',                           'fgi',                         16),
  (18, 'fiagro',                       'FIAGRO',                        'fiagro',                      17),
  (19, 'fidc_proprietario',            'FIDC Proprietário',             'fidc_dedicado',               18),
  (20, 'fii',                          'FII',                           'fii',                         19),
  (21, 'fip',                          'FIP',                           'fip',                         20),
  (22, 'finep',                        'FINEP',                         'finep',                       21),
  (23, 'home_equity',                  'Home Equity',                   'home_equity',                 22),
  (24, 'hot_money',                    'Hot Money',                     'hot_money',                   23),
  (25, 'imobiliaria_incorporadora',    'Imobiliária / Incorporadora',   'imobili_ria___incorporadora', 24),
  (26, 'm_a',                          'M&A',                           'm_a',                         25),
  (27, 'nota_comercial',               'Nota Comercial',                'nota_comercial',              26),
  (28, 'pronaf',                       'PRONAF',                        'pronaf',                      27),
  (29, 'slb',                          'SLB',                           'slb',                         28),
  (30, 'venda_de_ativo',               'Venda',                         'venda_de_ativo',              29),
  (31, 'vendor',                       'Vendor',                        'vendor',                      30);

-- -----------------------------------------------------------------------------
-- cliente (2.2)
--
-- Não reproduzido do Bubble:
--   `operações` (text, lista)  — redundante: operacao.cliente_id já liga os dois.
--   `telefone` era number      — telefone não é número; vira text.
--   `emailscliente` (lista)    — vira cliente_email, que também absorve
--                                tbl_infocliente (2.6), o segundo mecanismo de
--                                e-mail que existia em paralelo.
--   `quem visualiza` (lista)   — vira cliente_visualizador.
-- -----------------------------------------------------------------------------

create table public.cliente (
  id                       uuid primary key default gen_random_uuid(),
  nome_razao               text not null,
  cnpj                     text,
  cidade                   text,
  telefone                 text,
  email                    text,
  atividade_cia            text,
  diretor_gerente          text,
  faturamento_anual        text,
  estimativa_faturamento   text,
  margem_liquida           text,
  passivo_oneroso          text,
  ativos                   text,
  demanda                  text,
  info_adicionais          text,
  parecer                  text,
  status                   text,
  quem_indicou             text,
  arquivado                boolean not null default false,
  bubble_id                text unique,
  criado_em                timestamptz not null default now(),
  atualizado_em            timestamptz not null default now()
);

-- TODO(specs/06): faturamento anual, estimativa, margem líquida, passivo oneroso
-- e ativos são `text` no Bubble e guardam valor monetário em formato livre.
-- Virar numeric depende de decidir o de-para na carga. Mantidos text por ora.

create index cliente_arquivado_idx on public.cliente (arquivado);
create index cliente_cnpj_idx      on public.cliente (cnpj);
create index cliente_nome_idx      on public.cliente (nome_razao);

create trigger cliente_set_updated_at
  before update on public.cliente
  for each row execute function public.set_updated_at();

create table public.cliente_email (
  id          bigint generated always as identity primary key,
  cliente_id  uuid not null references public.cliente (id) on delete cascade,
  email       text not null,
  criado_em   timestamptz not null default now(),
  unique (cliente_id, email)
);

create index cliente_email_cliente_idx on public.cliente_email (cliente_id);

create table public.cliente_visualizador (
  cliente_id  uuid not null references public.cliente (id) on delete cascade,
  perfil_id   uuid not null references public.perfil (id)  on delete cascade,
  criado_em   timestamptz not null default now(),
  primary key (cliente_id, perfil_id)
);

create index cliente_visualizador_perfil_idx on public.cliente_visualizador (perfil_id);

-- -----------------------------------------------------------------------------
-- fornecedor (2.3)
--
-- As cinco listas de tipo de operação (1ª/2ª/3ª Linha, tipos atendidos, tipos
-- não atendidos) viram uma tabela só, com o papel na coluna.
-- `status` e `status fornecedor` coexistiam no Bubble; ficou um só.
-- -----------------------------------------------------------------------------

create table public.fornecedor (
  id                  uuid primary key default gen_random_uuid(),
  nome_fundo          text not null,
  contato             text,
  email               text,
  numero              text,
  cidade              text,
  pf_ou_pj            text,
  status              text,
  na_mao_de           text,
  segmento_foco       text,
  segmento_nao_atua   text,
  operacao_minima     text,
  faturamento_minimo  text,
  fee                 text,
  parecer             text,
  link_indicacao      text,
  arquivado           boolean not null default false,
  bubble_id           text unique,
  criado_em           timestamptz not null default now(),
  atualizado_em       timestamptz not null default now()
);

create index fornecedor_arquivado_idx on public.fornecedor (arquivado);
create index fornecedor_nome_idx      on public.fornecedor (nome_fundo);

create trigger fornecedor_set_updated_at
  before update on public.fornecedor
  for each row execute function public.set_updated_at();

create type public.papel_tipo_operacao as enum (
  'linha_1',
  'linha_2',
  'linha_3',
  'atende',
  'nao_atende'
);

create table public.fornecedor_tipo_operacao (
  fornecedor_id     uuid not null references public.fornecedor (id)    on delete cascade,
  tipo_operacao_id  smallint not null references public.tipo_operacao (id),
  papel             public.papel_tipo_operacao not null,
  primary key (fornecedor_id, tipo_operacao_id, papel)
);

create index fornecedor_tipo_operacao_tipo_idx on public.fornecedor_tipo_operacao (tipo_operacao_id, papel);

-- -----------------------------------------------------------------------------
-- operacao (2.4)
--
-- Não reproduzido: `nome cliente txt` (cópia do nome do cliente — deriva do
-- join), `quais etapas` (lista — etapa_operacao.operacao_id já liga), e o
-- `Status Atual da Operação` em text livre, que passa a referenciar status_etapa.
-- `observação` (lista) vira operacao_observacao, de tbl_observa__es (2.6).
-- `declínios` (lista de fornecedor) vira operacao_declinio.
-- -----------------------------------------------------------------------------

create table public.operacao (
  id                          uuid primary key default gen_random_uuid(),
  identificador               text,
  cliente_id                  uuid references public.cliente (id) on delete restrict,
  tipo_operacao_id            smallint references public.tipo_operacao (id),
  status_id                   smallint references public.status_etapa (id),
  demanda_inicial             text,
  demanda_final               text,
  destino_recurso             text,
  faturamento_anual           text,
  garantias_sugeridas         text,
  limites_fundos_assinados    text,
  prazo                       text,
  carencia                    text,
  pmts                        text,
  comissao                    text,
  parecer                     text,
  tem_fee                     boolean not null default false,
  nda_assinado                boolean not null default false,
  mandato_assinado            boolean not null default false,
  mandato_assinado_fornecedor boolean not null default false,
  estruturacao_em_andamento   boolean not null default false,
  arquivado                   boolean not null default false,
  bubble_id                   text unique,
  criado_em                   timestamptz not null default now(),
  atualizado_em               timestamptz not null default now()
);

create index operacao_cliente_idx    on public.operacao (cliente_id);
create index operacao_status_idx     on public.operacao (status_id);
create index operacao_arquivado_idx  on public.operacao (arquivado);

create trigger operacao_set_updated_at
  before update on public.operacao
  for each row execute function public.set_updated_at();

create table public.operacao_observacao (
  id           bigint generated always as identity primary key,
  operacao_id  uuid not null references public.operacao (id) on delete cascade,
  texto        text not null,
  autor_id     uuid references public.perfil (id),
  criado_em    timestamptz not null default now()
);

create index operacao_observacao_operacao_idx on public.operacao_observacao (operacao_id, criado_em desc);

create table public.operacao_declinio (
  operacao_id    uuid not null references public.operacao (id)   on delete cascade,
  fornecedor_id  uuid not null references public.fornecedor (id) on delete cascade,
  criado_em      timestamptz not null default now(),
  primary key (operacao_id, fornecedor_id)
);

-- -----------------------------------------------------------------------------
-- etapa_operacao (2.5) — a esteira de estruturação
--
-- Os pares Desc/Value do checklist (Arquivos, Regulamento, Contrato de Cessão,
-- Contrato de Cobrança, Integralização Sub, Int Senior, Inc DC, e Cmp1..Cmp4)
-- eram 30+ colunas. Viram etapa_checklist_item, uma linha por item.
-- Campos derivados do Bubble não trazidos: `qual cliente txt`, `fornecedor nome`.
-- -----------------------------------------------------------------------------

create table public.etapa_operacao (
  id                  uuid primary key default gen_random_uuid(),
  operacao_id         uuid not null references public.operacao (id)   on delete cascade,
  cliente_id          uuid references public.cliente (id)             on delete restrict,
  fornecedor_id       uuid references public.fornecedor (id)          on delete restrict,
  status_id           smallint references public.status_etapa (id),
  tipo_operacao_id    smallint references public.tipo_operacao (id),
  na_mao_de           text,
  dt_inicio           date,
  volume              text,
  emissor             text,
  estruturador        text,
  custodiante         text,
  administrador       text,
  agente_fiduciario   text,
  assessoria_legal    text,
  securitizadora      text,
  dtvm                text,
  gestor              text,
  demais              text,
  op_de_pe            boolean not null default false,
  ts_assinado         boolean not null default false,
  fee_recebido        boolean not null default false,
  bubble_id           text unique,
  criado_em           timestamptz not null default now(),
  atualizado_em       timestamptz not null default now()
);

create index etapa_operacao_operacao_idx   on public.etapa_operacao (operacao_id);
create index etapa_operacao_fornecedor_idx on public.etapa_operacao (fornecedor_id);
create index etapa_operacao_status_idx     on public.etapa_operacao (status_id);

create trigger etapa_operacao_set_updated_at
  before update on public.etapa_operacao
  for each row execute function public.set_updated_at();

-- `instrumento` era lista de option.tipo_opera__o
create table public.etapa_instrumento (
  etapa_id          uuid not null references public.etapa_operacao (id) on delete cascade,
  tipo_operacao_id  smallint not null references public.tipo_operacao (id),
  primary key (etapa_id, tipo_operacao_id)
);

create table public.etapa_checklist_item (
  id          bigint generated always as identity primary key,
  etapa_id    uuid not null references public.etapa_operacao (id) on delete cascade,
  chave       text not null,
  rotulo      text not null,
  descricao   text,
  valor       numeric,
  ordem       smallint not null default 0,
  unique (etapa_id, chave)
);

comment on table public.etapa_checklist_item is
  'Substitui os pares <Item>Desc / <Item>Value de etapas_opera__o. '
  'Os itens Cmp1..Cmp4 eram livres: rotulo guarda o que estava em nomeCmpN.';

create index etapa_checklist_item_etapa_idx on public.etapa_checklist_item (etapa_id, ordem);

create table public.etapa_observacao (
  id         bigint generated always as identity primary key,
  etapa_id   uuid not null references public.etapa_operacao (id) on delete cascade,
  texto      text not null,
  autor_id   uuid references public.perfil (id),
  criado_em  timestamptz not null default now()
);

create index etapa_observacao_etapa_idx on public.etapa_observacao (etapa_id, criado_em desc);

-- -----------------------------------------------------------------------------
-- Funil / CRM (2.7)
--
-- `Quadro` (text) aparece em cartão, etapa, tag e tarefa: é o identificador do
-- board. Vira tabela, para a etapa e a tag pertencerem a um quadro de verdade.
-- -----------------------------------------------------------------------------

create table public.funil_quadro (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null unique,
  ordem      smallint not null default 0,
  criado_em  timestamptz not null default now()
);

create table public.funil_etapa (
  id         uuid primary key default gen_random_uuid(),
  quadro_id  uuid not null references public.funil_quadro (id) on delete cascade,
  nome       text not null,
  ordem      smallint not null default 0,
  no_fluxo   boolean not null default true,
  bubble_id  text unique,
  criado_em  timestamptz not null default now()
);

create index funil_etapa_quadro_idx on public.funil_etapa (quadro_id, ordem);

create table public.funil_tag (
  id         uuid primary key default gen_random_uuid(),
  quadro_id  uuid not null references public.funil_quadro (id) on delete cascade,
  nome       text not null,
  cor        text,
  ativo      boolean not null default true,
  bubble_id  text unique,
  criado_em  timestamptz not null default now()
);

create index funil_tag_quadro_idx on public.funil_tag (quadro_id);

create table public.funil_cartao (
  id                 uuid primary key default gen_random_uuid(),
  quadro_id          uuid not null references public.funil_quadro (id) on delete cascade,
  etapa_id           uuid references public.funil_etapa (id) on delete set null,
  empresa            text not null,
  contato            text,
  segmento           text,
  faturamento        text,
  indicante          text,
  parecer            text,
  historico          text,
  ordem              integer not null default 0,
  data_kb            date,
  data_call          date,
  arquivado          boolean not null default false,
  bubble_id          text unique,
  criado_em          timestamptz not null default now(),
  atualizado_em      timestamptz not null default now()
);

create index funil_cartao_quadro_idx    on public.funil_cartao (quadro_id, arquivado);
create index funil_cartao_etapa_idx     on public.funil_cartao (etapa_id, ordem);

create trigger funil_cartao_set_updated_at
  before update on public.funil_cartao
  for each row execute function public.set_updated_at();

create table public.funil_cartao_tag (
  cartao_id  uuid not null references public.funil_cartao (id) on delete cascade,
  tag_id     uuid not null references public.funil_tag (id)    on delete cascade,
  primary key (cartao_id, tag_id)
);

create table public.funil_cartao_usuario (
  cartao_id  uuid not null references public.funil_cartao (id) on delete cascade,
  perfil_id  uuid not null references public.perfil (id)       on delete cascade,
  primary key (cartao_id, perfil_id)
);

create index funil_cartao_usuario_perfil_idx on public.funil_cartao_usuario (perfil_id);

create table public.funil_tarefa (
  id              uuid primary key default gen_random_uuid(),
  cartao_id       uuid references public.funil_cartao (id) on delete cascade,
  quadro_id       uuid not null references public.funil_quadro (id) on delete cascade,
  titulo          text not null,
  ordem           integer not null default 0,
  prazo           date,
  data_conclusao  timestamptz,
  concluida       boolean not null default false,
  responsavel_id  uuid references public.perfil (id) on delete set null,
  bubble_id       text unique,
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now()
);

create index funil_tarefa_cartao_idx      on public.funil_tarefa (cartao_id);
create index funil_tarefa_responsavel_idx on public.funil_tarefa (responsavel_id, concluida);

create trigger funil_tarefa_set_updated_at
  before update on public.funil_tarefa
  for each row execute function public.set_updated_at();

create table public.funil_tarefa_usuario (
  tarefa_id  uuid not null references public.funil_tarefa (id) on delete cascade,
  perfil_id  uuid not null references public.perfil (id)       on delete cascade,
  primary key (tarefa_id, perfil_id)
);

-- -----------------------------------------------------------------------------
-- Formulário de pesquisa (2.8)
--
-- Eram P1..P16 em colunas, com a numeração interna trocada (p10_text aparecia
-- como P11 e p101_text como P10). Normalizado: uma linha por resposta.
-- A troca se resolve no script de carga, não no esquema.
-- -----------------------------------------------------------------------------

create table public.formulario_resposta (
  id         uuid primary key default gen_random_uuid(),
  bubble_id  text unique,
  criado_em  timestamptz not null default now()
);

create table public.formulario_resposta_item (
  id           bigint generated always as identity primary key,
  resposta_id  uuid not null references public.formulario_resposta (id) on delete cascade,
  pergunta     text not null,
  valor        text,
  ordem        smallint not null default 0,
  unique (resposta_id, pergunta)
);

create index formulario_resposta_item_resposta_idx on public.formulario_resposta_item (resposta_id, ordem);

-- =============================================================================
-- Auditoria
--
-- A trigger de log vale para toda tabela de dominio (CLAUDE.md, regra 3).
-- RLS nao entra aqui: esta desligada por decisao do projeto e as policies
-- ficam em db/003_rls.sql, nao aplicadas.
-- =============================================================================

do $sql$
declare
  t text;
  tabelas text[] := array[
    'cliente', 'cliente_email', 'cliente_visualizador',
    'fornecedor', 'fornecedor_tipo_operacao',
    'operacao', 'operacao_observacao', 'operacao_declinio',
    'etapa_operacao', 'etapa_instrumento', 'etapa_checklist_item', 'etapa_observacao',
    'funil_quadro', 'funil_etapa', 'funil_tag', 'funil_cartao',
    'funil_cartao_tag', 'funil_cartao_usuario',
    'funil_tarefa', 'funil_tarefa_usuario',
    'formulario_resposta', 'formulario_resposta_item'
  ];
begin
  foreach t in array tabelas loop
    execute format(
      'create trigger %I after insert or update or delete on public.%I
         for each row execute function public.log_evento()',
      t || '_log', t
    );
  end loop;
end;
$sql$;
