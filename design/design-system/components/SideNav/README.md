Navegação lateral de 220px com os cinco itens do produto, em ordem fixa.

Cada item é ícone + rótulo numa pílula (`radius-pill`). O item da página atual recebe fundo
`accent` com texto `accent-on` — é o único lugar da casca em que o amarelo preenche. Os demais
ficam em `text-secondary` e, sob o cursor, em `surface-hover`.

## O que o consumidor fornece
`items` (strings ou `{label, href, active}`), `active` quando `items` é de strings, e `icons` — um
mapa de rótulo para ícone. Rotas, permissão e montagem da lista são do consumidor: **este
componente não conhece nível de acesso.**

## A ordem é fixa
1. **Funil de Clientes**
2. **Cliente**
3. **Fornecedor**
4. **Operação**
5. **Esteira de Estruturação**

Esta é a ordem que está em produção e ela não muda. Para o nível **indicante** somem Fornecedor,
Operação e Esteira; sobram Funil de Clientes e Cliente, alinhados ao topo.

## Regras
- Largura `sidenav-w` (220px), fixa. O rótulo mais longo, "Esteira de Estruturação", **quebra em
  duas linhas** — é assim no original e é por isso que o item tem altura mínima em vez de altura
  fixa. Não encolha a fonte para forçar uma linha só.
- A pílula do item ativo envolve ícone e rótulo juntos, inclusive quando o rótulo tem duas linhas.
- `aria-current="page"` no item ativo, sempre — a cor sozinha não anuncia a página.
- O ícone é decorativo (`aria-hidden`): quem lê o item é o rótulo.
- **Pendência:** os ícones do preview são marcadores temporários. Os do original são do Bubble e
  não vieram no repositório.
