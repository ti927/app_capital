-- =============================================================================
-- 003_rls.sql — RLS e recorte de acesso
--
-- NÃO APLICADO. Decisão do projeto em 17/09/2026: seguir sem RLS por enquanto,
-- para não travar o desenvolvimento. Este arquivo fica pronto para o dia em que
-- for ligar — rodar ele basta, não precisa mexer em tabela.
--
-- O que está em jogo enquanto não roda: o Supabase publica toda tabela sem RLS
-- pela API REST, e a `anon key` que autentica essa API vai no bundle do
-- navegador. Na prática, `cliente`, `operacao` e `fornecedor` estão abertos para
-- leitura e escrita a quem tiver a chave. Ver docs/seguranca.md.
--
-- Recorte implementado aqui:
--   master     — tudo.
--   indicante  — só os clientes em que está em cliente_visualizador, as operações
--                e etapas desses clientes, e os cartões de funil em que está.
--                Fornecedor e as tabelas de apoio são catálogo: leitura para
--                todo autenticado.
--   anon       — nenhuma policy. No Bubble, a regra `everyone` de fornecedor,
--                operação e funiltarefa permitia criar, modificar e apagar via
--                API sem login (documentação, 2.3 / 2.4 / 2.7). Não se reproduz.
--
-- TODO(specs/06): confirmar o recorte com o negócio. No Bubble a autorização
-- estava em tbl.config (página x nível) e nas privacy rules, que eram amplas
-- demais para copiar. Este é o recorte mínimo defensável, não o levantado.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Liga RLS em tudo
-- -----------------------------------------------------------------------------

do $sql$
declare
  t text;
  tabelas text[] := array[
    'perfil', 'acesso_pagina', 'evento',
    'status_etapa', 'tipo_operacao',
    'cliente', 'cliente_email', 'cliente_visualizador',
    'fornecedor', 'fornecedor_tipo_operacao',
    'operacao', 'operacao_observacao', 'operacao_declinio',
    'etapa_operacao', 'etapa_instrumento', 'etapa_checklist_item', 'etapa_observacao',
    'funil_quadro', 'funil_etapa', 'funil_tag', 'funil_cartao',
    'funil_cartao_tag', 'funil_cartao_usuario',
    'funil_tarefa', 'funil_tarefa_usuario',
    'formulario_resposta', 'formulario_resposta_item'
  ];
begin
  foreach t in array tabelas loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end;
$sql$;

-- -----------------------------------------------------------------------------
-- Fundação
-- -----------------------------------------------------------------------------

create policy perfil_le on public.perfil
  for select to authenticated
  using (id = auth.uid() or public.eh_master());

create policy perfil_edita_o_proprio on public.perfil
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and nivel_acesso = public.nivel_atual());

create policy perfil_master_escreve on public.perfil
  for all to authenticated
  using (public.eh_master())
  with check (public.eh_master());

create policy acesso_pagina_le on public.acesso_pagina
  for select to authenticated
  using (perfil_id = auth.uid() or public.eh_master());

create policy acesso_pagina_master_escreve on public.acesso_pagina
  for all to authenticated
  using (public.eh_master())
  with check (public.eh_master());

-- evento: só master lê. Sem policy de insert — quem escreve é a trigger,
-- que é security definer e não passa por RLS.
create policy evento_master_le on public.evento
  for select to authenticated
  using (public.eh_master());

-- -----------------------------------------------------------------------------
-- Catálogo: leitura para autenticado, escrita só para master
-- -----------------------------------------------------------------------------

do $sql$
declare
  t text;
  catalogo text[] := array[
    'status_etapa', 'tipo_operacao',
    'fornecedor', 'fornecedor_tipo_operacao',
    'funil_quadro', 'funil_etapa', 'funil_tag'
  ];
begin
  foreach t in array catalogo loop
    execute format(
      'create policy %I on public.%I for select to authenticated using (true)',
      t || '_le', t
    );
    execute format(
      'create policy %I on public.%I for all to authenticated
         using (public.eh_master()) with check (public.eh_master())',
      t || '_master_escreve', t
    );
  end loop;
end;
$sql$;

-- -----------------------------------------------------------------------------
-- Cliente e dependentes
-- -----------------------------------------------------------------------------

