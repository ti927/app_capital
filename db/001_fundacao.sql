-- =============================================================================
-- 001_fundacao.sql — Fase 0: fundação
--
-- Tipos, perfil ligado ao auth, matriz de acesso, log de evento e helpers de RLS.
-- As tabelas de domínio estão em 002_dominio.sql.
--
-- Fonte: specs/bubble/documentacao-completa.md, FASE 2 (seções 2.1, 2.6, 2.10).
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Option sets do Bubble que viram enum (poucos valores, estáveis, usados em código)
-- -----------------------------------------------------------------------------

-- Option set `niveldeacesso` — 2 opções, não 4.
create type public.nivel_acesso as enum ('master', 'indicante');

-- Option set `p_ginas` — 4 opções, na ordem do Bubble.
create type public.pagina as enum (
  'clientes',
  'fornecedores',
  'operacao',
  'esteira_de_estruturacao'
);

-- -----------------------------------------------------------------------------
-- Helpers
-- -----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- perfil — espelho de auth.users
--
-- De `user` (2.1). Dois campos do Bubble NÃO foram trazidos, de propósito:
--   `senha` (text)  — guardava a senha em texto puro, em paralelo à senha nativa.
--   `Soma Stts em Andamento` / `Soma Stts em Operação Aprovada` (text) — eram
--   totais calculados, gravados como texto. Viram a view `perfil_totais`.
-- -----------------------------------------------------------------------------

create table public.perfil (
  id                    uuid primary key references auth.users (id) on delete cascade,
  nome                  text not null,
  email                 text not null,
  cpf                   text,
  cnpj                  text,
  razao_social          text,
  telefone              text,
  regiao                text,
  nivel_acesso          public.nivel_acesso not null default 'indicante',
  vinculado_a_parceiro  text,
  ativo                 boolean not null default true,
  criado_em             timestamptz not null default now(),
  atualizado_em         timestamptz not null default now()
);

create index perfil_nivel_acesso_idx on public.perfil (nivel_acesso);

create trigger perfil_set_updated_at
  before update on public.perfil
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- acesso_pagina — de `tbl_config` (2.6)
--
-- A matriz de permissão: liga um perfil a uma página e ao nível com que a acessa.
-- -----------------------------------------------------------------------------

create table public.acesso_pagina (
  id            bigint generated always as identity primary key,
  perfil_id     uuid not null references public.perfil (id) on delete cascade,
  pagina        public.pagina not null,
  nivel_acesso  public.nivel_acesso not null,
  criado_em     timestamptz not null default now(),
  unique (perfil_id, pagina)
);

create index acesso_pagina_perfil_idx on public.acesso_pagina (perfil_id);

-- -----------------------------------------------------------------------------
-- Helpers de RLS
--
-- `security definer` + `search_path` fixo: podem ser chamados de dentro de policy
-- sem disparar recursão de RLS sobre `perfil`.
-- -----------------------------------------------------------------------------

create or replace function public.nivel_atual()
returns public.nivel_acesso
language sql
stable
security definer
set search_path = public
as $$
  select nivel_acesso from public.perfil where id = auth.uid() and ativo;
$$;

create or replace function public.eh_master()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.nivel_atual() = 'master', false);
$$;

-- -----------------------------------------------------------------------------
-- evento — log append-only
-- -----------------------------------------------------------------------------

create table public.evento (
  id           bigint generated always as identity primary key,
  tabela       text        not null,
  registro_id  text        not null,
  operacao     text        not null check (operacao in ('INSERT', 'UPDATE', 'DELETE')),
  antes        jsonb,
  depois       jsonb,
  ator_id      uuid,
  ocorrido_em  timestamptz not null default now()
);

create index evento_tabela_registro_idx on public.evento (tabela, registro_id);
create index evento_ocorrido_em_idx     on public.evento (ocorrido_em desc);
create index evento_ator_idx            on public.evento (ator_id);

comment on table public.evento is
  'Log append-only. UPDATE e DELETE revogados; escrito apenas por log_evento().';

create or replace function public.log_evento()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.evento (tabela, registro_id, operacao, antes, depois, ator_id)
  values (
    tg_table_name,
    coalesce(to_jsonb(new) ->> 'id', to_jsonb(old) ->> 'id'),
    tg_op,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end,
    auth.uid()
  );
  return coalesce(new, old);
end;
$$;

comment on function public.log_evento() is
  'Trigger de auditoria. Ligar em toda tabela de domínio.';

revoke update, delete on public.evento from authenticated, anon, public;

create trigger perfil_log
  after insert or update or delete on public.perfil
  for each row execute function public.log_evento();

create trigger acesso_pagina_log
  after insert or update or delete on public.acesso_pagina
  for each row execute function public.log_evento();

-- -----------------------------------------------------------------------------
-- RLS
--
-- DESLIGADA por decisao do projeto em 17/09/2026, para nao travar o
-- desenvolvimento. As policies estao escritas e versionadas em db/003_rls.sql,
-- prontas para aplicar.
--
-- Enquanto estiver assim: toda tabela e legivel e gravavel via PostgREST com a
-- anon key, que sai no bundle do navegador. Ver docs/seguranca.md.
-- -----------------------------------------------------------------------------
