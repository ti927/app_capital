-- =============================================================================
-- 005_log_evento_chave_composta.sql — correcao
--
-- log_evento() montava registro_id com `to_jsonb(new) ->> 'id'`, o que assume
-- que toda tabela tem uma coluna `id`. As tabelas de ligacao
-- (fornecedor_tipo_operacao, etapa_instrumento, operacao_declinio,
-- funil_cartao_tag, cliente_visualizador, funil_cartao_usuario,
-- funil_tarefa_usuario) tem chave composta e nenhuma coluna `id`: registro_id
-- saia nulo e o insert quebrava no NOT NULL.
--
-- Agora, quando nao ha coluna `id`, a chave e montada a partir das colunas da
-- primary key, na ordem delas, separadas por '|'.
-- =============================================================================

create or replace function public.log_evento()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_linha jsonb;
  v_id    text;
begin
  v_linha := coalesce(to_jsonb(new), to_jsonb(old));
  v_id := v_linha ->> 'id';

  if v_id is null then
    select string_agg(v_linha ->> a.attname, '|' order by k.ord)
      into v_id
      from pg_index i
      join lateral unnest(i.indkey) with ordinality as k(attnum, ord) on true
      join pg_attribute a on a.attrelid = i.indrelid and a.attnum = k.attnum
     where i.indrelid = tg_relid and i.indisprimary;
  end if;

  insert into public.evento (tabela, registro_id, operacao, antes, depois, ator_id)
  values (
    tg_table_name,
    coalesce(v_id, '(sem chave)'),
    tg_op,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end,
    auth.uid()
  );

  return coalesce(new, old);
end;
$fn$;
