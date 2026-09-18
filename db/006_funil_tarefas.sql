-- =============================================================================
-- 006_funil_tarefas.sql — tarefas do funil e cartao que virou cliente
--
-- A tabela `funil_tarefa` ja existe desde 002 (002:430), mas o Bubble nunca a
-- usou (specs/04-fases.md:94): esta vazia. Nao ha comportamento original para
-- copiar — o desenho esta em specs/08a-funil-tarefas.md e foi decidido em
-- 18/09/2026.
--
-- Faltavam tres campos de uso (`descricao`, `tipo`, `hora`), a regra de que
-- toda tarefa pertence a um cartao, e o vinculo do cartao com o cliente que ele
-- virou.
--
-- Auditoria: a trigger de log ja cobre `funil_tarefa` e `funil_cartao`
-- (002:501). Coluna nova nao pede trigger nova.
-- RLS: as policies de `funil_tarefa` e `funil_cartao` ja estao escritas
-- (003:237 e 003:256) e nao mencionam coluna — nao precisam mudar. Continuam
-- nao aplicadas, por decisao do projeto (CLAUDE.md, regra 1).
-- =============================================================================

alter table public.funil_tarefa
  add column descricao text,
  add column tipo      text,   -- reuniao | ligacao | follow_up | documento | outro
  add column hora      time;   -- opcional: "reuniao as 15h"

-- `tipo` fica text com a lista fixa em `funil/tarefas-apoio.ts` (TIPOS_TAREFA), como
-- `cliente.status` ja faz. Option table para cinco valores nao se paga.

-- Toda tarefa pertence a um cartao: nao existe tarefa solta no quadro.
-- A tabela esta vazia, entao da para fechar agora sem migrar nada.
alter table public.funil_tarefa alter column cartao_id set not null;

-- O painel de tarefas le sempre pelo prazo, e so o que esta em aberto.
create index funil_tarefa_prazo_idx on public.funil_tarefa (prazo) where not concluida;

-- -----------------------------------------------------------------------------
-- Cartao que ja virou cliente
--
-- `on delete set null`: apagar o cliente nao pode apagar o cartao do funil — o
-- historico comercial continua valendo.
-- -----------------------------------------------------------------------------

alter table public.funil_cartao
  add column cliente_id uuid references public.cliente (id) on delete set null;

create index funil_cartao_cliente_idx on public.funil_cartao (cliente_id);
