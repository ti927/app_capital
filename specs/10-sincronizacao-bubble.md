# 10 — Sincronização com o Bubble (botão de dev)

Decisão de 01/10/2026: "um botão para dev apenas, login de fabio ti (master),
para sincronizar os dados com o Bubble — ele vai apenas coletar cadastros
novos".

**Decisão de 07/10/2026 (substitui a regra "só novos"):** o botão **espelha o
Bubble no app novo**, em sentido único, Bubble → app. Nada volta para o Bubble.

## A regra (07/10/2026)

1. **Existe nos dois** (mesmo `bubble_id`): os campos mapeados são
   **atualizados com o valor do Bubble** — "o Bubble ganha". Só as colunas que
   de fato mudaram são gravadas, por `id`. `criado_em` nunca é reescrito.
   Consequência assumida: edição feita aqui num registro que veio do Bubble é
   sobrescrita na próxima sincronização, e um registro arquivado aqui volta a
   ativo se o Bubble ainda o tem ativo.
2. **Novo no Bubble**: insere (como antes).
3. **Criado só aqui** (`bubble_id` nulo): **nunca é tocado** — nem atualizado,
   nem arquivado, nem removido. Todo o caminho parte dos `bubble_id` lidos.
4. **Sumiu do Bubble** (tem `bubble_id` aqui, mas o `_id` não veio na leitura
   completa do tipo): `arquivado = true`, nas tabelas que têm a coluna
   (`fornecedor`, `cliente`, `operacao`, `funil_cartao`). **Nunca apaga.**
   - só se a leitura daquele tipo terminou sem erro; 404 ou erro = nada daquele
     tipo é arquivado;
   - trava extra: se o Bubble devolve **zero** registros de um tipo e existem
     registros aqui, nada é arquivado e sai um aviso (zero costuma ser permissão
     de API, não o Bubble vazio);
   - `etapa_operacao`, `funil_etapa`, `funil_tag` não têm `arquivado`: o que
     sumiu do Bubble continua como está.
5. **Filhos** (pais novos e antigos) são reconciliados **por pai**: entra o que
   falta; sai **só** o que veio do Bubble e deixou de existir lá. Ver abaixo.
