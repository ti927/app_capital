# 08 — Melhorias de QOL · 18/09/2026

App já publicado na Vercel e funcionando. Esta rodada não acrescenta módulo
novo: arruma o que incomoda no uso diário e fecha três buracos de
comportamento. O trabalho foi cortado em **três frentes paralelas** — uma por
terminal — com propriedade de arquivo exclusiva, para que ninguém pise no
arquivo do outro.

| Frente | Assunto | Roteiro |
|---|---|---|
| A | Funil: tarefas, calendário, cartão vira cliente | `specs/08a-funil-tarefas.md` |
| B | Operação e Esteira: campos, declinados, filtro da esteira | `specs/08b-operacao-esteira.md` |
| C | Desempenho, dropdown inline, animações, polimento | `specs/08c-polimento.md` |

---

## Os sete pedidos, e o que cada um significa em código

### 1. Tarefas no funil (frente A)

Pedido: controle de tarefas dentro de cada cartão **e** uma aba "Tarefas" na
própria página do funil, com vencidas, mês corrente, próximo mês e calendário
interativo.

Estado: a tabela `funil_tarefa` **já existe** (`db/002_dominio.sql:430`) com
`titulo, ordem, prazo, data_conclusao, concluida, responsavel_id, cartao_id`,
com trigger de log e policies já escritas em `db/003_rls.sql:256`. O Bubble
nunca usou essa tabela (`specs/04-fases.md:94`) — **não há comportamento
original para copiar**: o desenho abaixo é decisão desta sessão, registrada
aqui.

### 2. Esteira com a lista errada (frente B)

Pedido: no app original a esteira tem duas linhas; aqui tem muitas. O que
manda é o toggle "Estruturação em Andamento" da operação.

Evidência: `specs/bubble/documentacao-completa.md:1611` —
`Do a search for operação where arquivado = false AND Estruturação em Andamento = true`.
Hoje `src/app/(app)/esteira/page.tsx` filtra só por `arquivado = false`: traz
tudo. O toggle **também não existe na tela de operação**, então não há como
alimentar a esteira — os dois consertos andam juntos, por isso estão na mesma
frente.

Fica **a confirmar**: a mesma expressão do Bubble encadeia um segundo filtro
(`:filtered( nome cliente txt is in ...etapas com status "contrato assinado" )`).
Aplique primeiro o toggle; se a lista não cair para ~2, aplique também o
segundo filtro e registre a decisão neste arquivo.

### 3. Campos faltando na operação (frente B)

Confronto do diálogo atual (`src/app/(app)/operacoes/dialogo.tsx`) com a árvore
do Bubble (`documentacao-completa.md:1952–2010`):

| Falta | Onde no Bubble | Coluna no banco |
|---|---|---|
| Destino do recurso | Group VZ, ao lado de Comissão | `operacao.destino_recurso` ✔ já existe |
| Mandato assinado com o fundo | Group TZZ | `operacao.mandato_assinado_fornecedor` ✔ |
| Estruturação em Andamento | Group X | `operacao.estruturacao_em_andamento` ✔ |
| Rótulos certos dos toggles | Group S / JZZ | — |

Nenhuma coluna nova é necessária. Os rótulos do Bubble são "Com fee",
"Mandato assinado pelo cliente", "Mandato assinado com o fundo" e "NDA assinado
com o Cliente" — hoje a tela diz "Fee (yes/no)", "NDA assinado" e "Mandato
assinado".

### 4. Declinados em tabela separada (frente B)

Evidência: `documentacao-completa.md:1839` — a `tbl.etapas` principal **exclui**
os status `já cliente do fundo`, `declinado pelo fundo` e `declinado pelo
cliente`; a `tbl.etapas copy 2` mostra só esses três, abaixo da primeira, com a
nota em itálico *"Status referentes à: Já cliente do fundo, Recusado pelo
Cliente, Recusado pelo Fundo"*, e some quando a lista está vazia.

Ids em `status_etapa`: 11 `ja_cliente_do_fundo`, 13 `declinado_pelo_fundo`,
14 `declinado_pelo_cliente`.

