# app_capital

Reconstrução do app Bubble `planilha-lurecapital` em Next.js e Supabase — o
sistema com que a Lure Capital estrutura operações de crédito.

O Bubble segue em produção. Este repositório é o substituto.

---

## Rodar

```bash
npm install
npm run dev          # http://localhost:3000
```

O `.env` já está preenchido. Entre com uma conta de
`dados/credenciais-provisorias.txt` — fora do git.

Como master você vê as cinco telas; como indicante, só Funil e Cliente, com a
lista de clientes filtrada pelos vínculos.

> **Um servidor por vez.** `npm run dev` e `npm run build` disputam a pasta
> `.next`. Se a página aparecer sem estilo nenhum, é quase certo que há dois
> processos na porta 3000 e o mais antigo perdeu os arquivos de build.

> **Produção está fora do ar** por falta de `NEXT_PUBLIC_SUPABASE_ANON_KEY` no
> projeto da Vercel. O que fazer está em `docs/estado-do-projeto.md`.

## Comandos

| | |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm run verify` | typecheck + lint + teste |
| `npm run qa` | percorre as telas e grava uma captura por passo em `qa/` |
| `npm run qa:tudo` | as três formas do QA em paralelo (~40s) |
| `node scripts/medir-navegacao.mjs` | mede a primeira visita a cada tela, contra um build de produção |
| `npm run tokens` | regera `tokens.css` e `design-system.css` do design system |
| `npm run migration <arquivo>` | aplica uma migration |
| `npm run extrair` / `npm run carregar` | extrai do Bubble e carrega no Supabase |
| `npm run mcp` | sobe o servidor MCP por fora |

`npm run qa` aceita `-- --escuro` e `-- --celular`. **Passar não basta: as
capturas se olham** — é a regra 5 do `CLAUDE.md`, e ela nasceu de três bugs
reais que teste nenhum pegaria.

---

## Estado

| | |
|---|---|
| Banco | 28 tabelas aplicadas |
| Dados | migrados do Bubble — 94 clientes, 73 fundos, 71 operações, 383 etapas, 18 cartões |
| Acessos | 5 contas, 5 perfis, 107 vínculos de "quem visualiza" |
| Telas | as cinco de pé: Cliente, Fornecedor, Operação, Esteira, Funil |
| MCP | servidor de só leitura, 8 ferramentas |

**Falta a RLS, e ela bloqueia a publicação.** Ver abaixo.

---

## Leitura

| Arquivo | Para quê |
|---|---|
| [CLAUDE.md](CLAUDE.md) | stack e as nove regras não negociáveis |
| [docs/arquitetura.md](docs/arquitetura.md) | como está montado e por quê |
| [docs/seguranca.md](docs/seguranca.md) | credenciais, rotação e o risco aberto |
| [docs/fluxo-de-trabalho.md](docs/fluxo-de-trabalho.md) | ciclo por fase, commits, branches |
| [specs/04-fases.md](specs/04-fases.md) | plano, escopo e o que está em aberto |
| [specs/bubble/documentacao-completa.md](specs/bubble/documentacao-completa.md) | o app atual, tela a tela — 2.540 linhas |
| [design/design-system/](design/design-system/) | tokens, componentes e o arranjo das telas |
| [mcp/README.md](mcp/README.md) | a camada MCP |

## Estrutura

```
src/app/(app)/<tela>/   page.tsx · tela.tsx · dialogo.tsx · acoes.ts
src/components/ui/      os componentes do design system em React
src/lib/                domínio, perfil e os clientes Supabase
db/                     migrations
design/design-system/   tokens.json é a fonte da verdade do visual
docs/  specs/           documentação e especificação
scripts/                migration, extração, carga, tokens, QA
mcp/                    servidor MCP de só leitura
```

---

## Antes de publicar

**1. Ligar a RLS.** É um comando:

```bash
node scripts/aplicar-migration.mjs db/003_rls.sql
```

Enquanto roda em `localhost`, o risco é contido. **No primeiro deploy a
`anon key` sai para a internet**, e o banco já tem dado real de cliente — CNPJ,
faturamento, parecer. Sem RLS, quem tiver essa chave lê e escreve as tabelas
pela API REST, sem login. Depois de aplicar, rode `npm run qa` de novo: o
recorte passa a ser do banco e vale conferir que nada sumiu da tela.

**2. Rotacionar as credenciais.** Senha do Postgres, `service_role` e chave do
Bubble passaram por chat e por captura de tela. [docs/seguranca.md](docs/seguranca.md)
tem o procedimento.

**3. Variáveis na Vercel.** As mesmas do `.env`, menos `BUBBLE_API_KEY`, que a
aplicação não usa — é só da migração.
