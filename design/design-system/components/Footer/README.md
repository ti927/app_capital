Rodapé de página em `neutral-950`, com a assinatura negativa, uma linha de contexto e links secundários.

É o único lugar da interface interna que inverte a base: fundo quase preto mesmo no tema claro. Por
isso a assinatura entra em `tone="white"` e os links em `neutral-300`, que dá 9,8:1 sobre
`neutral-950`.

## O que o consumidor fornece
`links` (strings ou `{label}`), `tagline`, `copyright` e `chip`. Os destinos dos links são do
consumidor — o componente só os desenha.

## Regras
- A linha de copyright ocupa a largura inteira (`width: 100%` no flex) e vai em `font-mono` 11px.
- Rodapé é para link secundário — suporte, documentação, privacidade. Ação de produto fica na
  app bar ou no rodapé do diálogo, nunca aqui.
- Numa tela de trabalho densa, o rodapé some: ele pertence ao login, às telas públicas e às
  páginas de conteúdo.