create or replace function public.ve_cliente(p_cliente_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $fn$
  select public.eh_master() or exists (
    select 1 from public.cliente_visualizador
     where cliente_id = p_cliente_id and perfil_id = auth.uid()
  );
$fn$;

create policy cliente_le on public.cliente
  for select to authenticated
  using (public.ve_cliente(id));

create policy cliente_escreve on public.cliente
  for all to authenticated
  using (public.ve_cliente(id))
  with check (public.ve_cliente(id));

create policy cliente_email_acessa on public.cliente_email
  for all to authenticated
  using (public.ve_cliente(cliente_id))
  with check (public.ve_cliente(cliente_id));

create policy cliente_visualizador_le on public.cliente_visualizador
  for select to authenticated
  using (perfil_id = auth.uid() or public.eh_master());

create policy cliente_visualizador_master_escreve on public.cliente_visualizador
  for all to authenticated
  using (public.eh_master())
  with check (public.eh_master());

-- -----------------------------------------------------------------------------
-- Operação e etapa — herdam a visibilidade do cliente
-- -----------------------------------------------------------------------------

create or replace function public.ve_operacao(p_operacao_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $fn$
  select public.eh_master() or exists (
    select 1
      from public.operacao o
      join public.cliente_visualizador cv on cv.cliente_id = o.cliente_id
     where o.id = p_operacao_id and cv.perfil_id = auth.uid()
  );
$fn$;

create or replace function public.ve_etapa(p_etapa_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $fn$
  select public.ve_operacao(
    (select operacao_id from public.etapa_operacao where id = p_etapa_id)
  );
$fn$;

create policy operacao_acessa on public.operacao
  for all to authenticated
  using (public.ve_operacao(id))
  with check (cliente_id is null or public.ve_cliente(cliente_id));

create policy operacao_observacao_acessa on public.operacao_observacao
  for all to authenticated
  using (public.ve_operacao(operacao_id))
  with check (public.ve_operacao(operacao_id));

create policy operacao_declinio_acessa on public.operacao_declinio
  for all to authenticated
  using (public.ve_operacao(operacao_id))
  with check (public.ve_operacao(operacao_id));

create policy etapa_operacao_acessa on public.etapa_operacao
  for all to authenticated
  using (public.ve_operacao(operacao_id))
  with check (public.ve_operacao(operacao_id));

create policy etapa_instrumento_acessa on public.etapa_instrumento
  for all to authenticated
  using (public.ve_etapa(etapa_id))
  with check (public.ve_etapa(etapa_id));

create policy etapa_checklist_item_acessa on public.etapa_checklist_item
  for all to authenticated
  using (public.ve_etapa(etapa_id))
  with check (public.ve_etapa(etapa_id));

create policy etapa_observacao_acessa on public.etapa_observacao
  for all to authenticated
  using (public.ve_etapa(etapa_id))
  with check (public.ve_etapa(etapa_id));

-- -----------------------------------------------------------------------------
-- Funil
-- -----------------------------------------------------------------------------

create or replace function public.ve_cartao(p_cartao_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $fn$
  select public.eh_master() or exists (
    select 1 from public.funil_cartao_usuario
     where cartao_id = p_cartao_id and perfil_id = auth.uid()
  );
$fn$;

create policy funil_cartao_acessa on public.funil_cartao
  for all to authenticated
  using (public.ve_cartao(id))
  with check (public.ve_cartao(id) or public.eh_master());

create policy funil_cartao_tag_acessa on public.funil_cartao_tag
  for all to authenticated
  using (public.ve_cartao(cartao_id))
  with check (public.ve_cartao(cartao_id));

create policy funil_cartao_usuario_le on public.funil_cartao_usuario
  for select to authenticated
  using (perfil_id = auth.uid() or public.ve_cartao(cartao_id));

create policy funil_cartao_usuario_master_escreve on public.funil_cartao_usuario
  for all to authenticated
  using (public.eh_master())
  with check (public.eh_master());

create policy funil_tarefa_acessa on public.funil_tarefa
  for all to authenticated
  using (
    public.eh_master()
    or responsavel_id = auth.uid()
    or (cartao_id is not null and public.ve_cartao(cartao_id))
    or exists (
      select 1 from public.funil_tarefa_usuario tu
       where tu.tarefa_id = funil_tarefa.id and tu.perfil_id = auth.uid()
    )
  )
  with check (public.eh_master() or responsavel_id = auth.uid());

create policy funil_tarefa_usuario_le on public.funil_tarefa_usuario
  for select to authenticated
  using (perfil_id = auth.uid() or public.eh_master());

create policy funil_tarefa_usuario_master_escreve on public.funil_tarefa_usuario
  for all to authenticated
  using (public.eh_master())
  with check (public.eh_master());

-- -----------------------------------------------------------------------------
-- Formulário — no Bubble não tinha privacy rule nenhuma (2.8). Aqui: só master.
-- -----------------------------------------------------------------------------

create policy formulario_resposta_master on public.formulario_resposta
  for all to authenticated
  using (public.eh_master())
  with check (public.eh_master());

create policy formulario_resposta_item_master on public.formulario_resposta_item
  for all to authenticated
  using (public.eh_master())
  with check (public.eh_master());
