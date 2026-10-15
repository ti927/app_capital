# 16 — Página de master liberada para um indicante

Decidido em 15/10/2026, a pedido do Fabio: liberar a tela **Operação** para o
Igor Guedes (indicante), só com as operações que estão com o nome dele.

## Quem entra

- A liberação é **por pessoa**, numa linha de `acesso_pagina`
  (`perfil_id`, `pagina = 'operacao'`). A tabela existia vazia desde a 001
  (era a `tbl.config` do Bubble); agora é a fonte da verdade para abrir uma
  página de master a um indicante.
- Master não consulta a tabela: continua vendo tudo.
- Sem linha, o indicante segue como antes: o item some do menu e `/operacoes`
  manda para `/clientes`.
- Liberar outra pessoa: inserir a linha (master, pelo banco). Por enquanto não
  há tela para isso; o painel "Acesso às páginas" das Configurações ainda é
  só leitura.

## Quais operações

"Com o nome dele" = operações de clientes em que ele está em **quem
visualiza** (`cliente_visualizador`), ou que ele cadastrou. Quem recorta é a
RLS que já existia (`operacoes_visiveis()`, db/009) — nada mudou no banco.

## O que ele faz — o mesmo do Bubble (documentacao-completa.md:1888–2009)

| Na tela | Master | Indicante liberado |
|---|---|---|
| Lista de operações ativas | todas | só as dele |
| Linha de "quem visualiza" na lista | vê | some (Text L) |
| Arquivados | vê | some (Group Arquivados) |
| Abas Fornecedor e Status | vê | somem (Button B, G) |
| Nova Operação | sim | não* |
| Arquivar / excluir | sim | não |
| Editar campos, pareceres, status atual, interruptores | sim | **sim** |
| Observações | sim | **sim** |
| Etapas (Lista de Fornecedores) | edita | só lê (Group edição / Group etapas ocultos) |
| Declínios | edita | desabilitado |
| Enviar Email | sim | não (Button E) |
| Trocar o cliente da operação | não (só leitura) | não |

\* No Bubble o botão aparece, mas o seletor de cliente do indicante só lista
clientes que ele mesmo criou — o Igor não criou nenhum, então na prática não
cadastrava. Ficou escondido; se precisar, é decisão nova.

As ações em `operacoes/acoes.ts` conferem o nível de novo no servidor — a
tela esconder não basta.

O pop-up moderno não tem modo indicante: indicante fica sempre no clássico
(já era a regra de 14/10/2026).
