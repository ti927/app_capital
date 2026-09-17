-- =============================================================================
-- 004_status_operacao.sql — correcao
--
-- operacao.status_id apontava para status_etapa. Errado: `Status Atual da
-- Operacao` no Bubble e um conjunto proprio de 4 valores (as colunas da aba
-- Status), diferente dos 14 status de etapa. Descoberto ao inspecionar o dado
-- extraido, antes da carga.
-- =============================================================================

create table public.status_operacao (
  id      smallint primary key,
  chave   text not null unique,
  rotulo  text not null,
  ordem   smallint not null
);

insert into public.status_operacao (id, chave, rotulo, ordem) values
  (1, 'inicial',                 'Inicial',                1),
  (2, 'em_andamento',            'Em andamento',           2),
  (3, 'operacao_aprovada',       'Operação Aprovada',      3),
  (4, 'excluido_ou_paralisado',  'Excluído ou Paralisado', 4);

alter table public.operacao drop column status_id;
alter table public.operacao add column status_operacao_id smallint
  references public.status_operacao (id);

create index operacao_status_operacao_idx on public.operacao (status_operacao_id);

create trigger status_operacao_log
  after insert or update or delete on public.status_operacao
  for each row execute function public.log_evento();
