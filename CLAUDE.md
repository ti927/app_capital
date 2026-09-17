# app_capital

Migração de um app Bubble para código. O Bubble é a fonte do **comportamento
esperado**, não do desenho: telas e fluxo de processo continuam reconhecíveis para
quem usa hoje; banco e lógica são refeitos.

## Stack

| Camada | Escolha |
|---|---|
| Framework | Next.js (App Router) + TypeScript |
| UI | Tailwind + shadcn/ui |
| Banco | Postgres no Supabase |
| Acesso a dados | Drizzle |
| Auth e autorização | Supabase Auth + RLS |
| Deploy | Vercel |

## Regras não negociáveis

1. **RLS está DESLIGADA** — decisão do projeto em 17/09/2026, para não travar o
   desenvolvimento. As policies estão escritas em `db/003_rls.sql`, prontas para
   aplicar. Enquanto não rodarem, toda tabela é legível e gravável pela API REST
   com a `anon key`, que sai no bundle do navegador. Isso precisa ser resolvido
   antes de qualquer dado real de cliente entrar. Ver `docs/seguranca.md`.
2. **`service_role` nunca sai do servidor.** Não existe `NEXT_PUBLIC_` em chave de
   servidor, não existe service role em componente client.
3. **Trigger de log em `evento`**, com `UPDATE` e `DELETE` revogados na tabela.
4. **`npm run verify` (typecheck + lint + teste) passa antes de todo commit.**
5. **Vertical slice**: migration → RLS → API → tela → teste. Nunca todas as
   migrations primeiro e as telas depois.
6. **Segredo não entra no repositório nem no chat.** Vai para `.env` e se cita pelo
   nome da variável. `.env.example` lista os nomes, nunca os valores.
7. **Decisão tomada vira arquivo em `specs/`.** Sessão não persiste; `specs/` persiste.
8. **Regra de negócio não se inventa.** Se a spec não diz e o Bubble não deixa claro,
   pare e pergunte.

## Commits

Português, formato convencional, um commit por passo lógico:

```
feat: cadastro de cliente com carteira
fix: filtro de fornecedor ignorava arquivados
chore: migration inicial do esquema
docs: decisão sobre o de-para de status
```

`main` sempre publicável. Uma branch por fase: `fase-0-fundacao`, `fase-1-acessos`.

## Onde está o quê

| Caminho | Conteúdo |
|---|---|
| `specs/bubble/documentacao-completa.md` | mapeamento do app atual (2.540 linhas) |
| `specs/bubble/fase1-inventario.md` | inventário de páginas, data types e plugins |
| `specs/00-` … `07-` | especificação por assunto — **ainda não escritas**, ver `specs/LEIA-ME.md` |
| `db/001_fundacao.sql` | tipos, perfil, acesso, evento — **aplicado** |
| `db/002_dominio.sql` | as 24 tabelas de domínio — **aplicado** |
| `db/003_rls.sql` | policies — **não aplicado**, por decisão |
| `design/` | marca, tokens e o brief para o Claude Design |
| `docs/` | handoff, fluxo de trabalho, primeiro prompt, segurança |
| `scripts/` | bootstrap do repo e extração do Bubble |

## Economia de contexto

A documentação do Bubble tem ~2.500 linhas: **consulte a seção do módulo que está
sendo implementado, nunca o arquivo inteiro.** Não peça leitura do repositório
inteiro — aponte o arquivo.
