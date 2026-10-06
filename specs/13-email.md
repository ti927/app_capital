# 13 · E-mail de status da operação (Resend)

Decidido em 05/10/2026. Reproduz o "Enviar Email" do Bubble
(`specs/bubble/documentacao-completa.md:1993`, `:2028`, `:2210–2263`).

## Na tela

Diálogo de operação → rodapé → **Enviar Email** (só quando a operação tem
cliente; a tela de operações já é só de master, e a ação confere de novo).
Abre o diálogo **Envio de Email**:

- **Destinatários**: os e-mails do cliente (`cliente.email` +
  `cliente_email`), um por caixa de marcar. Com um só, já vem marcado.
- **Destinatário adicional**: um e-mail qualquer.
- **Dados a serem incluídos**: Observação · Fundos · Fundos (Resumido).
- **Email**: o texto, escrito na hora.

## O envio

| | Bubble | Aqui |
|---|---|---|
| Assunto | "Status atual de suas operações." | igual |
| Remetente | "Lure Capital" | `EMAIL_REMETENTE` (domínio verificado no Resend) |
| Para os e-mails do cliente | cópia oculta fixa para o Maicon | igual — `EMAIL_COPIA_OCULTA` |
| Para o destinatário adicional | envio separado, resposta vai para o Maicon | igual |
| Observações e fundos | **imagens** PNG das tabelas (`obs`, `ops-table`, `ops-table2`) | **imagens** PNG, anexadas e mostradas no corpo |
| Etapas na imagem | sem "já cliente do fundo", "declinado pelo fundo", "declinado pelo cliente" (`:1840`) | igual |

Como no Bubble, vão **prints dos elementos da operação** (pedido de
05/10/2026): a lista de observações, a tabela "Lista de Fornecedores" — a
mesma que se vê no diálogo — e a versão dela em três colunas (a
`tbl.etapasEmail` do Bubble). Código em `src/lib/email/capturar.ts`
(biblioteca `html-to-image`) e `PrintsParaEmail` em `operacoes/dialogo.tsx`.

- **Marcar a caixa já mostra o print** como vai no e-mail ("Como vai no
  e-mail"), sem botão de prévia; o envio usa esses mesmos prints.
- **A tela não muda durante o print** (pedido de 05/10/2026, depois de a
  primeira versão piscar): fotografam-se cópias montadas fora da área
  visível, já claras (classe `.tema-claro`, gerada em `tokens.css`) e com
  **960px** de largura. Nada troca de tema nem de tamanho na página.
- Lápis e lixeira não entram.
- Cada imagem vai como anexo e aparece no corpo pelo `cid:`. Com "Fundos" e
  "Fundos (Resumido)" ligados juntos, vão as duas — como a maioria dos fluxos
  do Bubble. Elemento que não existe (operação sem observação ou sem fundo)
  não gera imagem.
- O servidor só aceita os três prints conhecidos, só PNG de verdade, até 4 MB
  cada.

Fundos (completa): fundo, tipo de operação, status, na mão de, alterado em.
Fundos (resumido): fundo, status, na mão de — o "Fundos3Colunas" do Bubble.

## Diálogo de operação (ajustes de 05/10/2026)

- Ordem: … Pareceres · interruptores · **Observações → Declínios →
  Limites/fundos assinados → Lista de Fornecedores**.
- Status da tabela de fundos aparece por inteiro, quebrando linha (na tela e
  no print).
- O diálogo ficou com 1280px (era 1120px).

## Configuração

Servidor só (regra 2):

- `RESEND_API_KEY` — chave de **envio** do Resend.
- `EMAIL_REMETENTE` — ex. `Lure Capital <capital@dominio-verificado>`; o
  domínio tem de estar verificado no Resend.
- `EMAIL_COPIA_OCULTA` — a cópia oculta fixa (na Vercel desde 05/10).

Sem chave ou sem remetente, o diálogo abre, avisa o que falta e não deixa
enviar.

## Código

- `src/lib/email/status-operacao.ts` — monta assunto, HTML e texto (puro, testado).
- `src/lib/email/capturar.ts` — tira os prints na tela (navegador).
- `src/lib/email/resend.ts` — POST na API do Resend.
- `src/app/(app)/operacoes/acoes.ts` — `emailsDaOperacao`, `enviarEmailDeStatus`.
- `src/app/(app)/operacoes/email.tsx` — o diálogo.
