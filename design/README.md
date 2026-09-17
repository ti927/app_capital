# Handoff: Marca do Lure CRM

## Visão geral
Identidade visual do **Lure CRM** — a ferramenta interna de funil de vendas da Lure Consultoria.
A marca deriva da marca-mãe Lure (manual BR/BAUEN): o elemento gráfico base é o **"+"**
(LUcro + REntabilidade, que também vira "×" — "somar e multiplicar"), tipografia grotesca
pesada e base preto/branco com **amarelo** como cor de ação e **ciano** pontuando.

Conceito escolhido: **símbolo em blocos coesos** ("+" reconstruído em 5 blocos, miolo amarelo)
+ assinatura **LURE** (Archivo ExtraBold, caixa alta) com **CRM** em chip preto.

## Sobre os arquivos deste pacote
Os arquivos são **referências de design**. Os SVGs em `assets/` são finais e prontos para produção
(o símbolo, favicon e app-icon são vetor puro, independentes de fonte). Os HTMLs em `components/`
são **protótipos de referência** mostrando o resultado pretendido — recrie-os no ambiente do
projeto (React/Vue/etc.) usando os padrões e a biblioteca de componentes já existentes.

## Fidelidade
**Alta (hifi).** Cores, tipografia, espaçamentos e medidas são finais. Reproduza fielmente.

## Ativos (assets/)
| Arquivo | Uso |
|---|---|
| `symbol.svg` | Símbolo primário (blocos pretos, miolo amarelo). Fundo claro. |
| `symbol-white.svg` | Símbolo para fundo escuro (blocos brancos, miolo amarelo). |
| `symbol-mono-black.svg` | Símbolo 1 cor (tudo preto) — fax, gravação, 1 tinta. |
| `logo-horizontal.svg` | Assinatura horizontal com texto (LURE + chip CRM). Fundo claro. |
| `logo-horizontal-negative.svg` | Assinatura horizontal para fundo escuro. |
| `favicon.svg` | Tile preto arredondado + símbolo branco/amarelo. Aba do navegador. |
| `favicon-yellow.svg` | Variante tile amarelo (miolo preto) — ícone de destaque. |
| `app-icon.svg` | Ícone de app 512×512 maskable (raio 112). PWA / avatar. |

**Fonte:** o texto dos SVGs de assinatura usa **Archivo**. No app, mantenha "LURE"/"CRM" como
**texto vivo** (ver `components/logo.html`). Para uso fora do app (impressão, terceiros),
converta a fonte em contornos antes de exportar.

### PNGs / favicon.ico
Gerar a partir dos SVGs: `favicon.svg` → 16, 32, 48px (e .ico); `app-icon.svg` → 180 (apple-touch),
192 e 512 (manifest PWA). Sugestão de HTML:
```html
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon-32.png" sizes="32x32">
<link rel="apple-touch-icon" href="/app-icon-180.png">
```

## Componentes (components/)
- **header.html** — App bar 56px, fundo branco, borda inferior 1px #dcdcdc. Logo à esquerda, nav, busca, botão amarelo "+ Novo negócio", avatar.
- **footer.html** — Rodapé #0d0d0d, símbolo branco, chip branco, links secundários #b8b8b8.
- **login.html** — Split: painel escuro com marca + tagline "Organize potencial em resultados." / formulário à direita com botão amarelo "Entrar".
- **logo.html** — Snippet HTML/CSS de referência da assinatura + regras de fonte.

## Regras de uso
- **Área de proteção:** margem mínima = altura de 1 bloco do símbolo em todos os lados.
- **Tamanho mínimo do símbolo:** 16px (no favicon 16px as folgas entre blocos fecham).
- **Não faça:** recolorir os blocos, distorcer, girar o símbolo, ou aplicar sobre fundo sem contraste.
- **Miolo amarelo** é o único ponto de cor da marca; nunca colorir os braços.

## Design tokens
Ver `lure-crm-tokens.css` (copiado do sistema). Principais:
- Tinta: `#171717` · Branco: `#ffffff` · Fundo: `#f5f5f5` · Borda: `#dcdcdc`
- Ação (amarelo): `#ffdd00`, texto sobre amarelo `#000`; amarelo-tinta p/ texto: `#7a6600`
- Foco/ciano: `#0abaee`
- Tipografia: **Archivo** (400–900) · mono: **IBM Plex Mono**
- Raio: 2/4/6px · Bordas: 1px padrão, 2px foco

## Arquivos de origem no projeto
- `Lure CRM Logo Kit.dc.html` — kit completo de variações (referência visual).
- `Lure CRM Logo Concepts.dc.html` — exploração de conceitos (histórico).
- `Lure CRM Design System.dc.html` — sistema visual do produto.
