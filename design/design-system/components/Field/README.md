Campo de formulário com rótulo, e os estados calculado, inválido, desabilitado e multilinha.

Rótulo em 12px/600 com 5px de folga; campo de `control-h-md` (34px), ou `control-h-lg` (40px) no
login e nas telas públicas. Grade de 2 colunas com gap `space-5`.

## O que o consumidor fornece
`label`, `placeholder`, `value`, `type`, `onChange` — o estado é do consumidor; este campo é
**não controlado** (`defaultValue`), então quem precisa de controle passa o seu próprio `<input>`
com as mesmas classes.

## Estados
- **Calculado** (`calc`): `readOnly`, fundo `surface-sunken`, rótulo em `text-muted` com o sufixo
  "(calc.)". É o que distingue um valor derivado de um campo editável vazio.
- **Inválido** (`error`): borda `danger`, mensagem em `danger-ink`, `aria-invalid="true"`. A
  mensagem diz o que fazer, não só que está errado.
- **Desabilitado**: `opacity-disabled`. Use quando o controle existe mas o papel não permite — o
  seletor de declínios para o nível indicante fica **desabilitado, não escondido**.
- **Multilinha** (`multiline`): parecer, observação, "Demais". Altura livre, padding 8/12.

## Regras
- **Faturamento, estimativa, margem, passivo, ativos, volume e demanda são texto livre**, não
  número: chegam como "R$ 2MM", "2.000.000", "dois milhões". Não alinhe à direita, não force
  máscara e não assuma casas decimais nesses campos.
- Valor numérico de verdade (data, moeda calculada, identificador) vai em `font-mono` com
  `font-variant-numeric: tabular-nums`.
- Datas em `dd/mm/aaaa`; moeda em `R$ 1.234,56`.
- O `placeholder` não substitui o rótulo — ele exemplifica o formato. Rótulo sempre visível.
- O anel de foco é o do sistema: `outline: 2px solid var(--focus-ring); outline-offset: 1px`.
