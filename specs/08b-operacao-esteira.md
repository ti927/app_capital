# Frente B — Operação e Esteira

> Roteiro para um terminal. Contexto completo em `specs/08-melhorias-qol.md`.
> Leia antes: `CLAUDE.md`, `src/app/(app)/operacoes/*`, `src/app/(app)/esteira/*`,
> e no Bubble só as linhas **1567–1807** (esteira) e **1808–2015** (operação) de
> `specs/bubble/documentacao-completa.md` — nunca o arquivo inteiro.
> **Não abra** `src/components/**`, `src/app/*.css`, `src/app/(app)/funil/**`,
> `src/app/(app)/clientes/**` — são de outra frente.

Branch: `qol-operacao-esteira`.

---

## B1 · Esteira só com o que está em estruturação

Hoje `esteira/page.tsx` traz toda operação não arquivada. O Bubble
(`documentacao-completa.md:1611`) faz:

```
Do a search for operação where arquivado = false AND Estruturação em Andamento = true
```

Aplique o filtro na consulta (não no cliente) e ordene por nome do cliente, não
por `identificador` — a lista mostra o cliente.

Migration `db/007_operacao_esteira.sql`:

```sql
create index operacao_estruturacao_idx
  on public.operacao (estruturacao_em_andamento, arquivado)
  where estruturacao_em_andamento;
```

**Confira a contagem**: em produção são duas linhas. Se com o toggle a lista
não cair para ~2, a mesma expressão do Bubble encadeia um segundo filtro — só
operação cujo cliente tem etapa com status `contrato_assinado`. Aplique-o,
e registre a decisão em `specs/08-melhorias-qol.md` (seção "A confirmar",
ponto 1). Não invente terceiro critério (regra 9).

## B2 · Toggle "Estruturação em Andamento" no diálogo da operação

Sem ele não há como alimentar a esteira pela tela. No Bubble é o Group X, no pé
do diálogo, ao lado do botão Cadastrar/Salvar (`documentacao-completa.md:2001`)
— exatamente o que aparece na captura de produção.

Grava `operacao.estruturacao_em_andamento`. Cuidado com a dívida herdada
documentada em `:2271`: no Bubble esse toggle **exibe** `fee (yes/no)` e
**grava** `Estruturação em Andamento`. Isso é bug do original, não comportamento
a copiar — aqui exibe e grava o mesmo campo.

## B3 · Campos que faltam no diálogo da operação

Confronto feito contra `documentacao-completa.md:1952–2010`. Nenhuma coluna
nova no banco: todas já existem em `operacao`.

| Acrescentar | Campo | Onde |
|---|---|---|
| Destino do recurso | `destino_recurso` | ao lado de Comissão (Group VZ) |
| Mandato assinado com o fundo | `mandato_assinado_fornecedor` | linha dos toggles |
| Estruturação em Andamento | `estruturacao_em_andamento` | B2 |

Rótulos, como estão em produção (a captura confirma):

| Hoje na tela | Correto |
|---|---|
| Fee (yes/no) | Com fee |
| NDA assinado | NDA assinado com o Cliente |
| Mandato assinado | Mandato assinado pelo cliente |
| — | Mandato assinado com o fundo |

Acrescente os campos novos ao `CAMPOS` de `operacoes/page.tsx` e ao `update` de
`gravarOperacao` em `operacoes/acoes.ts`. `src/lib/dominio.ts` já tem todos os
campos tipados — se mexer nele, é o único arquivo compartilhado que é seu.

## B4 · Tabela de declinados abaixo da principal

Regra do Bubble (`documentacao-completa.md:1839`, `tbl.etapas` e
`tbl.etapas copy 2`):

- A **Lista de Etapas** exclui as etapas com status `ja_cliente_do_fundo` (11),
  `declinado_pelo_fundo` (13) e `declinado_pelo_cliente` (14).
- Logo abaixo, uma segunda tabela com **só** essas etapas, mesma estrutura de
  colunas e mesma edição por linha.
- Abaixo dela, em itálico e tom de apoio: *"Status referentes à: Já cliente do
  fundo, Recusado pelo Cliente, Recusado pelo Fundo."*
- As duas somem quando a lista respectiva está vazia (a principal já se comporta
  assim hoje).

Extraia a tabela de etapas de `operacoes/dialogo.tsx` para um componente que
recebe as linhas e um título, e use-o duas vezes. A linha de criação de etapa
("Fundos sugeridos / Tipo de operação sugerido / Status / Na mão de") fica só na
primeira.

## B5 · "Na mão de" cabe o conteúdo inteiro

`.lc-table td` é `nowrap` + `ellipsis` (design system) — o texto some. No Bubble
o campo é `MultiLineInput` (`:1979`).

- Em leitura: a célula quebra linha e mostra tudo (`white-space: normal`,
  `overflow: visible`, alinhamento no topo da linha).
