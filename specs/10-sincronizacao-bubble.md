# 10 — Sincronização com o Bubble (botão de dev)

Decisão de 01/10/2026. Pedido: "um botão para dev apenas, login de fabio ti
(master), para sincronizar os dados com o Bubble — ele vai apenas coletar
cadastros novos".

## O que faz

Lê a Data API do Bubble e **insere aqui os registros cujo `_id` ainda não
existe em `bubble_id`**. Nada além disso:

- registro que já existe aqui **não é atualizado** — nem que tenha mudado no
  Bubble. Quem edita na nossa tela não perde trabalho;
- **nada é apagado** — registro sumido do Bubble continua aqui;
- **filho só entra pendurado num pai novo**. E-mail extra de cliente,
  visualizadores, observações, declínios, instrumentos, checklist, tags e
  usuários do cartão não têm `bubble_id`; não há como saber se um filho de
  pai antigo já foi trazido, então pai antigo não ganha filho;
- ordem de dependência: fornecedor → cliente → operação → etapa; no funil,
  quadro → etapa/tag → cartão. Operação nova de cliente antigo aponta para o
  cliente que já existe; etapa nova de operação antiga também entra.

| Tabela | Chave de "novo" | Filhos (só do pai novo) |
|---|---|---|
| `fornecedor` | `bubble_id` | `fornecedor_tipo_operacao` |
| `cliente` | `bubble_id` | `cliente_email` (de `tbl_infocliente`), `cliente_visualizador` |
| `operacao` | `bubble_id` | `operacao_observacao` (lista + `tbl_observações`), `operacao_declinio` |
| `etapa_operacao` | `bubble_id` | `etapa_instrumento`, `etapa_checklist_item` |
| `funil_quadro` | `nome` | — |
| `funil_etapa`, `funil_tag` | `bubble_id` | — |
| `funil_cartao` | `bubble_id` | `funil_cartao_tag`, `funil_cartao_usuario` |

Fica de fora, como na carga: `perfil` (usuário novo no Bubble exige conta em
`auth.users` — decisão em aberto), `funiltarefa`, `respostas`, `tbl_config`.
Vínculo com usuário do Bubble (`quem visualiza`, `Usuarios` do cartão) é
resolvido pelo e-mail contra `perfil`; usuário sem conta aqui é pulado e
aparece em "Pulados".

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
registra o Fabio TI como ator, e quando `db/003_rls.sql` for aplicado as
policies de master continuam cobrindo a escrita.

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

Ou seja: hoje, pelo live, o botão traz fornecedor e funil, e **relata como
erro** os cinco data types que nunca foram expostos na Data API do live (a
mesma limitação de specs/08b, seção final). Para cliente, operação e etapa
entrarem, alguém com acesso ao editor do Bubble precisa marcar esses tipos
em **Settings › API** no live. Nada no código muda depois disso.

`version-test` é cópia de ~15/09/2026, banco separado, e pode ter registro de
teste. Por isso não é o padrão e não há fallback automático: misturar as duas
raízes traria lixo de teste para o banco de verdade. Só com
`BUBBLE_SINCRONIZACAO_RAIZ=version-test`, por escolha explícita.

## Resultado na tela

Novos por tabela (zero também aparece), erros (data type fora da API, erro
do banco — um erro numa tabela não derruba as outras) e "Pulados" (rótulo de
tipo desconhecido, etapa sem operação, usuário sem conta), agrupados.

## Uma fonte só para o de-para

O mapeamento campo do Bubble → coluna saiu de `scripts/carregar-supabase.mjs`
para `src/lib/bubble/mapeamento.ts`, e a leitura paginada da Data API de
`scripts/extrair-bubble.mjs` para `src/lib/bubble/api.ts`. Os dois scripts
importam o `.ts` direto (type stripping do Node ≥ 23.6). A carga continua com
o seu próprio `ON CONFLICT` (a recarga preenche com `coalesce`); o botão usa
`ON CONFLICT DO NOTHING`. Campo novo no de-para vale para os dois.

## Arquivos

| Arquivo | Papel |
|---|---|
| `src/lib/bubble/mapeamento.ts` | de-para, funções puras |
| `src/lib/bubble/api.ts` | leitura paginada da Data API |
| `src/lib/bubble/sincronizar.ts` | a regra "só novos", sobre uma interface `Banco` sem update/delete |
| `src/lib/bubble/banco-supabase.ts` | `Banco` sobre o cliente da sessão |
| `src/lib/bubble/permissao.ts` | quem pode |
| `src/lib/bubble/acao.ts` | server action |
| `src/components/sincronizacao-bubble.tsx` | botão e diálogo na barra do app |
| `src/lib/bubble/sincronizar.test.ts` | testes da regra e da permissão |

## Riscos conhecidos

- **Registro excluído aqui volta.** As telas excluem de verdade (cliente,
  fornecedor, operação, etapa, cartão, etapa e tag do funil — ver os
  `acoes.ts`). Se o registro excluído aqui ainda existe no Bubble, a próxima
  sincronização o traz de novo: para o botão ele é "novo". **Em aberto** —
  se isso não for aceitável, o caminho é guardar os `bubble_id` excluídos
  (tabela de "não trazer de novo", via migration) e o botão pular esses.
  Não implementado sem decisão (regra 9).
- **Duração.** Lê os dez data types inteiros (~800 registros hoje) a cada
  clique. Cabe folgado no tempo de uma server action; se o volume crescer,
  filtrar por `Created Date` na consulta ao Bubble.
