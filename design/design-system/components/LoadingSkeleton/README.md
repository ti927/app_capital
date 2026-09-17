Esqueleto de carregamento: blocos de 12px em `skeleton`, com larguras variadas.

## O que o consumidor fornece
`rows` (quantos blocos) e `widths` (as larguras cicladas). Quando mostrar e quando trocar pelo
conteúdo é do consumidor.

## Regras
- **Larguras diferentes.** Blocos de largura igual viram um retângulo cinza e não leem como texto
  carregando. O padrão cicla 78/54/88/42/66/70%.
- O esqueleto tem a **forma do que vai chegar**: numa tabela, um bloco por linha na altura de
  `row-h-compact`; num formulário, pares de rótulo e campo.
- `aria-busy="true"` e `aria-live="polite"` já vêm no contêiner — não anuncie de novo por fora.
- Sem animação de brilho: o sistema não define motion, e o cinza parado já basta.
- Carregamento que passa de poucos segundos vira texto — "Carregando 2.540 linhas…" — não esqueleto
  infinito.