- Em edição: `textarea` (use `Campo multilinha linhas={2}`), não `input`.
- Vale para as duas tabelas (B4) e para a linha de criação.

O CSS vai em **arquivo novo** `src/app/(app)/operacoes/operacao.css`, importado
pelo `tela.tsx` da própria rota. Não edite `interface.css` nem
`design-system.css` (este último é regravado por `npm run tokens`).

Dê mais largura à coluna no `<colgroup>` — as porcentagens atuais (24/20/18/20/10/8)
sobram no Fundo e faltam no "Na mão de".

## B6 · Fechamento

- `npm run verify` antes de cada commit.
- `npm run qa` nas três formas e **abra as capturas** (regra 5): confira que a
  segunda tabela aparece, que o texto de "Na mão de" não está cortado e que a
  esteira lista duas operações.
- Passo novo de QA, se precisar, só no **fim** de `scripts/qa.mjs`.

Commits sugeridos: `fix: esteira lista so operacao em estruturacao` ·
`feat: campos que faltavam no dialogo de operacao` ·
`feat: tabela de etapas declinadas` · `fix: na mao de mostra o texto inteiro`.

---

# Achado · 21/09/2026 — por que a esteira parece vazia

Relato: *"dentro da esteira nenhum dado está sendo puxado, sendo que no Bubble
tem linhas e linhas de informações concluídas, e tem dois Garcia Agronegócios"*.
São **três coisas diferentes**, e só a primeira era defeito de código.

## 1. O rótulo da lista estava errado — corrigido

A linha mostrava a lista de tipos das etapas (`CPR / FGI / Capital de Giro`).
O Bubble mostra o **identificador da operação** (árvore de elementos,
`documentacao-completa.md:1650`):

```
txt.qual cliente copy = operação's identificador   (cond is_empty -> invisível)
txt.qual cliente      = " - " + qual cliente's nome/razão
```

Por isso os "dois Garcias": as duas linhas são operações **diferentes do mesmo
cliente** — e é assim mesmo, o segundo filtro da esteira é por cliente
(ver acima). Só que o rótulo antigo escondia o que as separa, e ainda fazia uma
delas (`CRA`) sair idêntica ao identificador da outra. Agora lê
`Giro com Barter - Garcia Agronegócios` e `CRA - Garcia Agronegócios`.

## 2. O diálogo abria na etapa errada — corrigido

A EXPR-ETAPA do Bubble (`documentacao-completa.md:1594`) pendura o pop-up na
etapa **do fundo com status "contrato assinado"**. O código abria em
`etapas[0]`, que numa operação de nove fundos quase nunca é essa. Idem
"Instituição Líder": o comentário dizia "o fundo da etapa com contrato
assinado" e o código pegava a primeira etapa com fundo, assinada ou não.

Divergência assumida: quando **nenhuma** etapa assinou, o Bubble não mostra
etapa nenhuma (a busca aninhada resolve para vazio). Aqui cai na primeira,
porque esta tela tem seletor de etapas e o Bubble não tem.

## 3. Os campos vazios NÃO são defeito — é o dado que não existe

Conferido no banco e no retrato do Bubble, nas 383 etapas:

| | preenchidas |
|---|---|
| volume, dt_inicio, gestor, administrador, assessoria legal | **1** etapa |
| DTVM, securitizadora, agente fiduciário, custodiante, emissor, estruturador, demais | **0** |
| TsAssinado, Opdepe, FeeRecebido | **0** |
| itens de checklist | 7 (da mesma etapa) |
| instrumento | 1 (da mesma etapa) |

A única etapa com esteira preenchida é **Hospcom · FIDC · Vert Capital**
(volume 20.000.000,00, gestor Vert, administrador Vert, assessoria Verano,
instrumento FIDC Proprietário, 7 itens de checklist). Essa operação está
`arquivado = true` **no próprio Bubble** — então nem lá ela aparece na esteira.
As duas do Garcia, que aparecem, não têm um campo de esteira preenchido na
origem.

Ou seja: a carga não perdeu nada. Não há o que puxar.

## O que ainda pode estar faltando, e como resolver

O retrato veio do **version-test**, cuja modificação mais recente é
**15/09/2026**. `cliente`, `operação` e `etapas_operação` **nunca foram
publicados na Data API do live** — conferido de novo em 21/09/2026: os três
dão **HTTP 404** no live e **200** no version-test. Se alguém preencheu a
esteira no app de verdade depois de 15/09, esse dado não tem como ter chegado
aqui.

Para tirar a dúvida — e é a única forma:

1. No Bubble: **Settings › API**, marcar os três data types em **live**.
2. `node scripts/extrair-bubble.mjs --live`
3. `npm run carregar` — a recarga **preenche e nunca apaga** (`coalesce` com o
   valor daqui na frente), então o que já foi digitado na nossa tela sobrevive.

Enquanto isso não for feito, "campo vazio" continua ambíguo: pode ser que nunca
tenha existido, pode ser que tenha sido digitado no live depois da cópia.
