Diálogo modal em três larguras, com cabeçalho de contexto, corpo e rodapé de ações de 56px.

Overlay `rgba(0,0,0,.45)`, cartão em `surface` com `radius-lg` e `shadow-overlay`. O cabeçalho traz
uma linha de contexto em mono 11px caixa alta (`text-muted`) acima do título de 22px/800. O rodapé
tem 56px e alinha as ações à direita.

## O que o consumidor fornece
`title`, `context`, `width`, `footer` (os botões) e o conteúdo em `children`. **Abertura,
fechamento por Esc, clique no overlay, foco preso e devolução do foco são do consumidor** — este
componente só desenha.

## Largura
| Token | Quando |
|---|---|
| `sm` 620px | Formulário simples: troca de senha, adicionar e-mail, exclusão, lançar gasto. |
| `md` 880px | Duas colunas: cliente, fornecedor, usuário. |
| `lg` 1120px | Abas e tabela embutida: operação, esteira. |

## Todos os campos, sempre, na mesma forma
É a regra que vale para **todos** os diálogos do produto:

- **Nenhum campo esconde por estar vazio** e nenhum vira "avançado" atrás de um recolhível. As
  únicas ausências legítimas são as do original: a lista de e-mails do cliente some quando vazia,
  os blocos condicionados pelo instrumento na esteira só aparecem com o instrumento escolhido, e
  "Escolher cliente:" só aparece em operação nova.
- **A ordem dos campos não muda** entre criar e editar. O que muda é só o rótulo do botão.
- **A mesma anatomia em todos:** faixa superior com o X à direita · corpo em grade de duas colunas
  com gap `space-5`, rótulo `field-label` acima do campo de `control-h-md` · campo multilinha ou
  lista longa ocupando as duas colunas · régua de 1px entre blocos de assunto · rodapé com a
  confirmação.
- **Campo calculado é `Field calc`**, não um campo vazio: "Instituição Líder:" na esteira e
  "Data inicial" / "Última atualização" no cartão do funil.
- **Campo de valor em texto livre continua texto livre** — faturamento, margem, ativos, passivo,
  demanda, estimativa e volume. Sem máscara, sem alinhamento à direita.

O inventário campo a campo de cada diálogo está na seção **Diálogos** deste sistema.

## Regras
- **Um rótulo por estado no botão de confirmação**: "Cadastrar" quando é novo, "Salvar" quando é
  edição — nunca os dois, e a cor acompanha.
- Cancelar à esquerda, confirmar à direita. A ação destrutiva usa `Button variant="danger"`.
- Diálogo de exclusão diz o nome do registro e que a ação é permanente, com o nome em negrito.
- Corpo em grade de 2 colunas com gap `space-5`; um campo multilinha ocupa as duas colunas.
- Nada de rolagem dupla: se o corpo passar da altura da janela, só ele rola — cabeçalho e rodapé
  ficam fixos.
