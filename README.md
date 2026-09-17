# app_capital

Migração do app Bubble para Next.js + Supabase.

O Bubble é a fonte do comportamento esperado, não do desenho. Telas e fluxo de
processo continuam reconhecíveis para quem usa hoje; banco e lógica são refeitos.

## Começar

```bash
npm install
cp .env.example .env      # preencha; nunca commite o .env
npm run verify            # typecheck + lint + teste
```

## Leitura, na ordem

1. [CLAUDE.md](CLAUDE.md) — stack e regras não negociáveis
2. [docs/handoff-claude-code.md](docs/handoff-claude-code.md) — pré-requisitos e setup
3. [docs/fluxo-de-trabalho.md](docs/fluxo-de-trabalho.md) — ciclo por fase, commits, branches
4. [docs/seguranca.md](docs/seguranca.md) — credenciais e rotação
5. [docs/primeiro-prompt.md](docs/primeiro-prompt.md) — como abrir a primeira sessão

## Estrutura

```
.claude/settings.json   permissoes do Claude Code neste projeto
db/                     migrations
design/                 marca, tokens e o brief para o Claude Design
docs/                   handoff, fluxo, seguranca
scripts/                bootstrap, aplicar migration, extracao do Bubble
specs/bubble/           mapeamento do app atual (fonte de verdade do comportamento)
```

## Banco

Supabase, Postgres 17. As migrations em `db/` ja estao aplicadas:

| Arquivo | Estado |
|---|---|
| `001_fundacao.sql` | aplicado — tipos, `perfil`, `acesso_pagina`, `evento` + trigger de auditoria |
| `002_dominio.sql` | aplicado — 24 tabelas de dominio, seeds dos option sets |
| `003_rls.sql` | **nao aplicado** — policies prontas, por decisao do projeto |

Para aplicar um arquivo:

```bash
node scripts/aplicar-migration.mjs db/003_rls.sql
```

O host direto `db.<ref>.supabase.co` nao resolve neste projeto; a conexao e pelo
pooler (`aws-0-sa-east-1.pooler.supabase.com`). Ver `.env.example`.

## Estado

Fase 0 em andamento: banco criado, aplicacao ainda nao iniciada.

**Risco aberto:** a RLS esta desligada. Toda tabela e legivel e gravavel pela API
REST com a `anon key`, que sai no bundle do navegador. Ligar antes da carga dos
dados do Bubble ou do primeiro deploy — o que vier primeiro. Ver
[docs/seguranca.md](docs/seguranca.md).

As specs `00-` a `07-` ainda nao foram escritas; ver
[specs/LEIA-ME.md](specs/LEIA-ME.md).
