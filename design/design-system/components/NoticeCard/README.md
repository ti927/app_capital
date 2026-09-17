Cartão de aviso em dois tons: falha de carregamento e falta de permissão.

- **`danger`**: fundo `danger-bg`, borda `danger`, texto `danger-ink`, `role="alert"`. Para erro de
  carregamento ou de gravação, sempre com "Tentar de novo".
- **`neutral`**: fundo `surface-sunken`, texto `text-secondary`. Para sem permissão.

## O que o consumidor fornece
`title`, `body`, `actionLabel` e `onAction`. Distinguir erro de falta de permissão — e saber o que
tentar de novo — é do consumidor.

## Regras
- O texto de erro diz **o que falhou e o que não mudou**: "A consulta falhou. Nada foi alterado."
  Nunca um código de erro cru para quem usa.
- O cartão de sem permissão diz **qual é o papel do usuário e quem libera**. Sem isso a pessoa fica
  sem próximo passo.
- Não use este cartão para validação de campo — isso é `Field error`, junto do campo.
- Um aviso por tela. Vários cartões empilhados viram ruído: agrupe numa mensagem só.
