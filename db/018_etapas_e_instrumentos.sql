-- =============================================================================
-- 018_etapas_e_instrumentos.sql
--
-- Ajustes nas tabelas de apoio pedidos em 10/11/2026:
--   * status da etapa "contrato assinado" passa a "contrato/termo assinado";
--   * status novo "call solicitado", logo depois de "operação em análise"
--     (mesmo grupo de cor, azul — src/lib/dominio.ts);
--   * instrumento novo "Substituição de Dívida";
--   * instrumento "PRONAF" sai das listas de escolha.
--
-- Item de tabela de apoio NUNCA se apaga: ganha `ativo = false`. Some dos
-- seletores, mas continua no banco — o rótulo aparece onde já foi gravado e
-- dá para reverter com um update. Vale para status_etapa e tipo_operacao.
--
-- A sincronização com o Bubble casa o status pelo RÓTULO. O Bubble continua
-- mandando "contrato assinado"; por isso `rotulo_bubble` guarda o rótulo antigo
-- e o catálogo da sincronização aceita os dois (src/lib/bubble/banco-supabase.ts).
-- RLS: tabelas já existentes, policies de 009 continuam valendo.
-- =============================================================================

alter table public.status_etapa  add column ativo boolean not null default true;
alter table public.tipo_operacao add column ativo boolean not null default true;

comment on column public.status_etapa.ativo is
  'false = fora das listas de escolha. Nunca apagar a linha: etapas antigas apontam para ela.';
comment on column public.tipo_operacao.ativo is
  'false = fora das listas de escolha. Nunca apagar a linha: etapas e fornecedores apontam para ela.';

alter table public.status_etapa add column rotulo_bubble text;

comment on column public.status_etapa.rotulo_bubble is
  'Rótulo do status no Bubble quando difere do daqui. A sincronização casa por ele também.';

update public.status_etapa
   set rotulo = 'contrato/termo assinado', rotulo_bubble = 'contrato assinado'
 where chave = 'contrato_assinado';

update public.status_etapa set ordem = ordem + 1 where ordem >= 6;

insert into public.status_etapa (id, chave, rotulo, chave_bubble, ordem)
values (15, 'call_solicitado', 'call solicitado', 'call_solicitado', 6);

update public.tipo_operacao set ativo = false where chave = 'pronaf';

-- "Substituição de Dívida" entra entre SLB e Venda, na ordem alfabética.
update public.tipo_operacao set ordem = ordem + 1 where ordem >= 29;

insert into public.tipo_operacao (id, chave, rotulo, chave_bubble, ordem)
values (32, 'substituicao_de_divida', 'Substituição de Dívida', 'substituicao_de_divida', 29);
