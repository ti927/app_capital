-- =============================================================================
-- 009_rls.sql — RLS ligada, espelhando o que a aplicação já faz
--
-- Substitui db/003_rls.sql, que nunca foi aplicado. A 003 foi escrita antes de
-- 004…008 e, aplicada como estava, quebrava o indicante em quatro lugares:
--   * cadastrar cliente  — o insert exigia já estar em cliente_visualizador,
--                          que só nasce DEPOIS do insert;
--   * criar cartão       — idem com funil_cartao_usuario, que a aplicação
--                          nunca grava;
--   * nomes no funil     — perfil só deixava ler o próprio, e o funil lista
--                          todos para responsável e "quem visualiza";
--   * colunas e tags     — a tela do funil deixa o indicante gerir as duas.
-- E não conhecia status_operacao (004), cliente.criado_por (008) nem
-- funil_tarefa como ficou em 006.
--
-- Princípio desta versão: a policy é o recorte que a aplicação JÁ aplica na
-- consulta (clientes/page.tsx, funil/page.tsx), agora garantido pelo banco.
-- Nenhuma regra nova para quem está logado. O que muda de verdade é o `anon`:
-- sem policy nenhuma, a anon key do navegador deixa de ler e gravar o banco.
--
-- Recorte:
--   master     — tudo.
--   indicante  — clientes em que está em "quem visualiza" OU que cadastrou;
--                operações e etapas desses clientes; cartões do funil em que
--                está OU que criou; tarefas desses cartões ou em que é
--                responsável. Catálogo (fornecedor, tipos, status, colunas e
--                tags do funil) é leitura para todo autenticado.
--   anon       — nada.
--
-- Única mudança de comportamento, e é conserto: funil_cartao.criado_por.
-- Hoje o cartão que o indicante cria some da tela dele ao recarregar, porque
-- a aplicação nunca o põe em funil_cartao_usuario. Com o autor gravado, quem
-- cria continua vendo — a mesma regra de cliente.criado_por (008).
--
-- Desempenho: auth.uid() e eh_master() vão sempre dentro de (select …), para
-- o Postgres avaliar UMA vez por consulta (initplan) e não uma vez por linha;
-- o recorte do indicante é um conjunto de ids montado uma vez por consulta.
-- Para o master, que é quem usa as telas pesadas, o recorte vira uma constante
-- `true` e as funções por linha nem rodam. Medido antes de aplicar — ver
-- docs/seguranca.md.
--
-- Scripts (carregar-supabase, mcp/servidor) conectam por DIRECT_URL, como
-- dono das tabelas: RLS não se aplica a eles.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Autor do cartão e default do autor do cliente
-- -----------------------------------------------------------------------------

alter table public.funil_cartao
  add column if not exists criado_por uuid
    references public.perfil (id) on delete set null
    default auth.uid();

create index if not exists funil_cartao_criado_por_idx on public.funil_cartao (criado_por);

-- clientes/acoes.ts grava criado_por explicitamente; funil/acoes.ts
-- (criarClienteDoCartao) não grava. O default cobre os dois sem mexer em código.
alter table public.cliente alter column criado_por set default auth.uid();

-- Índices que as funções de recorte usam.
create index if not exists cliente_visualizador_perfil_idx
  on public.cliente_visualizador (perfil_id, cliente_id);
create index if not exists funil_cartao_usuario_perfil_idx
  on public.funil_cartao_usuario (perfil_id, cartao_id);

-- -----------------------------------------------------------------------------
-- Funções de recorte. Devolvem o CONJUNTO de ids que o usuário enxerga, e a
-- policy pergunta `id in (select …)`. Assim o Postgres monta o conjunto uma
-- vez por consulta (subplano com hash) — e não chama uma função por linha,
-- que foi o que a primeira medição mostrou: 140ms numa leitura de etapas.
--
-- security definer: leem as tabelas de vínculo sem passar pela RLS delas.
--
-- "Quem criou enxerga" NÃO passa por aqui: a policy compara `criado_por` da
-- própria linha. Uma função não enxerga a linha que o mesmo comando acabou
-- de inserir, e o `insert … returning` da aplicação falhava.
-- -----------------------------------------------------------------------------

