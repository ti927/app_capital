Estado vazio: símbolo da marca, título, a contagem do que o filtro esconde e um botão de saída.

**Vazio silencioso lê-se como "não existe".** Por isso o componente exige um caminho de volta: ou a
contagem do que o filtro escondeu com "Limpar filtros", ou a ação que cria o primeiro registro.

## O que o consumidor fornece
`title` (o que não foi encontrado, na linguagem da tela), `hiddenCount` (quantos itens o filtro
esconde), `onClear` e `clearLabel`. Saber se a lista está vazia por filtro ou por falta de dados é
do consumidor — e é essa distinção que muda o texto.

## Regras
- Dois textos diferentes: **"nada encontrado com este filtro"** leva "Limpar filtros";
  **"nada cadastrado ainda"** leva a ação de criar.
- O símbolo entra em `tone="mono"` com opacidade reduzida — é marca d'água, não logotipo.
- `onClear={false}` remove o botão. Use só quando a tela não tem nem filtro nem criação.
- Dois vazios do original que **devem continuar somindo em vez de mostrar estado vazio**: a lista
  de e-mails do cliente e o bloco "Arquivados " quando a contagem é zero. Estado vazio é para a
  lista principal.
