# 12 · MCP do sistema e reuniões do Read.ai

Decidido em 02/10/2026.

## MCP remoto — `/api/mcp`

O Claude (claude.ai, Desktop, Code) conecta no app como **conector remoto** e
lê e escreve no app **como a pessoa que conectou**.

### Login

- Supabase **OAuth 2.1 Server** ligado, com registro dinâmico de cliente
  (Authentication → OAuth Server). Caminho de autorização: `/oauth/consent`.
- O MCP anuncia o servidor de autorização em
  `/.well-known/oauth-protected-resource` (RFC 9728). O claude.ai descobre,
  registra-se sozinho e manda a pessoa para `/oauth/consent`.
- `/oauth/consent` só aprova cliente cujo `redirect_uri` é de
  `claude.ai`, `claude.com` ou `localhost` (Claude Code / Desktop). Qualquer
  outro é recusado sem botão de aprovar — é a defesa contra o risco que o
  registro dinâmico abre (app falso com nome convincente).
- O token que o Claude recebe é um token do Supabase **daquela pessoa**. O
  MCP consulta o banco com ele, então a **RLS (db/009) faz o recorte**: o
  indicante pelo Claude vê o mesmo que pelo app.

### Ferramentas

Leitura: `quem_sou_eu`, `buscar_clientes`, `detalhar_cliente`,
`listar_funil`, `detalhar_cartao`, `listar_tarefas`; para master,
`buscar_operacoes` e `buscar_fornecedores` (as telas desses são de master).

Escrita: `criar_cartao`, `atualizar_cartao`, `anotar_no_cartao`,
`mover_cartao`, `criar_tarefa` (reunião vai para o Google Agenda pelo mesmo
caminho do app — specs/11), `concluir_tarefa`, `transformar_em_cliente`.

**Não existe** ferramenta de excluir, nem de escrever em operação e esteira.
Excluir continua só pelo app, com uma pessoa clicando.

`atualizar_cartao` **não sobrescreve** campo já preenchido, a menos que se
peça `sobrescrever: true`. `anotar_no_cartao` acrescenta ao histórico com data
e nome de quem anotou — nunca apaga o que havia.

## Reuniões do Read.ai — a fazer

Decidido: **Read.ai Pro**, por **webhook** (`meeting_end`), autenticado pela
assinatura `X-Read-Signature` (HMAC com a chave de assinatura do webhook;
só webhooks criados depois de 17/03/2026). Regras de negócio em
`specs/11-google-agenda.md`, seção "Depois: Read.ai". Fica para quando a Lure
assinar o Pro.
