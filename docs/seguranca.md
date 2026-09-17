# Segurança — credenciais

## Regra

Segredo mora em `.env`. `.env` está no `.gitignore` e no `deny` de
`.claude/settings.json`. Em conversa, documento ou issue, cita-se o **nome da
variável**, nunca o valor.

`.env.example` existe para documentar os nomes. Não receba valor nenhum.

## Credenciais expostas em 17/09/2026 — rotacionar

Foram transmitidas por chat e por captura de tela. Tudo que trafega assim deve ser
tratado como público, mesmo em conversa privada: fica em histórico, em backup de
aplicativo e em cache de imagem.

| Credencial | Risco se vazada | Ação |
|---|---|---|
| Senha do Postgres | acesso total ao banco, ignora RLS | **trocar** — Dashboard > Settings > Database > Reset database password |
| `service_role` (JWT) | ignora RLS, lê e escreve tudo | **rotacionar** — Settings > API > Rotate. Invalida o JWT antigo |
| `anon` (JWT) | baixo: é feita para ir ao navegador, e a RLS é quem protege | rotacionar junto, já que sai no mesmo par |
| Chave da API do Bubble | acesso a todas as tabelas do app atual | **trocar** — Settings > API do app Bubble |

Ordem sugerida: rotacionar no painel → atualizar o `.env` local → conferir que nada
em produção depende da chave antiga.

Depois de rotacionar, apague as mensagens e a imagem que carregam esses valores.
Rotacionar sem apagar deixa a pista; apagar sem rotacionar não invalida nada.

## No dia a dia

- As regras `deny` de Bash em `.claude/settings.json` casam com o **texto** do
  comando; não são barreira de sistema. `Bash(curl *)` negado não impede
  `/usr/bin/curl`. Servem para evitar o caminho acidental, não um ataque.
- `dados/` está no `.gitignore`: a extração do Bubble contém dado de cliente.
- A chave do Bubble usada na migração deve ser revogada — não só rotacionada —
  depois do corte, quando o app antigo sair do ar.
