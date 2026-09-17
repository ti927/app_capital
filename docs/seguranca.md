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

## RLS desligada — risco aberto desde 17/09/2026

Decisão do projeto: seguir sem RLS por enquanto, para não travar o
desenvolvimento. As policies estão escritas e versionadas em `db/003_rls.sql`;
aplicar é rodar o arquivo, não precisa mexer em tabela.

O que isso significa na prática, enquanto estiver assim: o Supabase publica toda
tabela sem RLS pela API REST, e a `anon key` que autentica essa API é embutida no
bundle do navegador — ou seja, é pública por construção. Com ela:

```
GET    /rest/v1/cliente            lista todos os clientes
POST   /rest/v1/operacao           cria operação
PATCH  /rest/v1/fornecedor?id=eq.X altera fornecedor
DELETE /rest/v1/cliente?id=eq.X    apaga cliente
```

sem login nenhum.

Enquanto o banco estiver vazio e a aplicação não estiver publicada, o risco é
teórico. Ele deixa de ser teórico em dois momentos, o que vier primeiro:

1. **a carga dos dados do Bubble** — aí passa a haver dado real de cliente;
2. **o primeiro deploy na Vercel** — aí a `anon key` sai para a internet.

Ligar a RLS antes de qualquer um dos dois.

Vale notar que é a mesma classe de problema que a documentação do Bubble
registrou como "Ponto crítico" em `fornecedor`, `operação` e `funiltarefa`
(seções 2.3, 2.4 e 2.7): a regra `everyone` permitia criar, modificar e apagar
via API sem login. A migração é a oportunidade de não levar isso adiante.
