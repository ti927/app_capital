Botão em cinco variantes e quatro alturas, com o anel de foco único do sistema.

## O que o consumidor fornece
`children` (o rótulo), `onClick`, `disabled`, `type` e qualquer outro atributo de `<button>` —
tudo é repassado. `variant` e `size` escolhem a aparência.

## Qual variante
| Variante | Fundo / tinta | Quando |
|---|---|---|
| `primary` | `accent` + `accent-on`, peso 700 | A ação principal da tela ou do diálogo. **Uma por contexto.** |
| `secondary` | `surface` com borda `border-strong`, peso 600 | Cancelar, ação de apoio, botão de toolbar. |
| `tertiary` | transparente, `text-secondary` | Ação discreta e ação dentro de linha de tabela. |
| `danger` | `brand-wine` cheio + `text-inverse` | Confirmação destrutiva no rodapé do diálogo de exclusão. |
| `dangerOutline` | contorno `danger-ink` | Ação destrutiva que ainda pede motivo ou confirmação. |

## Tamanhos
`sm` 28px (linha de filtro do cabeçalho de tabela) · `md` 34px (padrão) · `lg` 40px (login e telas
públicas) · `row` 24px quadrado, para as ações dentro de uma linha de tabela.

## Regras
- **Nunca texto branco sobre o amarelo:** branco sobre `accent` dá 1,35:1. O par certo é
  `accent-on` (preto), 15,6:1. Isso já vem embutido na variante `primary`.
- Botão de toolbar leva `flex: none` — a classe já garante. Sem isso ele encolhe quando a
  barra fica cheia e o rótulo quebra.
- Ação em ícone sem texto precisa de `aria-label` **e** `title`; o `title` é o que aparece no hover.
- A ordem no rodapé do diálogo é cancelar à esquerda, confirmar à direita.
- Um rótulo por estado: "Cadastrar" quando é novo, "Salvar" quando é edição — nunca os dois juntos.