6. **Tipo que o Bubble não expõe** (HTTP 404): fica fora, sem arquivar e sem
   remover nada, e a tela diz **quais** tipos são e o que fazer (ver "Resultado
   na tela").

### Filhos e `origem_bubble` (db/011)

Nenhuma tabela filha tem `bubble_id` (e a maioria nem tem `id`: chave composta).
Sem uma marca, não dá para saber se um visualizador, uma observação ou uma tag
foi trazida do Bubble ou criada aqui — e remover exige saber. A migration
`db/011_sincronizacao_espelho.sql` (**escrita, ainda não aplicada**) acrescenta
`origem_bubble boolean not null default false` nas nove tabelas filhas. Sem
tabela nova: as policies da `db/009` cobrem a coluna.

- `true`: a sincronização viu o vínculo no Bubble. É o único que pode ser removido.
- `false`: criado aqui, ou veio da carga e ainda não foi revisto. Nunca é removido.
- Na primeira sincronização, o vínculo que o Bubble ainda tem é remarcado
  `true`; só depois disso uma saída do Bubble o remove. O erro possível é deixar
  um filho velho para trás — nunca apagar trabalho feito aqui.

| Filha | Pai | Identidade do filho | Fonte no Bubble |
|---|---|---|---|
| `fornecedor_tipo_operacao` | fornecedor | tipo + papel | listas do fornecedor |
| `cliente_email` | cliente | e-mail | `tbl_infocliente` |
| `cliente_visualizador` | cliente | perfil | `quem visualiza` (+ `user`) |
| `operacao_observacao` | operação | texto (conta ocorrências) | `observação ` + `tbl_observações` |
| `operacao_declinio` | operação | fornecedor | `declínios ` |
| `etapa_instrumento` | etapa | tipo de operação | `instrumento` |
| `etapa_checklist_item` | etapa | chave (conteúdo é atualizado) | campos `*Desc`/`*Value` |
| `funil_cartao_tag` | cartão | tag | `QuaisTags` |
| `funil_cartao_usuario` | cartão | perfil | `Usuarios` (+ `user`) |

**Só remove com a fonte inteira lida.** Se o tipo de que o filho depende não foi
lido (ex.: `tbl_infocliente` em 404, `user` em 404, ou só um dos dois tipos das
observações), a tabela filha só insere. Pais que sumiram do Bubble não têm os
filhos mexidos. Vínculo com usuário continua resolvido pelo e-mail contra
`perfil`; usuário sem conta aqui é pulado e aparece em "Pulados".

### Chaves estrangeiras não resolvidas

Se o mapeamento não acha o destino de uma referência (cliente, status, tipo,
quadro, etapa do funil) e devolve nulo, a atualização **não sobrescreve** o
vínculo existente com nulo. Limite conhecido: se o Bubble de fato limpou o campo,
o app novo mantém o vínculo antigo.

### Tabelas

| Tabela | Chave | Atualiza | Arquiva |
|---|---|---|---|
| `fornecedor`, `cliente`, `operacao`, `funil_cartao` | `bubble_id` | sim | sim |
| `etapa_operacao`, `funil_etapa`, `funil_tag` | `bubble_id` | sim | não (sem coluna) |
| `funil_quadro` | `nome` | só insere quadro novo | não |

Ordem de dependência: fornecedor → cliente → operação → etapa; no funil, quadro
→ etapa/tag → cartão. Operação nova de cliente antigo aponta para o cliente que
já existe.

### O que continua de fora

`perfil` (usuário novo no Bubble exige conta em `auth.users` — decisão em
aberto), `respostas`, `tbl_config` e **`funiltarefa`**.

`funiltarefa`: os campos até casam com `funil_tarefa` (Titulo, Quadro, Ordem,
Prazo, DataConclusao, Concluida, Responsavel, Usuarios, QualCartao), mas
specs/04-fases.md decidiu que as tarefas do funil "existem no banco e o Bubble
não usa; ficam fora, como estão hoje". A tabela daqui virou outra coisa (tipo,
hora, evento do Google Agenda — specs/08a e 11) e `cartao_id` é `not null`.
Espelhar o Bubble nela sobrescreveria trabalho local sem regra definida.
**Em aberto** — se for para trazer, decidir antes o que fazer com tarefa sem
cartão e com as colunas que só existem aqui.

`cliente.criado_por` fica nulo, como para os clientes da carga (db/008):
inventar autor mudaria quem enxerga o quê. **Em aberto:** se cliente novo do
Bubble deve herdar `Created By` como `criado_por`. Não decidido — perguntar.

## Quem pode

Só uma conta: **master ativa cujo e-mail é igual a `SINCRONIZACAO_EMAIL`**
(variável de servidor). Hoje é a conta "Fabio TI" — conferido em `perfil`
(há outra conta "Fabio Teste", também master; o nome não identifica, o
e-mail sim). Sem a variável, ninguém pode: falha fechado.

- O layout só monta o botão para essa conta (`src/app/(app)/layout.tsx`).
- A server action **confere de novo** (`src/lib/bubble/acao.ts`): botão
  escondido não é trava, a action é um POST que qualquer sessão alcança.
- A regra é uma função pura, testada: `src/lib/bubble/permissao.ts`.

## Segredos

`BUBBLE_API_KEY` e `BUBBLE_APP_URL` só no servidor (sem `NEXT_PUBLIC_`). A
chave nunca volta na resposta da action. A gravação usa o cliente Supabase
**da sessão** (anon key + cookie), não a service role: a trigger de `evento`
registra o Fabio TI como ator, e as policies de master (db/009) cobrem a
escrita, inclusive o DELETE dos filhos de origem Bubble.

## Live x version-test — a limitação

O botão lê o **live** por padrão (`BUBBLE_SINCRONIZACAO_RAIZ` vazio ou
`live`). Medido em 01/10/2026:

| data type | live | version-test |
|---|---|---|
| user | 5 | 5 |
| fornecedor | **74** | 73 |
| cliente, tbl_infocliente, operação, tbl_observações, etapas_operação | **HTTP 404** | 94 · 45 · 71 · 83 · 388 |
| funiletapa · funiltag | 6 · 5 | 6 · 5 |
| funilcartao | **20** | 18 |

