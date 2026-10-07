-- =============================================================================
-- 011_sincronizacao_espelho.sql — marca de origem nos filhos
--
-- A sincronização com o Bubble passou a ESPELHAR (specs/10, decisão de
-- 07/10/2026): atualiza o que mudou lá, arquiva o que sumiu de lá e
-- reconcilia os filhos de cada pai. Reconciliar filho significa também
-- REMOVER o que saiu do Bubble — e remover só é seguro se der para distinguir
-- o filho que veio do Bubble do que alguém criou aqui na tela (um
-- visualizador concedido, uma observação digitada, uma tag posta no cartão).
--
-- As tabelas filhas não têm bubble_id (e a maioria nem tem id próprio: a chave
-- é composta). Em vez de inventar um bubble_id que o Bubble não tem, cada
-- filha ganha uma marca booleana:
--
--   origem_bubble = true   a sincronização viu esse vínculo no Bubble.
--   origem_bubble = false  criado aqui, OU veio da carga inicial e a
--                          sincronização ainda não o reviu. Nunca é removido.
--
-- Default false de propósito: as linhas que já existem (carga de 21/09) não
-- têm como ser distinguidas das locais, então começam protegidas. Na primeira
-- sincronização, o vínculo que o Bubble ainda tem é remarcado como true; só a
-- partir daí uma saída do Bubble o remove. O erro possível é deixar um filho
-- velho para trás, nunca apagar trabalho feito aqui.
--
-- RLS: nenhuma tabela nova e nenhuma policy nova. Coluna nova herda as
-- policies da tabela (db/009: master escreve tudo, indicante pelo recorte do
-- pai), e a sincronização roda como master. A trigger de log de `evento` já
-- cobre as tabelas filhas. Regra do projeto: tabela nova nasce com policy;
-- aqui não há tabela nova.
--
-- NÃO aplicada ainda — rodar depois de revisar.
-- =============================================================================

alter table public.fornecedor_tipo_operacao add column if not exists origem_bubble boolean not null default false;
alter table public.cliente_email            add column if not exists origem_bubble boolean not null default false;
alter table public.cliente_visualizador     add column if not exists origem_bubble boolean not null default false;
alter table public.operacao_observacao      add column if not exists origem_bubble boolean not null default false;
alter table public.operacao_declinio        add column if not exists origem_bubble boolean not null default false;
alter table public.etapa_instrumento        add column if not exists origem_bubble boolean not null default false;
alter table public.etapa_checklist_item     add column if not exists origem_bubble boolean not null default false;
alter table public.funil_cartao_tag         add column if not exists origem_bubble boolean not null default false;
alter table public.funil_cartao_usuario     add column if not exists origem_bubble boolean not null default false;
