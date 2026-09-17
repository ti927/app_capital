# Marca

Os oito arquivos desta pasta são finais e prontos para produção — vieram de
`design/assets/` do repositório `ti927/app_capital` e não devem ser redesenhados,
recortados nem recoloridos.

O símbolo é o **"+" que também vira "×"** — *somar e multiplicar*, acrônimo de
**LU**cro + **RE**ntabilidade. São cinco blocos com raio 1.5 numa viewBox 48×48:
quatro braços e um miolo. **O miolo é o único ponto de cor; os braços nunca são
coloridos.**

Cada SVG entra por `<img>`, que não herda `currentColor` — por isso existe uma
variante por fundo. A tinta de cada arquivo está na tabela.

| Arquivo | Tinta dos braços | Miolo | Onde usar |
|---|---|---|---|
| `symbol.svg` | `#171717` (= `neutral-900` / `text` claro) | `#ffdd00` (`accent`) | Símbolo primário sobre `surface`, `bg` e `surface-sunken` no tema claro. |
| `symbol-white.svg` | `#ffffff` (= `neutral-0`) | `#ffdd00` (`accent`) | Sobre `surface` e `bg` do tema escuro, e sobre o painel escuro do login. |
| `symbol-mono-black.svg` | `#171717` | `#171717` | Uma tinta só: fax, gravação, impressão monocromática. Nunca na tela. |
| `logo-horizontal.svg` | `#171717`, texto `#171717`, chip preenchido `#171717` com "CRM" em `#ffffff` | `#ffdd00` | Assinatura 312×80 para fundo claro, fora do app (PDF, apresentação, terceiro). |
| `logo-horizontal-negative.svg` | `#ffffff`, texto `#ffffff`, chip preenchido `#ffffff` com "CRM" em `#171717` | `#ffdd00` | A mesma assinatura para fundo escuro. |
| `favicon.svg` | tile `#171717` raio 10, símbolo `#ffffff` | `#ffdd00` | Aba do navegador. Gerar 16, 32 e 48px e o `.ico` a partir dele. |
| `favicon-yellow.svg` | tile `#ffdd00` raio 10, símbolo `#171717` | `#171717` | Variante de destaque. É a única peça em que o miolo não é amarelo — o tile já é. |
| `app-icon.svg` | tile `#171717` raio 112 em 512×512, símbolo `#ffffff` | `#ffdd00` | Ícone maskable de PWA e avatar. Gerar 180 (apple-touch), 192 e 512px. |

## Regras

- **Área de proteção:** margem livre em todos os lados igual à altura de um bloco do símbolo.
- **Tamanho mínimo do símbolo:** 16px. Abaixo disso as folgas entre os blocos fecham.
- **No app, o símbolo é SVG inline e o texto é vivo** — "LURE" e o chip em Archivo,
  não em contorno. Use o componente `Logo`. Os SVGs de assinatura existem para uso
  fora do app; nesse caso converta a fonte em contornos antes de exportar.
- **Não faça:** recolorir os blocos, distorcer, girar o símbolo, ou aplicar sobre fundo
  sem contraste.

## Uma pendência de nome

Estes arquivos trazem o chip **"CRM"** — são a assinatura do Lure CRM, o produto irmão.
A assinatura do app_capital ainda não foi decidida (§12.1 do prompt de design: chip
"CAPITAL" ou outra opção). Até a decisão, use `Logo` com o chip que o produto pedir e
o símbolo sem alteração; **nenhuma assinatura nova foi desenhada aqui.**
