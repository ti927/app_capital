-- =============================================================================
-- 014_ui_popups.sql
--
-- Preferência de pop-ups de cadastro (cliente, fornecedor, operação), por
-- pessoa: 'classica' (padrão, UI 1) ou 'moderna' (UI 2 — design/ui2-popups.md).
-- Fica em `perfil` para valer em qualquer aparelho.
--
-- RLS: a coluna herda `perfil_le` (009) para leitura. Para gravar, NÃO se usa
-- `perfil_atualiza`: aquela policy deixa a pessoa alterar qualquer coluna da
-- própria linha (nome, ativo…), e a tela de preferência não deve depender
-- disso. A gravação passa por `definir_ui_popups`, security definer que só
-- toca esta coluna e só na linha de `auth.uid()`. O update entra no log de
-- `evento` pelo trigger `perfil_log` existente.
-- =============================================================================

alter table public.perfil
  add column if not exists ui_popups text not null default 'classica'
  check (ui_popups in ('classica', 'moderna'));

create or replace function public.definir_ui_popups(valor text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'sem sessão';
  end if;
  if valor not in ('classica', 'moderna') then
    raise exception 'preferência inválida: %', valor;
  end if;
  update public.perfil set ui_popups = valor where id = auth.uid();
end;
$$;

revoke all on function public.definir_ui_popups(text) from public, anon;
grant execute on function public.definir_ui_popups(text) to authenticated;
