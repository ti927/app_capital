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

1. **RLS está LIGADA desde 02/10/2026** (`db/009_rls.sql`). A `anon key` não
   lê nem grava nada; o indicante só alcança os clientes e cartões dele. Toda
   tabela nova nasce com RLS e policy na mesma migration — tabela sem policy
   fica ilegível para quem está logado e quebra a tela. Ver `docs/seguranca.md`.
2. **`service_role` nunca sai do servidor.** Não existe `NEXT_PUBLIC_` em chave de
   servidor, não existe service role em componente client.
3. **Trigger de log em `evento`**, com `UPDATE` e `DELETE` revogados na tabela.
4. **`npm run verify` (typecheck + lint + teste) passa antes de todo commit.**
5. **QA proporcional à mudança, e as capturas se olham.** (decidido em 15/10/2026:
   o QA completo atrasava cada entrega em 5–7 min.)
   - **Mudança pequena** (campo, ordem, texto, um botão, correção pontual):
     `npm run verify` + `npm run qa` só no claro (~1,5 min), e abrir as capturas
     da tela mexida.
   - **Mudança grande de tela** (layout novo, tela nova, tema, celular):
     `npm run qa:tudo` — as três formas (claro, `--escuro`, `--celular`).
   - Teste novo no QA só para o que a captura não mostra, e sem gravar dado real
     quando der para evitar.
   Espere pelo conteúdo, nunca pela classe crua: o esqueleto de carregamento
   usa as mesmas classes de propósito, e um passo já deu "ok" fotografando tela
   em branco (`docs/aprendizados.md`, seção 1). Passar não basta — **abra as
   imagens**: os bugs que importam (diálogo fora da janela, botão coberto, ação
   desabilitada sem explicação) passam em teste e aparecem na captura.
6. **Vertical slice**: migration → RLS → API → tela → teste. Nunca todas as
   migrations primeiro e as telas depois.
7. **Segredo não entra no repositório nem no chat.** Vai para `.env` e se cita pelo
   nome da variável. `.env.example` lista os nomes, nunca os valores.
8. **Decisão tomada vira arquivo em `specs/`.** Sessão não persiste; `specs/` persiste.
9. **Regra de negócio não se inventa.** Se a spec não diz e o Bubble não deixa claro,
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
| `db/001` … `002` | fundação e as 24 tabelas de domínio — **aplicadas** |
| `db/004` … `008` | correções, tarefas do funil, esteira, `cliente.criado_por` — **aplicadas** |
| `db/009_rls.sql` | policies — **aplicada em 02/10/2026**; substitui a `003`, que não se aplica |
| `db/010_google_agenda.sql` | tokens do Google Agenda e colunas do evento na tarefa — **aplicada** |
| `design/` | marca, tokens e o brief para o Claude Design |
| `docs/estado-do-projeto.md` | **onde o app está hoje** — leia primeiro |
| `docs/aprendizados.md` | o que as rodadas ensinaram, e o que mudou por causa disso |
| `docs/notas-de-versao.md` | patch notes por rodada, para a equipe |
| `docs/otimizacao-de-carregamento.md` | de onde vem o tempo de tela, como medir, e o que já foi medido e **descartado** — leia antes de otimizar |
| `docs/` | handoff, fluxo de trabalho, primeiro prompt, segurança |
| `specs/08-melhorias-qol.md` · `09-ordem-de-merge.md` | a rodada de QOL e o protocolo de trabalho em paralelo |
| `specs/10-sincronizacao-bubble.md` | botão de sincronizar com o Bubble: o que traz, quem vê, limitações |
| `scripts/` | bootstrap do repo e extração do Bubble |

## Economia de contexto

A documentação do Bubble tem ~2.500 linhas: **consulte a seção do módulo que está
sendo implementado, nunca o arquivo inteiro.** Não peça leitura do repositório
inteiro — aponte o arquivo.
