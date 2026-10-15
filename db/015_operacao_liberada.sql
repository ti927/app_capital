-- =============================================================================
-- 015_operacao_liberada.sql
--
-- A 012 fechou operação e o que pende dela para todo indicante. Em 15/10/2026
-- a tela de Operação foi liberada, por pessoa, em `acesso_pagina` (specs/16).
-- Esta migration abre o banco só para quem tem essa linha, e só nas operações
-- dos clientes dele (`clientes_visiveis()` / `operacoes_visiveis()`, db/009).
--
-- O que ele faz é o do Bubble: lê e edita a operação, escreve observações;
-- etapas, declínios e fornecedores só lê. Cadastrar, excluir e mexer em
-- etapa/declínio continuam só de master (as policies da 012 ficam).
--
-- As policies novas somam às `*_master` (permissivas: vale uma OU outra).
-- =============================================================================

create or replace function public.pagina_liberada(p public.pagina)
returns boolean
language sql stable security definer set search_path = public
as $fn$
  select exists (
    select 1 from public.acesso_pagina where perfil_id = auth.uid() and pagina = p
  );
$fn$;

revoke execute on function public.pagina_liberada(public.pagina) from public, anon;
grant execute on function public.pagina_liberada(public.pagina) to authenticated;

-- Operação: lê e edita as dele. Sem insert nem delete.
create policy operacao_liberada_le on public.operacao
  for select to authenticated
  using ((select public.pagina_liberada('operacao')) and cliente_id in (select public.clientes_visiveis()));

create policy operacao_liberada_atualiza on public.operacao
  for update to authenticated
  using ((select public.pagina_liberada('operacao')) and cliente_id in (select public.clientes_visiveis()))
  with check ((select public.pagina_liberada('operacao')) and cliente_id in (select public.clientes_visiveis()));

-- Observações: escreve nas operações dele.
create policy operacao_observacao_liberada on public.operacao_observacao
  for all to authenticated
  using ((select public.pagina_liberada('operacao')) and operacao_id in (select public.operacoes_visiveis()))
  with check ((select public.pagina_liberada('operacao')) and operacao_id in (select public.operacoes_visiveis()));

-- Etapas e declínios: só leitura.
create policy etapa_operacao_liberada_le on public.etapa_operacao
  for select to authenticated
  using ((select public.pagina_liberada('operacao')) and operacao_id in (select public.operacoes_visiveis()));

create policy operacao_declinio_liberada_le on public.operacao_declinio
  for select to authenticated
  using ((select public.pagina_liberada('operacao')) and operacao_id in (select public.operacoes_visiveis()));

-- Fornecedor: o nome do fundo aparece nas etapas e nos declínios (no Bubble o
-- indicante via). Só leitura.
create policy fornecedor_liberada_le on public.fornecedor
  for select to authenticated
  using ((select public.pagina_liberada('operacao')));
