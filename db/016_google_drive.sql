-- =============================================================================
-- 016_google_drive.sql
--
-- Documentos do cliente vindos do Drive compartilhado da Lure
-- (specs/17-google-drive-documentos.md).
--
-- Uma conexão só, da empresa: `id = 1`. Guarda o refresh token cifrado pela
-- aplicação (AES-256-GCM, GOOGLE_TOKEN_CHAVE) e a pasta raiz dos clientes.
--
-- Mesma trava de google_conexao (010): GRANT revogado de anon e authenticated
-- e RLS ligada SEM policy — ninguém logado lê nem grava; só o servidor, com a
-- service_role. "Tabela sem policy fica ilegível para quem está logado" é
-- exatamente o objetivo aqui. Sem trigger de log: token não vai para `evento`.
-- =============================================================================

create table public.google_drive_conexao (
  id                     smallint primary key default 1 check (id = 1),
  conectado_por          uuid references public.perfil (id) on delete set null,
  email_google           text,
  refresh_token_cifrado  text not null,
  pasta_raiz_id          text,
  pasta_raiz_nome        text,
  caiu_em                timestamptz,
  criado_em              timestamptz not null default now(),
  atualizado_em          timestamptz not null default now()
);

create trigger google_drive_conexao_set_updated_at
  before update on public.google_drive_conexao
  for each row execute function public.set_updated_at();

revoke all on public.google_drive_conexao from anon, authenticated;
alter table public.google_drive_conexao enable row level security;
