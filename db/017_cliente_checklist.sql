-- =============================================================================
-- 017_cliente_checklist.sql
--
-- Checklist de documentos do cliente (specs/18-checklist-documentos.md).
--
-- Os itens padrão (BP, DRE, contrato social…) vivem no código
-- (src/lib/checklist/itens.ts). Esta tabela guarda só:
--   * a marcação À MÃO de um item padrão (`chave` preenchida, `status` não nulo);
--   * os itens extras do cliente (`titulo` preenchido), com ou sem marcação.
-- Item sem linha (ou com `status` nulo) segue a varredura do Drive: achou
-- arquivo, aparece "recebido". Marcação à mão sempre ganha da varredura.
--
-- RLS: quem enxerga o cliente lê e escreve a checklist dele (master todos;
-- indicante os clientes dele) — a mesma regra de `cliente_email` (009).
-- Log: trigger `log_evento`, como as demais tabelas de domínio.
-- =============================================================================

create table public.cliente_checklist_item (
  id             uuid primary key default gen_random_uuid(),
  cliente_id     uuid not null references public.cliente (id) on delete cascade,
  chave          text,
  titulo         text,
  status         text check (status in ('nao_recebido', 'recebido', 'parcial', 'nao_se_aplica')),
  origem         text not null default 'app' check (origem in ('app', 'mcp')),
  observacao     text,
  atualizado_por uuid references public.perfil (id) on delete set null,
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now(),
  -- Ou é item padrão (chave), ou é item extra (titulo) — nunca os dois.
  constraint cliente_checklist_item_tipo check ((chave is null) <> (titulo is null)),
  constraint cliente_checklist_item_titulo check (titulo is null or length(btrim(titulo)) between 1 and 200),
  -- Unique inteiro (não parcial) para o upsert do PostgREST achar o alvo;
  -- itens extras têm chave nula, e nulos não colidem entre si.
  constraint cliente_checklist_item_chave_uq unique (cliente_id, chave)
);

create trigger cliente_checklist_item_set_updated_at
  before update on public.cliente_checklist_item
  for each row execute function public.set_updated_at();

create trigger cliente_checklist_item_log
  after insert or update or delete on public.cliente_checklist_item
  for each row execute function public.log_evento();

alter table public.cliente_checklist_item enable row level security;
revoke all on public.cliente_checklist_item from anon;
grant select, insert, update, delete on public.cliente_checklist_item to authenticated;

create policy cliente_checklist_item_acessa on public.cliente_checklist_item
  for all to authenticated
  using ((select public.eh_master()) or cliente_id in (select public.clientes_visiveis()))
  with check ((select public.eh_master()) or cliente_id in (select public.clientes_visiveis()));
