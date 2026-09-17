# Primeiro prompt

Cole no Claude Code na primeira sessão, depois de aceitar o diálogo de confiança.

---

```
Você vai tocar a migração de um app Bubble para código. Leia antes de agir:

1. CLAUDE.md — stack, glossário e as regras não negociáveis
2. specs/00-visao-geral.md até specs/07-divida-herdada.md — na ordem
3. db/001_schema.sql — o esquema alvo, ainda em rascunho
4. specs/bubble/documentacao-completa.md — o mapeamento do app atual (2.500 linhas).
   Não leia inteiro agora. Consulte a seção que interessar quando estiver
   implementando o módulo correspondente.

Contexto: o Bubble é a fonte do comportamento esperado, não do desenho.
A estrutura das telas e o fluxo de processo se mantêm reconhecíveis para quem usa
hoje; o banco e a lógica são refeitos. specs/07-divida-herdada.md lista o que NÃO
reproduzir.

Não escreva código ainda. Sua primeira entrega é um plano da Fase 0 (fundação),
conforme specs/04-fases.md:

- Estrutura de pastas do Next.js App Router
- Configuração de TypeScript, Tailwind, shadcn/ui, Drizzle
- Cliente Supabase (servidor e navegador) e o fluxo de sessão
- A migration inicial a partir de db/001_schema.sql, com RLS ligada em toda tabela
- A trigger de log em `evento`, com UPDATE e DELETE revogados
- Um comando único de verificação: `npm run verify` (typecheck + lint + teste)
- Seeds mínimos: os quatro níveis de acesso e os recursos da tela de configuração

Aponte o que estiver ambíguo em vez de decidir sozinho. specs/06-decisoes-pendentes.md
lista o que ainda está aberto — se o plano depender de algo de lá, pare e pergunte.

Trabalhe em vertical slice: migration → RLS → API → tela → teste. Nada de fazer
todas as migrations primeiro e as telas depois.

Quando eu aprovar o plano, comece. Um commit por passo lógico, mensagens em
português no formato convencional (feat:, fix:, chore:, docs:).
```

---

## Prompts das fases seguintes

Mesma forma, trocando o alvo. Exemplo para a Fase 2:

```
Fase 2 — Cadastros, módulo de clientes.

Leia specs/04-fases.md (Fase 2), specs/02-modelo-de-dados.md e, na documentação do
Bubble, a "FASE 3 — Parte 3: página `clientes`" (árvore de elementos e os 22 workflows).

Reproduza o comportamento útil: lista filtrada por carteira, cadastro e edição no
mesmo diálogo alternado por "nome preenchido", e-mails de contato, arquivar, excluir.

Não reproduza: o `Do a search for` com `:filtered` no navegador (vira filtro em SQL),
o pop-up duplicado que existe também em funilclientes (vira um componente), e o ID de
usuário cravado em código.

Vertical slice completa, com teste. Pergunte antes de inventar regra de negócio.
```
