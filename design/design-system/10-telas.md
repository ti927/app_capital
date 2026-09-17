# Arranjo das telas

Levantado das capturas do app Bubble em produção (nível master). **A captura manda no arranjo;
o documento de design manda no conteúdo.** Onde as duas divergiram, o arranjo daqui vence e a
divergência está anotada.

## A casca

Barra superior de altura fixa em `surface-sunken`, com a **assinatura centrada na janela** —
"LURE ✛ CAPITAL", símbolo policromático, marca registrada. À direita, nesta ordem: sair · trocar
senha · **Configurações** (botão com engrenagem). Componente: `AppBar`.

**A navegação é lateral, não horizontal** — `SideNav`, 220px, à esquerda, abaixo da barra. Cinco
itens em pílula, ícone + rótulo:

1. Funil de Clientes · 2. Cliente · 3. Fornecedor · 4. Operação · 5. Esteira de Estruturação

> **Divergência.** O documento de design descreve nav horizontal na app bar e a ordem Funil ·
> Esteira · Operação · Fornecedor · Cliente. Produção tem barra lateral e a ordem acima.

## Esteira de Estruturação

Campo de busca **"Buscar"** com lupa à direita, estilo sublinhado (só a linha de base, sem caixa),
no alto da área de conteúdo. Abaixo, a lista de operações em cartões de linha única.

Cada linha traz **tipo de operação + " - " + nome do cliente** — o tipo primeiro, em tom de apoio;
o cliente depois, em negrito. À direita da linha, **um único ícone: o lápis.** Não há lixeira nem
arquivar aqui.

> **Divergência.** O documento descreve "identificador + ' - ' + nome do cliente". Produção mostra
> o tipo de operação no lugar do identificador.

## Operação

Título **"Detalhes da operação"**. Abaixo dele, três abas — **Cliente · Fornecedor · Status** — com
a ativa em sublinhado e cor de destaque. À direita da faixa de abas, o botão **"Nova Operação"**.

### Aba Cliente
Lista de operações em cartões. Cada um: **nome do cliente** em negrito + " - " + **tipo de
operação** em tom de apoio; abaixo, em itálico e menor, **quem visualiza** ("Maicon Farina, Igor
dos Santos Guedes"). À direita, três ações **nesta ordem: arquivar · deletar · editar**.

No fim da lista, o bloco **"Arquivados"** — ícone de caixa, rótulo e duplo chevron —, fechado.

> **Divergência.** O documento descreve as ações como lixeira · lápis · arquivar. Produção usa
> arquivar · lixeira · lápis, e essa ordem se repete em Cliente e em Fornecedor.

### Aba Fornecedor
Rótulo **"Fundo parceiro:"** e um seletor de largura inteira. **Antes de escolher o fundo não há
tabela nenhuma** — a área abaixo fica vazia. Escolhido o fundo, aparece a tabela:

| Cliente | Demanda inicial | Demanda final | Tipo de operação | Status |

Cabeçalho em fundo rebaixado, rótulos quebrando em duas linhas. Célula vazia mostra **"-"**. O
status é **texto colorido, sem pílula**: "declinado pelo fundo" em vermelho, "operação em análise"
e "docs requeridos" em tom neutro.

> **Divergência.** O documento lista as colunas como Cliente · Demanda inicial · Tipo de operação ·
> Status · Demanda final. Produção põe **Demanda final logo depois de Demanda inicial**.

### Aba Status
Quatro cartões lado a lado, cada um com uma **faixa superior colorida** própria, nesta ordem:
**Inicial · Em andamento · Operação Aprovada · Excluído ou Paralisado**.

Cada cartão: título centrado, depois uma linha de rótulos **Operação | Volume | Fee**, depois os
itens separados por **linha tracejada**. Cada item traz o nome do cliente truncado, o tipo de
operação abaixo em tom de apoio, e na coluna do meio a faixa de volume ("40MM via Fiagro / FIDC a -").

**"Soma:"** com campo aparece no rodapé de **"Em andamento"** e de **"Operação Aprovada"** apenas.

## Fornecedor

Duas abas no alto, nesta ordem: **Fornecedores · Tipo Operações**. A ativa leva sublinhado grosso.
Abaixo, o campo de busca à esquerda e o botão **"Novo Fundo"** à direita.

> **Divergência.** O documento descreve a ordem "Tipo Operações " e depois "Fornecedores ".
> Produção mostra **Fornecedores primeiro**. E o botão "Novo Fundo" é o mesmo nas duas abas,
> inclusive na de tipos de operação, onde o rótulo não corresponde à ação.

### Aba Fornecedores
| Nome | Tipos de operação | Faturamento minimo | Operação minima | Segmento foco | *(ações)* |

Os tipos aparecem como lista separada por vírgula, em tom de apoio. Célula vazia: **"-"**. Ações da
linha: arquivar · deletar · editar.

### Aba Tipo Operações
| Nome | 1º Linha | 2º Linha | Habilitados |

"Habilitados" é uma **grade de várias colunas de nomes de fundo dentro da própria célula**, com
barra de rolagem horizontal quando não cabe. As linhas têm alturas bem diferentes entre si.

## Cliente

Campo **"Buscar clientes"** à esquerda e botão **"Novo Cliente"** à direita, **no alto** — antes da
lista. Abaixo, a lista: cada linha mostra **só o nome/razão**, e à direita arquivar · deletar ·
editar.

> **Divergência.** O documento descreve a ordem lista → barra → arquivados. Produção põe a barra
> no topo.

## Funil de Clientes

Título **"FUNIL COMERCIAL"** em caixa alta. À direita, três botões: **"Colunas no fluxo"** ·
**"Tags"** (ambos de contorno) · **"Nova coluna"** (preenchido).

Abaixo, a barra de filtro: busca **"Buscar empresa, contato, indicante.."** e, ao lado,
**"Filtrar por tag:"** com as cinco tags como pílulas — **Docs recebidos · Falta docs ·
Docs Solicit. · Congelado · Cancelado** —, cada uma com um ponto colorido.

O quadro é um kanban de colunas roláveis na horizontal. Cabeçalho de coluna: setas ‹ › de
reordenação, o nome em caixa alta, ícone de arquivar e X; abaixo, **"N cartões / N arquivados"**.

**Cartão**, de cima para baixo: as tags (ou "sem tags") · **empresa** em negrito ·
*contato · segmento* · o parecer truncado em poucas linhas · pílula de **faturamento** ("109MM/ano")
· pílula **"indicado por ‹nome›"** · rodapé com **"atualizado dd/mm/aaaa"** e, quando houver,
"· call dd/mm/aaaa" e "- KB dd/mm/aaaa".

No fim de cada coluna, **"+ Novo cartão"** em botão tracejado.
