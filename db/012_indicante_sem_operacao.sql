-- =============================================================================
-- 012_indicante_sem_operacao.sql
--
-- Fecha o que a 009 deixou aberto para o indicante (registrado em
-- docs/seguranca.md em 02/10 e cobrado em 07/10/2026: "isso não pode ficar de
-- fora"). Pela API, o indicante ainda lia as operações dos clientes dele (e
-- etapas, observações, declínios, checklist) e o catálogo de fornecedores —
-- embora as telas de Operação, Esteira e Fornecedor sejam só de master.
--
-- Agora operação e tudo que pende dela, e fornecedor, são só de master — o
-- mesmo recorte das telas. Nenhuma tela do indicante lê essas tabelas
-- (conferido: só operacoes/, fornecedores/, esteira/, lib/bubble e o MCP, que
-- já confere master nessas ferramentas).
--
-- Status de etapa, tipos de operação e status de operação continuam de
-- leitura para todo autenticado: são rótulos, sem dado de cliente.
-- =============================================================================

drop policy if exists operacao_acessa on public.operacao;
create policy operacao_master on public.operacao
  for all to authenticated
  using ((select public.eh_master())) with check ((select public.eh_master()));

do $sql$
declare
  t text;
begin
  foreach t in array array[
    'operacao_observacao', 'operacao_declinio', 'etapa_operacao',
    'etapa_instrumento', 'etapa_checklist_item', 'etapa_observacao'
  ] loop
    execute format('drop policy if exists %I on public.%I', t || '_acessa', t);
    execute format(
      'create policy %I on public.%I for all to authenticated
         using ((select public.eh_master())) with check ((select public.eh_master()))',
      t || '_master', t);
  end loop;

  foreach t in array array['fornecedor', 'fornecedor_tipo_operacao'] loop
    execute format('drop policy if exists %I on public.%I', t || '_le', t);
    execute format(
      'create policy %I on public.%I for select to authenticated using ((select public.eh_master()))',
      t || '_master_le', t);
  end loop;
end;
$sql$;