Ou seja: hoje, pelo live, o botão só alcança fornecedor e funil. Os cinco data
types que nunca foram expostos na Data API do live (a mesma limitação de
specs/08b, seção final) ficam de fora, e **nada deles é atualizado, arquivado
ou removido**. Para cliente, operação e etapa entrarem, alguém com acesso ao
editor do Bubble precisa marcar esses tipos em **Settings › API** no live e
publicar. Nada no código muda depois disso.

`version-test` é cópia de ~15/09/2026, banco separado, e pode ter registro de
teste. Por isso não é o padrão e não há fallback automático: misturar as duas
raízes traria lixo de teste para o banco de verdade — e, agora que o botão
arquiva, ler `version-test` por engano **arquivaria** o que só existe no live.
Só com `BUBBLE_SINCRONIZACAO_RAIZ=version-test`, por escolha explícita.

## Resultado na tela

- **Faixa de aviso "Sincronização incompleta"** quando algum tipo deu 404:
  lista os tipos que o Bubble não expõe e diz o que fazer ("Bubble → Settings ›
  API → marcar o tipo e publicar no live"). Deixa de aparecer como erro de
  tabela ou como sucesso parcial.
- Por tabela: novos, atualizados, arquivados e removidos (ou "sem mudança").
- "Erros": outro HTTP do Bubble ou erro do banco — um erro numa tabela não
  derruba as outras.
- "Pulados": rótulo de tipo desconhecido, etapa sem operação, usuário sem
  conta, e o aviso de "zero registros".

## Uma fonte só para o de-para

O mapeamento campo do Bubble → coluna saiu de `scripts/carregar-supabase.mjs`
para `src/lib/bubble/mapeamento.ts`, e a leitura paginada da Data API de
`scripts/extrair-bubble.mjs` para `src/lib/bubble/api.ts`. Os dois scripts
importam o `.ts` direto (type stripping do Node ≥ 23.6). A carga continua com
o seu próprio `ON CONFLICT` (a recarga preenche com `coalesce`); o botão
atualiza só o que difere. Campo novo no de-para vale para os dois.

## Arquivos

| Arquivo | Papel |
|---|---|
| `src/lib/bubble/mapeamento.ts` | de-para, funções puras |
| `src/lib/bubble/api.ts` | leitura paginada da Data API |
| `src/lib/bubble/sincronizar.ts` | a regra de espelho, sobre uma interface `Banco` |
| `src/lib/bubble/banco-supabase.ts` | `Banco` sobre o cliente da sessão |
| `src/lib/bubble/permissao.ts` | quem pode |
| `src/lib/bubble/acao.ts` | server action |
| `src/components/sincronizacao-bubble.tsx` | botão e diálogo na barra do app |
| `src/lib/bubble/sincronizar.test.ts` | testes da regra e da permissão |
| `db/011_sincronizacao_espelho.sql` | `origem_bubble` nos filhos — **aplicar antes de usar o botão** |

## Riscos conhecidos

- **Sem a `db/011` aplicada o botão falha nos filhos** (coluna inexistente): as
  tabelas-pai sincronizam, cada filha aparece em "Erros".
- **Registro excluído aqui volta.** As telas excluem de verdade (cliente,
  fornecedor, operação, etapa, cartão, etapa e tag do funil — ver os
  `acoes.ts`). Se o registro excluído aqui ainda existe no Bubble, a próxima
  sincronização o traz de novo. **Em aberto** — se não for aceitável, o caminho
  é guardar os `bubble_id` excluídos (tabela de "não trazer de novo", via
  migration) e o botão pular esses. Não implementado sem decisão (regra 9).
- **O Bubble ganha.** Edição local num registro com `bubble_id` se perde na
  próxima sincronização (inclusive `arquivado`). É o pedido; fica registrado.
- **Duração.** Lê os dez data types inteiros (~800 registros hoje) e agora
  também os filhos de todos os pais a cada clique. Cabe numa server action
  hoje; se o volume crescer, filtrar por `Modified Date` na consulta ao Bubble.
- **Sem transação.** Cada tabela é gravada em separado; uma falha no meio deixa
  o espelho parcial — rodar de novo completa, porque a regra é idempotente.
