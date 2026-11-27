# 19 — Aba Requerências (Operações)

Pedido de 27/11/2026, tirado de uma conversa gravada com a equipe. Decisões
tomadas com o Fabio no mesmo dia.

## O que é

Uma aba **Requerências** na página de Operações, ao lado de **Status** (o
painel de cartões continua como está). Só a equipe master vê — como as abas
Fornecedor e Status.

Dentro da aba há só uma tabela: **todas as etapas** (fundos) de todas as
operações ativas, uma linha por etapa. O nome do cliente se repete em cada
linha da mesma operação — pode dar centenas de linhas, de propósito. Serve
para, de manhã, ver de uma vez o que está pendente em cada fundo, sem abrir
cliente por cliente.

## Colunas

| Coluna | De onde vem |
|---|---|
| Cliente | `cliente.nome_razao` da etapa |
| Identificador | `operacao.identificador` |
| Fundo | `fornecedor.nome_fundo` da etapa |
| Status | `status_etapa.rotulo`, texto colorido como na aba Fornecedor |
| Na mão de | `etapa_operacao.na_mao_de`, quebrando linha |

Fundo, Status e Na mão de são as mesmas colunas da tabela-resumo de fundos do
pop-up da operação.

## Ordem e filtro

- **Cliente** e **Fundo** têm uma setinha no cabeçalho. Clicar ordena A→Z;
  clicar de novo inverte (Z→A). Clicar na outra coluna passa a ordem para ela.
  No empate vale a outra coluna, sempre A→Z (os fundos de um cliente ficam
  juntos, e vice-versa). Linha sem nome vai para o fim nos dois sentidos.
- Abre ordenada por Cliente, A→Z.
- **Status** tem o filtro no próprio cabeçalho, de **vários status ao mesmo
  tempo**. Nenhum marcado = todos.
- **Não há busca por nome** — pedido explícito: quem quer um cliente busca na
  aba Cliente.

## O que entra

As mesmas regras da aba Fornecedor: só etapas de operação **não arquivada** e
de cliente **não arquivado**. Fundo arquivado aparece como "-".

## Clique na linha

Abre o pop-up da operação daquela etapa (comodidade; não estava no pedido).

## Não muda

Nada no banco, nada na RLS: os dados já vinham na página de Operações.
