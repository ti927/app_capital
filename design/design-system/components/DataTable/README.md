Tabela densa — o componente mais importante do sistema. 32px por linha, cabeçalho de 36px, `table-layout: fixed`.

Cabeçalho em `surface-sunken`, rótulo de coluna em 11px/600 caixa alta com tracking 0.06em e cor
`text-muted`. Primeira coluna em 600, porque é ela que identifica a linha. `tfoot` com totais em
`surface-sunken`/700. Hover de linha clareia o fundo para `surface-hover`.

## O que o consumidor fornece
`columns` (`{key, label, num, width, plain}`), `rows` (objetos com essas chaves; o valor pode ser um
nó React — chip, botão), `footer` e `blank`. Ordenação, filtro, paginação e busca são do consumidor.

## As seis regras do filtro por coluna
Vieram de defeito real em produção no CRM. Quem montar a segunda linha de `thead` segue todas:

1. O rótulo do controle **não repete o cabeçalho**: sob PAPEL o select diz "Todos", não "Todos os
   papéis". O nome da coluna vai para o `aria-label` ("Filtrar por Papel").
2. **Nenhum controle quebra linha**: todo gatilho com `nowrap` + `overflow: hidden` + filho truncado.
3. **Uma medida só** para a linha de filtro inteira: `control-h-sm` (28px), mesmo padding.
4. Célula de filtro **alinha pelo topo** (`vertical-align: top`).
5. Filtro de intervalo (data, valor) **empilha**; não divide a coluna em duas.
6. Rótulo que não cabe é **encurtado, nunca cortado no meio** — o nome inteiro vai no `title`.

## Regras
- **Célula vazia mostra `-`**, não fica em branco: é o padrão do original e distingue "sem valor"
  de "não carregou". A cor é `text-muted`.
- Coluna numérica: `num: true` → alinhada à direita, em `font-mono` com `tabular-nums` e `nowrap`.
- `table-layout` é `fixed`, então **declare `width` em todas as colunas**. Sem isso a tabela
  redistribui sozinha e as colunas dançam entre as telas.
- Linha de 44px (`cozy`) só quando há avatar, duas linhas de texto ou par realizado/orçado —
  nesse caso o valor principal em cima e o secundário em 11px `text-muted`.
- Chips dentro da tabela ficam em `nowrap` e a coluna tem largura fixa.
- Zeros aparecem em `text-muted` — apagados, não escondidos.
- Tabela vazia não fica muda: troque por `EmptyState` com a contagem do que o filtro esconde.
