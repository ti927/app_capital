# Frente A — Funil: tarefas, calendário e "virar cliente"

> Roteiro para um terminal. Contexto completo em `specs/08-melhorias-qol.md`.
> Leia antes: `CLAUDE.md`, `src/app/(app)/funil/*`, `db/002_dominio.sql:354–456`.
> **Não abra** `src/components/**`, `src/app/*.css`, `src/lib/dominio.ts` nem
> `scripts/qa.mjs` (exceto acrescentar passo no fim) — são de outra frente.

Branch: `qol-funil-tarefas`.

---

## A1 · Migration `db/006_funil_tarefas.sql`

A tabela `funil_tarefa` já existe. Falta:

```sql
alter table public.funil_tarefa
  add column descricao text,
  add column tipo      text,           -- reuniao | ligacao | follow_up | documento | outro
  add column hora      time;           -- opcional: "reunião às 15h"

-- Toda tarefa pertence a um cartao: nao existe tarefa solta no quadro.
-- A tabela esta vazia (o Bubble nunca usou), entao da para fechar agora.
alter table public.funil_tarefa alter column cartao_id set not null;

create index funil_tarefa_prazo_idx on public.funil_tarefa (prazo) where not concluida;

-- cartão que já virou cliente (A5)
alter table public.funil_cartao
  add column cliente_id uuid references public.cliente (id) on delete set null;
create index funil_cartao_cliente_idx on public.funil_cartao (cliente_id);
```

`tipo` fica `text` com a lista fixa no código (`TIPOS_TAREFA` em
`funil/tarefas.ts`), como `cliente.status` já faz. Não crie option table para
cinco valores.

O trigger de log já cobre `funil_tarefa` (`002:501`) e as policies já estão
escritas (`003:256`) — coluna nova não pede policy nova. Registre isso em
comentário no topo da migration, no formato das migrations 004/005.

Aplicar com `npm run migration`.

## A2 · Abas na página do funil

`/funil` ganha duas abas no topo: **Quadro** (o kanban de hoje) e **Tarefas**.
Use o mesmo padrão visual de `operacoes/tela.tsx` (`div.abas` + `role="tablist"`).
Estado local; espelhe em `?aba=tarefas` com `history.replaceState` para o link
ser compartilhável. Trocar de aba **não** pode remontar o quadro nem perder
busca/filtro de tag.

`page.tsx` passa a carregar também as tarefas:

```ts
supabase.from('funil_tarefa').select('id, cartao_id, quadro_id, titulo, descricao, tipo, prazo, hora, concluida, data_conclusao, responsavel_id').order('prazo')
```

Tipos novos (`Tarefa`, `TipoTarefa`) vão em `funil/page.tsx`, ao lado de
`EtapaFunil` e `TagFunil` — **não** em `src/lib/dominio.ts`.

Recorte de acesso: indicante vê as tarefas dos cartões que ele já enxerga (a
mesma regra de `visiveis` que o `page.tsx` aplica hoje) mais as em que é
`responsavel_id`.

## A3 · Painel "Tarefas"

Arquivo novo `src/app/(app)/funil/tarefas.tsx` (client component).

Layout em duas colunas no desktop, empilhado abaixo de 900px:

- **Esquerda — lista agrupada**, nesta ordem, cada grupo com contagem:
  1. `Vencidas` — `prazo < hoje` e não concluída. Título em `--danger-ink`.
  2. `Hoje`
  3. `Esta semana` — até domingo.
  4. `Este mês`
  5. `Próximo mês`
  6. `Concluídas` — recolhido, como o `BlocoArquivados` das outras telas.
  Cada linha: caixa de concluir · título · ficha do tipo · cartão de origem
  (clicável, abre o diálogo do cartão) · responsável · prazo (`dd/mm`, com a
  hora quando houver).
- **Direita — calendário mensal interativo** (`funil/calendario.tsx`):
  navegação `‹ mês ›`, dia com tarefa ganha ponto (vermelho se há vencida,
  cor da marca se tudo em dia), dia de hoje destacado, clicar no dia filtra a
  lista da esquerda. Sem biblioteca: é uma grade de 7 colunas montada com
  `Date`. Semana começa na segunda.

Filtros no topo do painel: responsável (padrão **Minhas**, com opção "Todas"
para master), tipo, e um botão "Nova tarefa" — que exige escolher o cartão
(seletor de cartões do quadro). Não existe tarefa solta: `cartao_id` é `not
null` no banco.

Quando o dia do calendário está filtrando, "Nova tarefa" já vem com aquele
prazo preenchido.

Vazio de verdade (`Vazio` de `@/components/ui/base`) quando não há tarefa
nenhuma; vazio com contagem de escondidos quando o filtro esconde tudo — é o
padrão das outras telas.

## A4 · Tarefas dentro do cartão

Em `funil/dialogo.tsx`, abaixo do histórico, um bloco **Tarefas** com a mesma
cara do bloco de observações da operação (`operacoes/dialogo.tsx:207`):
rótulo + "Adicionar", lista com caixa de concluir, título, prazo, responsável,
lixeira. Criar tarefa não pode fechar o diálogo nem exigir salvar o cartão.

Actions em `funil/acoes.ts` (todas com `revalidatePath('/funil')`):
`criarTarefa`, `gravarTarefa`, `alternarTarefa` (marca `concluida` e grava
`data_conclusao`), `excluirTarefa`.

## A5 · Cartão vira cliente

Dois caminhos, os dois pedidos:

**(a) Do cartão.** Ação "Cadastrar como cliente" no cartão (no diálogo do
cartão, e no menu de ação do cartão do quadro). Abre confirmação mostrando o
de-para, cria o cliente e grava `funil_cartao.cliente_id`. Se o cartão já tem
`cliente_id`, a ação vira "Ver cliente" e leva para `/clientes`.

**(b) Do cadastro de cliente.** Em `clientes/dialogo.tsx`, quando o cliente é
novo, um seletor "Puxar do funil" no topo lista os cartões sem `cliente_id` e
preenche os seis campos no formulário (preenchimento no cliente, sem gravar
nada até o usuário mandar salvar). Use `SeletorPopup` como está — não mude o
componente.

De-para, exatamente os seis campos pedidos:

| `funil_cartao` | `cliente` |
|---|---|
| `empresa` | `nome_razao` |
| `contato` | `diretor_gerente` |
| `faturamento` | `faturamento_anual` |
| `segmento` | `atividade_cia` |
| `parecer` | `parecer` |
| `indicante` | `quem_indicou` |

Sem cliente duplicado: antes de criar, procure `cliente` com o mesmo
`nome_razao` (case-insensitive) e avise em vez de criar em silêncio.

## A6 · Fechamento

- `npm run verify` antes de cada commit.
- `npm run qa` nas três formas (`padrão`, `-- --escuro`, `-- --celular`) e
  **abra as capturas** — regra 5. Se precisar de passo novo no roteiro de QA,
  acrescente no **fim** de `scripts/qa.mjs`, nunca no meio (o arquivo é da
  frente C).
- Atualize a seção "A confirmar" de `specs/08-melhorias-qol.md` se alguma
  decisão sua fechar um dos pontos em aberto.

Commits sugeridos: `chore: migration de tarefas do funil` · `feat: aba de
tarefas no funil com calendário` · `feat: tarefas dentro do cartão do funil` ·
`feat: cadastrar cliente a partir do cartão do funil`.
