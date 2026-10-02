# 11 · Google Agenda — tarefa de reunião vira evento

Decidido em 02/10/2026. Primeira metade de uma integração maior: o evento com
Meet é o que faz o Read.ai entrar na reunião. A segunda metade — o webhook do
Read.ai que, ao fim da reunião, atualiza o cartão ou sugere um cartão novo para
revisão — está registrada no fim deste arquivo e **ainda não foi feita**.

---

## Conectar a agenda

- O login continua só com o Google, sem escopo extra (`specs/04-fases.md`).
- A permissão de agenda é pedida à parte, em **Conta → Agenda**
  (`/conta/agenda`), pelo botão "Conectar Google Agenda". Ele refaz o OAuth
  com o escopo `https://www.googleapis.com/auth/calendar.events`,
  `access_type=offline` e `prompt=consent`, voltando em
  `/auth/retorno?agenda=1`.
- Na volta, o `exchangeCodeForSession` entrega `provider_refresh_token` uma
  única vez. O retorno grava em `google_conexao`, cifrado.
- "Desconectar" revoga o token no Google e apaga a linha.

### Onde fica o token

`public.google_conexao` (migration `010`):

- `revoke all` para `anon` e `authenticated` — vale com a RLS desligada, que é
  o estado do projeto (`CLAUDE.md`, regra 1). RLS ligada na tabela, sem
  policy, como segunda trava.
- O refresh token vai cifrado com AES-256-GCM, chave `GOOGLE_TOKEN_CHAVE`
  (32 bytes em base64, só no servidor).
- Só o servidor lê, com a `service_role` (`src/lib/supabase/admin.ts`).
- **Sem trigger de log**: o log copia a linha para `evento`, e token não vai
  para lá.

## Tarefa → evento

Uma tarefa tem evento quando, **ao mesmo tempo**:

1. o tipo é `reuniao`;
2. tem prazo **e** hora;
3. tem responsável, e o responsável conectou a agenda.

O evento vai para a agenda principal do responsável:

- título da tarefa; descrição da tarefa + nome do cartão + link para o funil;
- início em `prazo + hora`, **1 hora** de duração, fuso `America/Sao_Paulo`;
- **com Google Meet** (`conferenceData.createRequest`).

| Na tarefa | No evento |
|---|---|
| criar, já atendendo às três condições | cria |
| editar título, descrição, data, hora, convidado | atualiza |
| trocar o responsável | apaga na agenda antiga, cria na nova |
| deixar de atender a uma das condições | apaga |
| excluir | apaga |
| concluir ou reabrir | nada |

`funil_tarefa` guarda `google_evento_id`, `google_agenda_de` (o perfil em cuja
agenda o evento está) e `meet_link`.

### Convidar o contato do cliente

No diálogo da tarefa de reunião há um interruptor **"Convidar o contato do
cliente"** e o campo de e-mail. O e-mail vem preenchido com o do cliente
quando o cartão já virou cliente (`funil_cartao.cliente_id → cliente.email`);
senão, digita-se. Ligado, o e-mail entra como convidado e o Google manda o
convite (`sendUpdates=all`). Desligado, ninguém é convidado e o Google não
manda e-mail nenhum.

Colunas: `convidar_contato boolean`, `email_convidado text`.

## Falhas

- A agenda **nunca impede salvar a tarefa**. A tarefa grava; se o Google
  falhar, a ação devolve um aviso e o diálogo mostra "Salva, mas não foi para
  a agenda: …".
- `invalid_grant` (o usuário revogou o acesso no Google) marca a conexão como
  caída (`caiu_em`), e a tela de Agenda pede para reconectar.
- Responsável sem agenda conectada não é erro: o diálogo informa e segue.

## Configuração

Variáveis de servidor (na Vercel desde 02/10/2026, produção e development):
`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_TOKEN_CHAVE`; mais a
`SUPABASE_SERVICE_ROLE_KEY`, que já existia. A **Google Calendar API** precisa
estar ativada no projeto do Google Cloud.

---

## Depois: Read.ai (não implementado)

Decisões já tomadas:

- **Automático**: webhook `meeting_end` do Read.ai → rota do app → Claude pela
  API extrai os dados → grava. Sem MCP, sem pessoa no meio.
- **Reunião ligada a um cartão** (tarefa do funil, ou participante que já é de
  um cartão): aplica direto — resumo no `historico`, tarefa da reunião
  concluída, `data_call`, itens de ação viram tarefas. Não sobrescreve campo
  já preenchido.
- **Reunião com externo sem cartão** (e-mail fora de `@lureconsultoria.com.br`):
  vira sugestão numa fila "a revisar"; só entra no funil com aprovação.
- Reunião só com gente da Lure: ignorada.

A confirmar na implementação: se o payload do Read.ai traz o link do Meet ou o
id do evento (para casar com a tarefa), e como o webhook é assinado.
