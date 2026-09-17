# Arquitetura

Como o app_capital está montado, e por quê. Estado em 17/09/2026.

---

## O que é

Reconstrução do app Bubble `planilha-lurecapital`, que a Lure Capital usa para
estruturar operações de crédito. O Bubble continua em produção; este repositório
é o substituto.

**Hierarquia:** Cliente → Operação → Etapa (uma por fundo) → Checklist de
documentos. Uma operação corre em vários fundos ao mesmo tempo, e comparar esses
fundos lado a lado é o valor da ferramenta.

---

## As camadas

```
navegador ── Next.js (App Router) ── Supabase (Postgres 17)
                    │                        │
              server actions            28 tabelas
              e server components       auditoria em evento
                                             │
                                        mcp/servidor.mjs
                                        (só leitura, para agente)
```

### Aplicação — `src/`

Next.js 15 com App Router e TypeScript. Sem Tailwind e sem shadcn/ui, ao
contrário do que o `docs/handoff-claude-code.md` previa: o design system da Lure
traz os próprios doze componentes, e somar outra biblioteca criaria dois sistemas
concorrentes disputando as mesmas classes.

Cada tela segue o mesmo desenho de quatro arquivos:

| Arquivo | Papel |
|---|---|
| `page.tsx` | server component; busca os dados e aplica o recorte por nível |
| `tela.tsx` | client component; lista, busca, estado da interface |
| `dialogo.tsx` | o formulário de criar e editar |
| `acoes.ts` | server actions; é o único lugar que escreve no banco |

Quem for construir a sexta tela copia `src/app/(app)/clientes/`.

### Estilo — três arquivos, nesta ordem

| Arquivo | Origem | Pode editar? |
|---|---|---|
| `src/app/tokens.css` | **gerado** de `design/design-system/tokens.json` | não — edite o JSON e rode `npm run tokens` |
| `src/app/design-system.css` | **cópia** de `design/design-system/components/bundle.css` | não — é regravado por `npm run tokens` |
| `src/app/interface.css` | escrito à mão | sim |

`interface.css` carrega por último e é onde mora tudo que corrige ou estende o
design system — inclusive as três lacunas do `bundle.css`, que foi escrito para
páginas de preview e não trazia `position: fixed` no overlay, nem os
modificadores de largura do diálogo, nem `display: flex` no cabeçalho dele.

### Banco — `db/`

Postgres 17 no Supabase. As migrations rodam com
`node scripts/aplicar-migration.mjs <arquivo>`, cada uma na sua transação.

| Arquivo | Estado |
|---|---|
| `001_fundacao.sql` | aplicado — tipos, `perfil`, `acesso_pagina`, `evento` e a trigger de auditoria |
| `002_dominio.sql` | aplicado — as tabelas de domínio e os seeds dos option sets |
| `003_rls.sql` | **não aplicado** — ver "O que falta" |
| `004_status_operacao.sql` | aplicado — correção: `Status Atual da Operação` é um conjunto próprio |
| `005_log_evento_chave_composta.sql` | aplicado — correção: a trigger quebrava em tabela de chave composta |

**O host direto não resolve neste projeto.** `db.<ref>.supabase.co` não tem
IPv4; a conexão é pelo pooler em `sa-east-1`. Porta 6543 para a aplicação
(transaction mode), 5432 para migrations (session mode).

### Camada MCP — `mcp/`

Servidor MCP de só leitura que abre o banco como ferramentas para um agente.
Não é parte do aplicativo. Ver `mcp/README.md`.

---

## Autenticação

E-mail e senha, com as cinco contas migradas do Bubble. As senhas do Bubble
**não** foram migradas: o data type `user` guardava senha em texto puro num campo
comum, legível pela Data API — dois dos cinco tinham valor lá. Cada conta recebeu
senha provisória aleatória, em `dados/credenciais-provisorias.txt`, fora do git.

O Google já está encaminhado: `signInWithOAuth` está ao lado do
`signInWithPassword` na mesma tela e a rota `/auth/retorno` existe. Os cinco
e-mails são Gmail ou do domínio `lureconsultoria.com.br`, e todas as contas foram
criadas com `email_confirm` — então ligar o provedor no painel do Supabase faz o
login cair nessas mesmas contas, pelo e-mail. Nenhum vínculo se perde.

## Níveis de acesso

| Nível | Vê |
|---|---|
| **master** | tudo |
| **indicante** | só Funil e Cliente, e dentro de Cliente só os vinculados a ele |

O recorte é feito **na consulta**, em `page.tsx`, porque a RLS está desligada.
Quando `003_rls.sql` rodar, o banco garante o mesmo recorte e as consultas
continuam válidas — não é trabalho jogado fora, é cinto e suspensório.

A tabela `acesso_pagina` existe e está **vazia**. No Bubble o painel tinha
seletores que gravavam em `tbl.config`, mas nada lia esse dado: o menu escondia
item apenas pelo nível da conta. O pop-up de Configurações mostra a verdade
efetiva e diz de onde ela vem, em vez de oferecer um controle que não controla.

---

## Qualidade

```bash
npm run verify   # typecheck + lint + teste
npm run qa       # percorre as telas e grava uma captura por passo
```

O `qa` roda também como `-- --escuro` e `-- --celular`. **Passar não basta: as
capturas se olham.** Três bugs reais saíram daí e nenhum quebraria um teste —
um botão coberto pela assinatura no celular, uma ação desabilitada sem
explicação, e uma constante exportada de um arquivo `'use server'` que chegava
`undefined` no navegador.

---

## O que falta

**A RLS.** É o único item que bloqueia a publicação. `db/003_rls.sql` está
escrito e é um comando:

```bash
node scripts/aplicar-migration.mjs db/003_rls.sql
```

Enquanto roda só em `localhost` o risco é contido, porque a `anon key` não saiu
para a internet. **Ela sai no primeiro deploy da Vercel** — e o banco já tem
dado real: 94 clientes com CNPJ, faturamento e parecer. Sem RLS, qualquer pessoa
com essa chave lê e escreve as tabelas pela API REST, sem login.

**Rotacionar as credenciais.** Senha do Postgres, `service_role` e chave do
Bubble passaram por chat e por captura de tela. Ver `docs/seguranca.md`.

**Conferir o diálogo de Operação contra a tela do Bubble.** É o único que não
veio nas capturas de produção; foi construído a partir do documento de design.

**Decidir a Esteira.** De 388 etapas migradas, **uma** tem dado de esteira. É a
segunda tela mais cara do sistema. Ver `specs/04-fases.md`.