create or replace function public.clientes_vinculados()
returns setof uuid
language sql stable security definer set search_path = public
as $fn$
  select cliente_id from public.cliente_visualizador where perfil_id = auth.uid();
$fn$;

create or replace function public.clientes_visiveis()
returns setof uuid
language sql stable security definer set search_path = public
as $fn$
  select cliente_id from public.cliente_visualizador where perfil_id = auth.uid()
  union
  select id from public.cliente where criado_por = auth.uid();
$fn$;

create or replace function public.operacoes_visiveis()
returns setof uuid
language sql stable security definer set search_path = public
as $fn$
  select o.id from public.operacao o
   where o.cliente_id in (select public.clientes_visiveis());
$fn$;

create or replace function public.etapas_visiveis()
returns setof uuid
language sql stable security definer set search_path = public
as $fn$
  select e.id from public.etapa_operacao e
   where e.operacao_id in (select public.operacoes_visiveis());
$fn$;

create or replace function public.cartoes_vinculados()
returns setof uuid
language sql stable security definer set search_path = public
as $fn$
  select cartao_id from public.funil_cartao_usuario where perfil_id = auth.uid();
$fn$;

create or replace function public.cartoes_visiveis()
returns setof uuid
language sql stable security definer set search_path = public
as $fn$
  select cartao_id from public.funil_cartao_usuario where perfil_id = auth.uid()
  union
  select id from public.funil_cartao where criado_por = auth.uid();
$fn$;

-- As funções ficam no schema public, que a API expõe como RPC. Devolvem só
-- ids do próprio usuário, mas não há por que o anon chamá-las.
do $sql$
declare
  f text;
