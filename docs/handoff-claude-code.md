# Handoff para o Claude Code

Como sair daqui e continuar o projeto no Claude Code, com o repositório no GitHub.

---

## 1. Pré-requisitos

| Ferramenta | Para quê | Conferir |
|---|---|---|
| Node.js 18+ | Claude Code e o script de extração | `node --version` |
| Git | versionamento | `git --version` |
| GitHub CLI (`gh`) | criar e publicar o repo sem sair do terminal | `gh --version` |

Instalar o `gh`: https://cli.github.com

---

## 2. Instalar o Claude Code

```bash
npm install -g @anthropic-ai/claude-code
```

Instruções oficiais e alternativas de instalação:
https://code.claude.com/docs/en/quickstart

Primeira execução autentica a conta:

```bash
claude
```

---

## 3. Montar a pasta do projeto

Crie a pasta e jogue dentro os arquivos que já temos:

```
lure-capital/
├── CLAUDE.md
├── .env.example
├── .gitignore
├── .claude/
│   └── settings.json
├── db/
│   └── 001_schema.sql
├── docs/
│   ├── handoff-claude-code.md      ← este arquivo
│   ├── primeiro-prompt.md
│   └── fluxo-de-trabalho.md
├── scripts/
│   ├── bootstrap.sh
│   └── extrair-bubble.mjs
└── specs/
    ├── 00-visao-geral.md
    ├── 01-estado-atual-bubble.md
    ├── 02-modelo-de-dados.md
    ├── 03-acessos.md
    ├── 04-fases.md
    ├── 05-migracao.md
    ├── 06-decisoes-pendentes.md
    ├── 07-divida-herdada.md
    └── bubble/
        └── documentacao-completa.md   ← o arquivo do Claude in Chrome
```

Renomeie `lurecapital_documentacao_completa.md` para
`specs/bubble/documentacao-completa.md`. É a fonte de verdade do comportamento atual
e o Claude Code vai consultá-la o tempo todo.

---

## 4. Publicar no GitHub

```bash
cd lure-capital
bash scripts/bootstrap.sh
```

O script inicializa o git, faz o primeiro commit e cria o repositório privado no
GitHub via `gh`. Se preferir fazer na mão:

```bash
git init -b main
git add .
git commit -m "chore: documentação de migração e esquema inicial"
gh repo create lure-capital --private --source=. --push
```

Dê acesso ao Fábio:

```bash
gh repo add-collaborator <usuario-do-fabio> --permission push
```

---

## 5. Primeira sessão

```bash
cd lure-capital
claude
```

Na primeira abertura o Claude Code mostra o **diálogo de confiança da pasta**.
Ele lista as regras de permissão que o `.claude/settings.json` do projeto concede.
As regras `allow` do projeto só valem depois que você aceita.

Depois disso, cole o conteúdo de `docs/primeiro-prompt.md`.

---

## 6. Acesso a sites

O `.claude/settings.json` já libera:

- `WebFetch` (forma sem domínio) — o Claude busca páginas sem pedir aprovação a cada vez
- `WebSearch` — busca na web

A forma `WebFetch` sem domínio libera a ferramenta de busca, mas **não** abre a lista
de domínios do sandbox para comandos de shell. Se você quiser que um `curl` dentro do
Bash também alcance qualquer host, a forma é `WebFetch(domain:*)` — mais permissiva,
e só vale a pena se aparecer necessidade concreta.

Documentação: https://code.claude.com/docs/en/permissions

---

## 7. Modos de permissão

O padrão é **Manual**: pergunta na primeira vez que usa cada ferramenta.
Para trocar, `defaultMode` no settings, ou `/permissions` na sessão.

| Modo | Quando usar |
|---|---|
| `default` (Manual) | começo do projeto, enquanto você calibra a confiança |
| `plan` | quando quiser que ele investigue e proponha sem tocar em arquivo |
| `acceptEdits` | quando estiver numa fase mecânica e repetitiva |
| `auto` | aprovação automática com verificação de segurança em segundo plano |

Não use `bypassPermissions` fora de container isolado.

---

## 8. Conectar Supabase e Vercel

Isso o Claude Code faz na Fase 0, mas as contas são suas:

```bash
npx supabase login
npx supabase link --project-ref <ref-do-projeto>
npx vercel login
npx vercel link
```

Depois copie `.env.example` para `.env` e preencha. O `.env` está no `.gitignore`,
e o `settings.json` tem uma regra `deny` para leitura dele — o Claude Code não vai
abrir esse arquivo.

---

## 9. O que fazer antes da Fase 0

Três coisas que dependem de você e do Fábio, não do Claude Code:

1. **Fechar as exposições do Bubble** — `specs/07-divida-herdada.md`, tabela do topo.
2. **Responder as decisões** — `specs/06-decisoes-pendentes.md`. As três primeiras
   bastam para começar.
3. **Rodar a extração** — expor os data types que faltam, preencher o `.env`,
   `node scripts/extrair-bubble.mjs`, e commitar `dados/bruto/` **fora** do git
   (já está no `.gitignore`: contém dado de cliente).
