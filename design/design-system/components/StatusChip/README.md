Pílula de 20px com ponto colorido e rótulo, para todo status do sistema.

**Cor nunca é o único sinal: o chip sempre traz o rótulo por escrito.** O ponto de 6px usa
`var(--<token>)` e o texto `var(--<token>-ink)`; o fundo é `surface` com borda `border`, igual em
todos os status, para a pílula não competir com o conteúdo da linha.

## O que o consumidor fornece
`token` — o nome do par de cor **sem `--` e sem `-ink`** — e `label`. Mapear o status do banco para
o token é do consumidor: o componente não conhece domínio.

| Família | Tokens | Onde |
|---|---|---|
| Etapa da operação | `st-etapa-inicio` · `-em-curso` · `-avanco` · `-fechado` · `-terminal-neutro` · `-pausado` · `-terminal-negativo` | Tabela de etapas e aba Status |
| Negócio | `status-parado` · `-negociacao` · `-ganho` · `-perdido` | Listas de operação |
| Funil | `stage-1` … `stage-6` | Cartão e coluna do funil |
| Semântica | `success` · `danger` · `warning` · `info` | Retorno de ação, não status de domínio |

## Regras
- Altura 20px dentro de tabela, 22px fora (`loose`). Sempre `white-space: nowrap` — sem isso o
  texto vaza da pílula de 20px. A classe já garante.
- **"Paralisado" é âmbar (`st-etapa-pausado`), não amarelo.** O `#ffdd00` do Bubble fica reservado
  à ação; a troca está autorizada pela §8 do prompt de design.
- Em coluna de tabela o chip não encolhe: dê largura fixa à coluna e deixe o chip em `nowrap`.
- Os sete grupos de etapa são **proposta** da §8, ainda a confirmar. Os 14 status do banco se
  agrupam neles; se a decisão mudar, muda o mapa do consumidor, não o componente.
