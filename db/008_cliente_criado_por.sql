-- =============================================================================
-- 008_cliente_criado_por.sql
--
-- Quem cadastrou o cliente. O recorte do indicante, no Bubble, e a uniao de
-- duas coisas (documentacao-completa.md, dd.qualcliente):
--
--   Do a search for cliente where arquivado = false
--     :filtered( quem visualiza contains Current User )
--     ? cond NivelDeAcesso = "indicante" ->
--         ... AND Created By = Current User
--
-- A primeira metade ja existia aqui (cliente_visualizador). A segunda nao
-- tinha como existir: a tabela nao guardava o autor. `Created By` e coluna de
-- sistema no Bubble; aqui vira uma coluna explicita.
--
-- Fica nulo para os 51 clientes que vieram da carga: ninguem no Bubble e
-- "autor" deles do ponto de vista desta aplicacao, e inventar um autor mudaria
-- quem enxerga o que. Cliente sem autor aparece so por cliente_visualizador,
-- como ja era.
--
-- A policy de db/003_rls.sql precisa da mesma uniao quando a RLS for ligada.
-- =============================================================================

alter table public.cliente
  add column criado_por uuid references public.perfil (id) on delete set null;

create index cliente_criado_por_idx on public.cliente (criado_por);
