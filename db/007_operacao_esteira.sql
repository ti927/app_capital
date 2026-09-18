-- =============================================================================
-- 007_operacao_esteira.sql — índice da esteira de estruturação
--
-- Fonte: specs/bubble/documentacao-completa.md:1611 — a esteira lista só
-- operação com `Estruturação em Andamento = true` e `arquivado = false`.
-- Roteiro: specs/08b-operacao-esteira.md (B1).
--
-- Nenhuma coluna nova: `operacao.estruturacao_em_andamento` já existe desde
-- 002_dominio.sql. Índice parcial — só as linhas em estruturação entram nele,
-- que é exatamente o recorte da consulta da tela.
-- =============================================================================

create index if not exists operacao_estruturacao_idx
  on public.operacao (estruturacao_em_andamento, arquivado)
  where estruturacao_em_andamento;
