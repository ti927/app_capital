-- =============================================================================
-- 010_google_agenda.sql
--
-- Tarefa de reunião do funil vira evento no Google Agenda do responsável
-- (specs/11-google-agenda.md).
--
-- google_conexao guarda o refresh token de cada pessoa que conectou a agenda.
-- A RLS do projeto está desligada (CLAUDE.md, regra 1), então a trava aqui é
-- de GRANT, que vale com ou sem RLS: anon e authenticated não leem nem gravam
-- esta tabela. Quem lê é só o servidor, com a service_role. A RLS ligada sem
-- policy é a segunda trava, para o dia em que alguém devolver o GRANT.
--
-- O token vai cifrado pela aplicação (AES-256-GCM, GOOGLE_TOKEN_CHAVE). Sem
-- trigger de log: log_evento copia a linha para `evento`, e token não vai
-- para lá.
--
-- As colunas novas de funil_tarefa já são cobertas pelo trigger de log de
-- 002 e pelas policies de 009 — coluna nova não pede policy nova.
-- =============================================================================

create table public.google_conexao (
  perfil_id              uuid primary key references public.perfil (id) on delete cascade,
  email_google           text,
  refresh_token_cifrado  text not null,
  caiu_em                timestamptz,
  criado_em              timestamptz not null default now(),
  atualizado_em          timestamptz not null default now()
);

create trigger google_conexao_set_updated_at
  before update on public.google_conexao
  for each row execute function public.set_updated_at();

revoke all on public.google_conexao from anon, authenticated;
alter table public.google_conexao enable row level security;

alter table public.funil_tarefa
  add column google_evento_id  text,
  add column google_agenda_de  uuid references public.perfil (id) on delete set null,
  add column meet_link         text,
  add column convidar_contato  boolean not null default false,
  add column email_convidado   text;