### 5. "Na mão de" cabe inteiro (frente B)

`.lc-table td` no design system tem `white-space: nowrap; text-overflow:
ellipsis` (`src/app/design-system.css:78`). No Bubble o campo é
`MultiLineInput` (`documentacao-completa.md:1979`). Em leitura tem que quebrar
linha; em edição tem que ser `textarea`.

### 6. Dropdown não pode abrir pop-up (frente C)

`src/components/ui/seletor-popup.tsx` monta um `Dialogo` inteiro para escolher
um valor — inclusive dentro de células de tabela que já estão dentro de outro
diálogo. Vira **popover ancorado no gatilho**, com a mesma busca (o motivo de
existir continua válido: 31 tipos de operação, 73 fundos), mesma API de props,
sem sobreposição de janela.

### 7. Texto longo sem respiro, lentidão, animações (frente C)

- `.lc-field__input` é `padding: 0 var(--space-5)` com `height` fixo
  (`design-system.css:64`). Num `<textarea>` isso dá padding vertical **zero**:
  o texto cola na borda de cima. É o "trabalho desleixado" do pedido.
- Não existe **nenhum** `loading.tsx` no projeto. Cada navegação espera
  `auth.getUser()` + consulta de `perfil` (e `perfilAtual()` roda duas vezes por
  página: no layout e na page, sem `cache()`) e só então as consultas da tela,
  tudo antes da primeira pintura. Com ~100 registros, o gargalo é ida e volta de
  rede em série, não volume de dado.
- Sem animação nenhuma na troca de página ou na abertura de diálogo.

---

## Propriedade de arquivo (a regra que evita conflito)

| Caminho | Dono | Observação |
|---|---|---|
| `db/006_funil_tarefas.sql` | A | número reservado |
| `db/007_operacao_esteira.sql` | B | número reservado |
| `src/app/(app)/funil/**` | A | inclui arquivos novos e `funil.css` local |
| `src/app/(app)/clientes/**` | A | só o bloco "puxar do funil" |
| `src/app/(app)/operacoes/**` | B | inclui `operacao.css` local |
| `src/app/(app)/esteira/**` | B | |
| `src/lib/dominio.ts` | B | A põe os tipos novos no `page.tsx` do funil |
| `src/components/**` | C | ninguém mais toca |
| `src/app/globals.css`, `interface.css`, `design-system.css`, `tokens.css` | C | |
| `src/app/(app)/layout.tsx`, `src/app/layout.tsx` | C | |
| `src/lib/perfil.ts`, `src/lib/supabase/**` | C | |
| `**/loading.tsx` | C | C cria os de todas as rotas |
| `scripts/qa.mjs` | C | A e B **rodam**, mas só acrescentam passo no fim do arquivo |

Regras de convivência:

1. CSS de tela nova vai em arquivo próprio ao lado da rota
   (`src/app/(app)/funil/funil.css`), importado pelo `tela.tsx` daquela rota.
   Nada de editar `interface.css` fora da frente C.
2. C **não muda a assinatura** de `SeletorPopup` / `SeletorMultiploPopup` /
   `Campo` / `Dialogo`. A e B seguem usando como estão documentados.
3. Uma branch por frente: `qol-funil-tarefas`, `qol-operacao-esteira`,
   `qol-polimento`. Merge na ordem **B → A → C**; C roda `npm run qa` de novo
   depois do merge, porque é quem mexe no que todo mundo usa.
4. `npm run verify` passa antes de cada commit (regra 4). Commit em português,
   formato convencional, um por passo lógico.

---

## Decidido em 18/09/2026

- **Toda tarefa pertence a um cartão.** Não existe tarefa solta no quadro. A
  migration 006 fecha isso no banco (`funil_tarefa.cartao_id not null`) e a tela
  nunca oferece criar tarefa sem escolher o cartão.

## A confirmar com o negócio

1. **Esteira**: só o toggle, ou toggle + cliente com etapa "contrato assinado"?
   (item 2 acima)
2. **Tarefa**: prazo com hora ou só data? O desenho assume **data + hora
   opcional**, porque "reunião com o cliente tal" tem hora.
