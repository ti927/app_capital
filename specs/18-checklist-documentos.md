# 18 — Checklist de documentos do cliente

Pedido de 04/11/2026. Decisões tomadas com o Fabio no mesmo dia.

## O que é

Uma aba **Checklist** ao lado de **Documentos** (specs/17), no pop-up do
cliente e no da operação. Lista os documentos que a Lure pede ao cliente, com
o status de cada um à direita.

Itens padrão (a ordem é esta, definidos em `src/lib/checklist/itens.ts`):

BP 2023 · BP 2024 · BP 2025 · Balancete 2026 · DRE 2023 · DRE 2024 · DRE 2025 ·
DRE 2026 · Faturamento mensal 2023 · Faturamento mensal 2024 · Faturamento
mensal 2025 · Faturamento mensal 2026 · Contrato social consolidado atualizado ·
Relatório da Auditoria (caso seja auditado) · Declaração de IRPF dos sócios ·
Organograma Societário · Apresentação Institucional ou um resumo das
atividades · Relação de endividamento (credor, montante tomado, saldo devedor,
prazo, PMT, garantia e taxa de juros) · Aging da carteira (histórico de
recebimento com vencimento e liquidação) · Curva ABC de clientes · Curva ABC de
fornecedores · Matrícula das Garantias · Avaliação das Garantias.

Abaixo da lista, um campo e um botão **+** acrescentam itens extras, só deste
cliente. Item extra pode ser removido; item padrão, não (vira "não se aplica").

## Status

| Status | Ícone | Dica |
|---|---|---|
| `nao_recebido` | caixa vazia | Não recebido |
| `recebido` | caixa com ✓ | Recebido — o texto do item fica riscado |
| `parcial` | caixa com P | Recebido parcial |
| `nao_se_aplica` | X | Não se aplica — fora da contagem |

Clicar no status anda nessa ordem e volta ao começo; o ícone desliza (sai à
esquerda, o novo entra pela direita).

## Decisões

| Pergunta | Decisão |
|---|---|
| Uma checklist por cliente ou por operação? | **Por cliente.** A operação mostra a do cliente dela, como a aba Documentos. |
| Quem edita? | **Todos que veem o cliente** — master em todos, indicante nos dele. Mesma RLS de `cliente_email`. |
| Varredura achou o arquivo, mas alguém marcou à mão. O que vale? | **A marcação à mão.** A varredura só preenche o que ninguém marcou. |
| De qual Drive? | O da conexão única (specs/17) — hoje a conta do Maicon. Quem vê o cliente vê os documentos e a checklist dele, sem precisar de acesso ao Drive. |

## Como funciona

- **Banco** (`db/017`): `cliente_checklist_item` guarda só marcação à mão de
  item padrão (`chave`) e itens extras (`titulo`). Sem linha, ou com `status`
  nulo, o item segue a varredura. Trigger de log em `evento`.
- **Varredura**: ao abrir a aba, lê todos os arquivos da pasta do cliente,
  descendo subpastas (até 6 níveis, 2.000 arquivos), e procura cada item no
  **caminho** do arquivo ("Contábil/2023/Balanço.pdf" vale para BP 2023). É
  por nome, não por conteúdo: aparece como "Achado no Drive", com link para o
  arquivo. Item extra casa quando todas as palavras do título aparecem.
- **MCP** (`src/lib/mcp/ferramentas-checklist.ts`, para master e indicante):
  `ver_checklist_do_cliente`, `listar_documentos_do_cliente`,
  `ler_documento_do_cliente` (texto de Docs/Planilhas; PDF, imagem e Office
  anexados, até 8 MB), `marcar_item_checklist` (com observação; `automatico`
  devolve à varredura) e `adicionar_item_checklist`. Pelo Claude dá para
  conferir o **conteúdo** e marcar parcial com o que falta. Marcação pelo
  Claude aparece como "Marcado pelo Claude".

## Fora do escopo (por ora)

- Pedir o documento ao cliente (e-mail, link de envio).
- Lista padrão diferente por tipo de operação; os anos fixos (2023–2026)
  mudam no código.
