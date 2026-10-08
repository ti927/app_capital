-- =============================================================================
-- 013_notas_vistas.sql
--
-- Sino de notas de versão: guarda, por pessoa, a rodada mais recente de
-- docs/notas-de-versao.md que ela já viu (identificador "aaaa-mm-dd-slug"
-- gerado por scripts/gerar-notas-de-versao.mjs). Vale em qualquer aparelho.
--
-- Aditiva: uma coluna nullable. RLS: nada novo — a coluna herda as policies de
-- `perfil`; `perfil_atualiza` (009) já deixa cada um atualizar a própria linha
-- desde que não mude o nivel_acesso.
-- =============================================================================

alter table public.perfil add column if not exists notas_vistas text;
