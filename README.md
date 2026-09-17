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
.claude/settings.json   permissões do Claude Code neste projeto
db/                     esquema e migrations
docs/                   handoff, fluxo, segurança
scripts/                bootstrap do repo, extração do Bubble
specs/                  especificação por assunto — a fonte de verdade
specs/bubble/           mapeamento do app atual
```

## Estado

Fase 0 (fundação) ainda não começou. Ver `specs/LEIA-ME.md` para o que falta entrar
no repositório.
