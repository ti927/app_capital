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

Para quem não é master, **não existe** ferramenta de excluir, nem de escrever
em operação e esteira.

`atualizar_cartao` **não sobrescreve** campo já preenchido, a menos que se
peça `sobrescrever: true`. `anotar_no_cartao` acrescenta ao histórico com data
e nome de quem anotou — nunca apaga o que havia.

## Acesso total do master — 13/10/2026

Decisão do usuário: "quem vai usar esse mcp vai ser apenas o maicon e ele, como
dono do app, vai ter acesso total, inclusive já podendo cadastrar pessoas". Uso:
o Claude de outra máquina puxa dados para relatórios e organiza arquivos.

Só para **master** (`src/lib/mcp/ferramentas-master.ts`; quem é indicante nem vê
essas ferramentas):

- `consultar` — lê qualquer tabela, com filtros, ordem, paginação (até 1000 por
  vez) e tabela ligada. Tudo menos `google_conexao` (tokens).
- `gravar` — cria ou altera registro em qualquer cadastro (lista em
  `regras-master.ts`). Fora: `perfil` (ferramentas próprias), `evento` (log),
  tabelas de apoio e `funil_quadro`. Tarefa gravada sincroniza o Google Agenda.
- `excluir` — apaga de vez. Exige `pessoa_confirmou: true` e a descrição manda o
  Claude mostrar o registro e esperar o "sim". Fica no log de `evento` (antes/depois).
- `listar_pessoas`, `cadastrar_pessoa`, `atualizar_pessoa` — dar acesso ao app.
  Cadastrar cria a conta no Auth (service_role, só no servidor) e o perfil com o
  token de quem pediu (RLS de master + log). O login é pelo Google com o mesmo
  e-mail. Ninguém tira o próprio acesso de master.

Tudo, menos criar a conta no Auth, roda com o token da pessoa: a RLS continua
valendo e o log registra quem fez.

## Read.ai pelo Claude — 13/10/2026

Sem webhook nem plano Pro: o Claude conecta os dois conectores (Read.ai e este
MCP). Ele lê a reunião pelo Read.ai e chama `registrar_reuniao` (para todos,
com RLS): acha o cartão pelo nome da empresa (ou cria), anota o resumo no
histórico com data e participantes, preenche `data_call` vazia e cria uma
tarefa de follow-up por próximo passo. Nome parecido em mais de um cartão:
devolve os candidatos em vez de adivinhar.

## Reuniões do Read.ai — a fazer

Decidido: **Read.ai Pro**, por **webhook** (`meeting_end`), autenticado pela
assinatura `X-Read-Signature` (HMAC com a chave de assinatura do webhook;
só webhooks criados depois de 17/03/2026). Regras de negócio em
`specs/11-google-agenda.md`, seção "Depois: Read.ai". Fica para quando a Lure
assinar o Pro.
