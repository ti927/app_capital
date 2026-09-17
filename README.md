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

Fase 0 (fundacao da aplicacao) ainda nao comecou. Banco e dados prontos:

| | |
|---|---|
| Esquema | 28 tabelas aplicadas |
| Dados | migrados do Bubble — 73 fornecedores, 94 clientes, 71 operacoes, 383 etapas, 18 cartoes |
| Acessos | 5 contas em auth.users, 5 perfis, 107 vinculos de "quem visualiza" |

Plano por fase, com escopo e estimativas: [specs/04-fases.md](specs/04-fases.md).

Fora do corte: a tela de respostas de pesquisa (`respforms1`), que tem zero
registros. Em aberto: a Esteira de Estruturacao, usada em 1 das 388 etapas.

**Risco aberto:** a RLS esta desligada e agora ha dado real de cliente no banco.
A `anon key` sai para a internet no primeiro deploy da Vercel — ligar a RLS antes
disso. Ver [docs/seguranca.md](docs/seguranca.md).
