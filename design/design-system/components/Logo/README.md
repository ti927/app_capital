Assinatura do produto: o símbolo em SVG, "LURE" como texto vivo em Archivo 800 e o chip do produto.

O símbolo é o **"+" que também vira "×"** — *somar e multiplicar*, de **LU**cro + **RE**ntabilidade.
Cinco blocos: quatro braços e um miolo. **O miolo em `accent` é o único ponto de cor; os braços
nunca são coloridos.**

## O que o consumidor fornece
Nada obrigatório. `chip` define o texto do chip (padrão `"CRM"`); `chip={null}` remove o chip, que
é como o Sistema Lure assina. `href` transforma a assinatura em link e o `aria-label` sai de
`label` ou do nome + chip.

## Quando usar cada coisa
- `Logo` na app bar (`size={28} nameSize={18}`), no rodapé e no login.
- `Logo tone="white"` sobre `neutral-950`, sobre `surface` do tema escuro e sobre o painel do login.
- `Symbol` sozinho quando não há espaço para o texto: favicon, avatar, estado vazio, cartão.
- `Symbol tone="mono"` só para saída de uma tinta — fax, gravação, impressão. Nunca na tela.

## Regras
- **Mínimo 16px** no símbolo. Abaixo disso as folgas entre os blocos fecham e vira um quadrado.
- **Área de proteção:** margem livre em todos os lados igual à altura de um bloco.
- O nome fica **texto**, não contorno — é acessível e nítido em qualquer tela. Os SVGs de
  `assets/Marca/logo-horizontal*.svg` existem para uso fora do app, e nesse caso a fonte vai
  convertida em contornos.
- **Não faça:** recolorir os blocos, distorcer, girar o símbolo, aplicar sobre fundo sem contraste,
  ou desenhar uma assinatura nova.

## Pendência
O chip padrão é `"CRM"`, herdado do produto irmão. A assinatura do app_capital ainda não foi
decidida (§12.1 do prompt de design). Até lá, passe o chip explicitamente e não altere o símbolo.
