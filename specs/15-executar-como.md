# 15 · Executar como (testar o app como outra pessoa)

Decidido em 15/10/2026, pedido do usuário: a conta **Fabio TI** (master) entra
no app como qualquer outra pessoa ativa, para testar o login e o que ela vê.

- **Quem:** só a conta de `EXECUTAR_COMO_EMAIL` (variável de servidor, hoje
  `fabio.miranda@lureconsultoria.com.br`), master e ativa. Sem a variável,
  ninguém. As ações conferem isso no servidor a cada chamada.
- **Onde:** botão com ícone de pessoa ao lado do nome, na barra de cima; abre a
  lista das pessoas ativas.
- **Como:** a service_role gera um link mágico para a pessoa (`generateLink`,
  sem enviar e-mail) e o servidor troca a sessão na hora (`verifyOtp`). Um
  cookie `lc_executar_como`, httpOnly e assinado (HMAC com segredo derivado da
  service_role), guarda quem era a conta original por 8 horas.
- **Volta:** a faixa "Testando como Fulano · Voltar para minha conta". Só volta
  com selo válido e se a conta original ainda pode executar como; senão, sai de
  vez e pede login.
- **Atenção:** enquanto está como outra pessoa, tudo o que se grava fica no log
  de `evento` em nome dela. É para testar, não para trabalhar por ela.

Código: `src/lib/executar-como/` e `src/components/executar-como.tsx`.