begin
  foreach f in array array[
    'clientes_vinculados()', 'clientes_visiveis()', 'operacoes_visiveis()',
    'etapas_visiveis()', 'cartoes_vinculados()', 'cartoes_visiveis()',
    'eh_master()', 'nivel_atual()'
  ] loop
    execute format('revoke execute on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end;
$sql$;

-- -----------------------------------------------------------------------------
-- Liga RLS em tudo
-- -----------------------------------------------------------------------------

do $sql$
declare
  t text;
begin
  for t in
    select c.relname
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind = 'r'
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end;
$sql$;

-- -----------------------------------------------------------------------------
-- Fundação
-- -----------------------------------------------------------------------------

-- O funil lista todos os perfis ativos (responsável, "quem visualiza").
create policy perfil_le on public.perfil
  for select to authenticated using (true);

create policy perfil_master_escreve on public.perfil
  for insert to authenticated with check ((select public.eh_master()));

create policy perfil_atualiza on public.perfil
  for update to authenticated
  using ((select public.eh_master()) or id = (select auth.uid()))
  with check (
    (select public.eh_master())
    or (id = (select auth.uid()) and nivel_acesso = (select public.nivel_atual()))
  );

create policy perfil_master_apaga on public.perfil
  for delete to authenticated using ((select public.eh_master()));

create policy acesso_pagina_le on public.acesso_pagina
  for select to authenticated
  using (perfil_id = (select auth.uid()) or (select public.eh_master()));

create policy acesso_pagina_master_escreve on public.acesso_pagina
  for all to authenticated
  using ((select public.eh_master())) with check ((select public.eh_master()));

-- evento: só master lê. Quem escreve é a trigger log_evento (security definer).
create policy evento_master_le on public.evento
  for select to authenticated using ((select public.eh_master()));

-- -----------------------------------------------------------------------------
-- Catálogo
-- -----------------------------------------------------------------------------

-- Leitura para autenticado, escrita só master (telas de master).
do $sql$
declare
  t text;
begin
  foreach t in array array[
    'status_etapa', 'status_operacao', 'tipo_operacao',
    'fornecedor', 'fornecedor_tipo_operacao'
  ] loop
    execute format(
      'create policy %I on public.%I for select to authenticated using (true)',
      t || '_le', t);
    execute format(
      'create policy %I on public.%I for insert to authenticated
         with check ((select public.eh_master()))', t || '_master_insere', t);
    execute format(
      'create policy %I on public.%I for update to authenticated
         using ((select public.eh_master())) with check ((select public.eh_master()))',
      t || '_master_atualiza', t);
    execute format(
      'create policy %I on public.%I for delete to authenticated
         using ((select public.eh_master()))', t || '_master_apaga', t);
  end loop;
end;
$sql$;

-- Funil: a tela deixa qualquer autenticado criar e editar colunas e tags.
do $sql$
declare
  t text;
begin
  foreach t in array array['funil_quadro', 'funil_etapa', 'funil_tag'] loop
    execute format(
      'create policy %I on public.%I for all to authenticated using (true) with check (true)',
      t || '_autenticado', t);
  end loop;
end;
$sql$;

-- -----------------------------------------------------------------------------
-- Cliente e dependentes
-- -----------------------------------------------------------------------------

create policy cliente_le on public.cliente
  for select to authenticated
  using ((select public.eh_master()) or criado_por = (select auth.uid()) or id in (select public.clientes_vinculados()));

create policy cliente_insere on public.cliente
  for insert to authenticated
  with check ((select public.eh_master()) or criado_por = (select auth.uid()));

create policy cliente_atualiza on public.cliente
  for update to authenticated
  using ((select public.eh_master()) or criado_por = (select auth.uid()) or id in (select public.clientes_vinculados()))
  with check ((select public.eh_master()) or criado_por = (select auth.uid()) or id in (select public.clientes_vinculados()));

create policy cliente_apaga on public.cliente
  for delete to authenticated
  using ((select public.eh_master()) or criado_por = (select auth.uid()) or id in (select public.clientes_vinculados()));

create policy cliente_email_acessa on public.cliente_email
  for all to authenticated
  using ((select public.eh_master()) or cliente_id in (select public.clientes_visiveis()))
  with check ((select public.eh_master()) or cliente_id in (select public.clientes_visiveis()));

create policy cliente_visualizador_le on public.cliente_visualizador
  for select to authenticated
  using (
    (select public.eh_master())
    or perfil_id = (select auth.uid())
    or cliente_id in (select public.clientes_visiveis())
  );

-- Quem cadastra se põe em "quem visualiza" (clientes/acoes.ts, funil/acoes.ts).
create policy cliente_visualizador_insere on public.cliente_visualizador
  for insert to authenticated
  with check (
    (select public.eh_master())
    or (perfil_id = (select auth.uid()) and cliente_id in (select public.clientes_visiveis()))
  );

create policy cliente_visualizador_master_atualiza on public.cliente_visualizador
  for update to authenticated
  using ((select public.eh_master())) with check ((select public.eh_master()));

create policy cliente_visualizador_master_apaga on public.cliente_visualizador
  for delete to authenticated using ((select public.eh_master()));

-- -----------------------------------------------------------------------------
-- Operação e etapa — herdam do cliente. As telas são de master; o recorte do
-- indicante fica para quando ele ganhar acesso a elas.
-- -----------------------------------------------------------------------------

create policy operacao_acessa on public.operacao
  for all to authenticated
  using ((select public.eh_master()) or cliente_id in (select public.clientes_visiveis()))
  with check ((select public.eh_master()) or cliente_id in (select public.clientes_visiveis()));

do $sql$
declare
  t text;
begin
  foreach t in array array['operacao_observacao', 'operacao_declinio', 'etapa_operacao'] loop
    execute format(
      'create policy %I on public.%I for all to authenticated
         using ((select public.eh_master()) or operacao_id in (select public.operacoes_visiveis()))
         with check ((select public.eh_master()) or operacao_id in (select public.operacoes_visiveis()))',
      t || '_acessa', t);
  end loop;

  foreach t in array array['etapa_instrumento', 'etapa_checklist_item', 'etapa_observacao'] loop
    execute format(
      'create policy %I on public.%I for all to authenticated
         using ((select public.eh_master()) or etapa_id in (select public.etapas_visiveis()))
         with check ((select public.eh_master()) or etapa_id in (select public.etapas_visiveis()))',
      t || '_acessa', t);
  end loop;
end;
$sql$;

-- -----------------------------------------------------------------------------
-- Funil
-- -----------------------------------------------------------------------------

create policy funil_cartao_le on public.funil_cartao
  for select to authenticated
  using ((select public.eh_master()) or criado_por = (select auth.uid()) or id in (select public.cartoes_vinculados()));

-- Qualquer autenticado cria cartão; criado_por (default auth.uid()) mantém o
-- cartão visível para quem criou.
create policy funil_cartao_insere on public.funil_cartao
  for insert to authenticated
  with check ((select public.eh_master()) or criado_por = (select auth.uid()));

create policy funil_cartao_atualiza on public.funil_cartao
  for update to authenticated
  using ((select public.eh_master()) or criado_por = (select auth.uid()) or id in (select public.cartoes_vinculados()))
  with check ((select public.eh_master()) or criado_por = (select auth.uid()) or id in (select public.cartoes_vinculados()));

create policy funil_cartao_apaga on public.funil_cartao
  for delete to authenticated
  using ((select public.eh_master()) or criado_por = (select auth.uid()) or id in (select public.cartoes_vinculados()));

create policy funil_cartao_tag_acessa on public.funil_cartao_tag
  for all to authenticated
  using ((select public.eh_master()) or cartao_id in (select public.cartoes_visiveis()))
  with check ((select public.eh_master()) or cartao_id in (select public.cartoes_visiveis()));

create policy funil_cartao_usuario_le on public.funil_cartao_usuario
  for select to authenticated
  using (
    (select public.eh_master())
    or perfil_id = (select auth.uid())
    or cartao_id in (select public.cartoes_visiveis())
  );

create policy funil_cartao_usuario_master_escreve on public.funil_cartao_usuario
  for insert to authenticated with check ((select public.eh_master()));
create policy funil_cartao_usuario_master_atualiza on public.funil_cartao_usuario
  for update to authenticated
  using ((select public.eh_master())) with check ((select public.eh_master()));
create policy funil_cartao_usuario_master_apaga on public.funil_cartao_usuario
  for delete to authenticated using ((select public.eh_master()));

-- Tarefa segue o cartão, mais as em que a pessoa é responsável
-- (funil/page.tsx, tarefasVisiveis).
create policy funil_tarefa_acessa on public.funil_tarefa
  for all to authenticated
  using (
    (select public.eh_master())
    or responsavel_id = (select auth.uid())
    or cartao_id in (select public.cartoes_visiveis())
  )
  with check (
    (select public.eh_master())
    or responsavel_id = (select auth.uid())
    or cartao_id in (select public.cartoes_visiveis())
  );

create policy funil_tarefa_usuario_le on public.funil_tarefa_usuario
  for select to authenticated
  using (perfil_id = (select auth.uid()) or (select public.eh_master()));

create policy funil_tarefa_usuario_master_escreve on public.funil_tarefa_usuario
  for all to authenticated
  using ((select public.eh_master())) with check ((select public.eh_master()));

-- -----------------------------------------------------------------------------
-- Formulário — fora do corte, só master.
-- -----------------------------------------------------------------------------

create policy formulario_resposta_master on public.formulario_resposta
  for all to authenticated
  using ((select public.eh_master())) with check ((select public.eh_master()));

create policy formulario_resposta_item_master on public.formulario_resposta_item
  for all to authenticated
  using ((select public.eh_master())) with check ((select public.eh_master()));
