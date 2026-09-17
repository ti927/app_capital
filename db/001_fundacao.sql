-- =============================================================================
-- 001_fundacao.sql — Fase 0
--
-- Só a fundação: log de evento, níveis de acesso, perfil ligado ao auth, e RLS
-- ligada em tudo. NÃO cria tabela de domínio (cliente, carteira, fornecedor,
-- etapa...) porque o modelo de dados ainda não está especificado —
-- ver specs/LEIA-ME.md.
--
-- Não aplicado a nenhum banco ainda.
-- =============================================================================

create extension if not exists "pgcrypto";

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
-- nivel_acesso
--
-- São quatro. Os nomes vêm de specs/03-acessos.md, que ainda não existe —
-- por isso o seed está comentado em vez de inventado.
-- -----------------------------------------------------------------------------

create table public.nivel_acesso (
  id          smallint primary key,
  chave       text not null unique,
  nome        text not null,
  descricao   text,
  criado_em   timestamptz not null default now()
);

comment on table public.nivel_acesso is
  'Os quatro níveis de acesso. Seed pendente de specs/03-acessos.md.';

-- TODO(specs/03-acessos.md): preencher com os nomes reais antes da Fase 1.
-- insert into public.nivel_acesso (id, chave, nome) values
--   (1, '...', '...'),
--   (2, '...', '...'),
--   (3, '...', '...'),
--   (4, '...', '...');

-- -----------------------------------------------------------------------------
-- perfil — espelho de auth.users com o nível de acesso
--
-- PROVISÓRIO: os campos precisam ser reconciliados com specs/03-acessos.md e com
-- o de-para do usuário do Bubble. O que está aqui é o mínimo para a RLS existir.
-- -----------------------------------------------------------------------------

create table public.perfil (
  id               uuid primary key references auth.users (id) on delete cascade,
  nome             text not null,
  email            text not null,
  nivel_acesso_id  smallint not null references public.nivel_acesso (id),
  ativo            boolean not null default true,
  criado_em        timestamptz not null default now(),
  atualizado_em    timestamptz not null default now()
);

create index perfil_nivel_acesso_id_idx on public.perfil (nivel_acesso_id);

create trigger perfil_set_updated_at
  before update on public.perfil
  for each row execute function public.set_updated_at();

-- Nível de acesso do usuário da sessão. `stable` e `security definer` para poder
-- ser chamada de dentro de policy sem recursão de RLS.
create or replace function public.nivel_acesso_atual()
returns smallint
language sql
stable
security definer
set search_path = public
as $$
  select nivel_acesso_id from public.perfil where id = auth.uid() and ativo;
$$;

-- -----------------------------------------------------------------------------
-- evento — log append-only
--
-- UPDATE e DELETE são revogados na tabela, inclusive para authenticated e anon.
-- Só a trigger (security definer) escreve.
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
declare
  v_registro_id text;
begin
  v_registro_id := coalesce(
    (to_jsonb(new) ->> 'id'),
    (to_jsonb(old) ->> 'id')
  );

  insert into public.evento (tabela, registro_id, operacao, antes, depois, ator_id)
  values (
    tg_table_name,
    v_registro_id,
    tg_op,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end,
    auth.uid()
  );

  return coalesce(new, old);
end;
$$;

comment on function public.log_evento() is
  'Trigger de auditoria. Ligar em toda tabela de domínio: '
  'create trigger <t>_log after insert or update or delete on public.<t> '
  'for each row execute function public.log_evento();';

revoke update, delete on public.evento from authenticated, anon, public;

create trigger perfil_log
  after insert or update or delete on public.perfil
  for each row execute function public.log_evento();

-- -----------------------------------------------------------------------------
-- RLS — ligada em toda tabela, sem exceção
-- -----------------------------------------------------------------------------

alter table public.nivel_acesso enable row level security;
alter table public.perfil       enable row level security;
alter table public.evento       enable row level security;

-- nivel_acesso: leitura para quem está autenticado; escrita só por service_role.
create policy nivel_acesso_leitura on public.nivel_acesso
  for select to authenticated
  using (true);

-- perfil: cada um lê e edita o seu. A visão ampla depende de specs/03-acessos.md
-- e entra na Fase 1 — não vou adivinhar qual nível vê quem.
create policy perfil_le_o_proprio on public.perfil
  for select to authenticated
  using (id = auth.uid());

create policy perfil_edita_o_proprio on public.perfil
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and nivel_acesso_id = public.nivel_acesso_atual());

-- evento: ninguém lê pelo cliente por enquanto. Sem policy de select, a RLS nega.
-- A tela de auditoria define o recorte na fase em que for construída.
