# 09 — Ordem de merge e divisão das frentes · 18/09/2026

Três sessões trabalhando em paralelo, uma por frente. Este arquivo é o
combinado entre elas: quem faz o quê, em que ordem entra em `main`, e o que
cada uma tem que ter na mão antes de pedir merge.

**A frente C coordena**: publica a matriz de propriedade, faz os merges na
ordem abaixo e roda o QA de integração. A e B entregam a branch pronta e
avisam; não fazem merge.

---

## Estado agora

| Branch | Worktree | Commits | O que toca |
|---|---|---|---|
| `qol-funil-tarefas` (A) | `Downloads/files` | 4 | `db/006`, `funil/**`, `clientes/**`, `tsconfig.json` |
| `qol-operacao-esteira` (B) | `Downloads/app-capital-B` | 5 | `db/007`, `operacoes/**`, `esteira/**`, `fornecedores/**` |
| `qol-polimento` (C) | `Downloads/app-capital-C` | 6 | `components/**`, CSS global, layouts, `loading.tsx`, `perfil.ts`, `scripts/**` |

`git diff --name-only main...<branch>` nas três: **nenhum arquivo aparece em
duas branches**. O merge não vai ter conflito de texto. O que existe é
conflito de *comportamento*, na tabela mais abaixo.

---

## Definição de pronto (antes de pedir merge)

1. `npm run verify` passa.
2. `npm run qa` nas três formas (padrão, `-- --escuro`, `-- --celular`) e as
   **capturas foram abertas**. Passar não basta — regra 5 do CLAUDE.md.
3. A migration da frente já foi aplicada no Supabase. O banco é **um só**, e é
   o de produção: código que espera coluna nova quebra em `main` se a migration
   não subiu antes.
4. Avisar a frente C por mensagem, com o hash do último commit.

---

## Ordem exata

```
1º  qol-operacao-esteira   (B)
2º  qol-funil-tarefas      (A)
3º  qol-polimento          (C)
```

Como não há sobreposição de arquivo, a ordem não é sobre conflito: é sobre
quem limpa a sujeira. **C entra por último** porque mexe no que todas as telas
usam — seletor, diálogo, esqueleto, animação. Entrando depois, o QA de
integração já exercita as telas novas de A e de B com os componentes novos, e
quem conserta o que aparecer é a dona dos componentes.

Entre A e B a ordem é indiferente; B primeiro só porque terminou antes.

Os merges rodam da estação de merge, um worktree só para isso:

```bash
cd C:/Users/fabio/Downloads/app-capital-main     # worktree em main

git merge --no-ff qol-operacao-esteira
npm run verify

git merge --no-ff qol-funil-tarefas
npm run verify

git merge --no-ff qol-polimento
npm run verify
```

`--no-ff` de propósito: cada frente vira um bloco legível no histórico.

Se `npm run verify` falhar depois de um merge, **para aí**: o conserto é da
frente dona do arquivo que quebrou, não da estação de merge.

---

## Riscos de comportamento, e quem resolve

| O que muda | Quem sente | Quem conserta | Quando |
|---|---|---|---|
| O seletor deixa de abrir pop-up e vira menu ancorado | telas de A e de B | C | depois do merge de C |
| Passo de QA que conta `.lc-overlay` para conferir seletor | `scripts/qa.mjs` | C | idem |
| `Dialogo` desmonta 140ms depois de fechar | passo que confere sumiço imediato | C | idem |
| Funil ganhou abas (A); `funil/loading.tsx` (C) não tem a fita | esqueleto pula na troca | C | depois do merge de A |
| Matriz de tipos virou tags (B) | nada: o esqueleto de fornecedores só aparece na aba padrão, que é a tabela de fundos | — | — |
| Rodapé do diálogo de operação com dois filhos (B) | resolvido no `operacao.css` com `margin-right: auto`; `.interruptor` já é `nowrap`, então não vaza na vertical — o aperto é **horizontal** em 390px | B | olhar a captura `--celular` |
| `tsconfig.json` mexido por A | build | A | antes do merge |
| Migrations 006 e 007 no banco compartilhado | produção | A e B | **antes** do merge da própria branch |

---

## Depois dos três merges

1. `npm run build && npm run start`, `npm run qa` nas três formas, capturas
   abertas — feito pela frente C, em `main`.
2. `node scripts/medir-navegacao.mjs`, para comparar com a medição de antes
   (primeira visita: funil 1139ms, fornecedor 881ms, operação 854ms, com a tela
   anterior parada na frente do usuário o tempo todo).
3. `main` é o que a Vercel publica. Merge é publicação.
4. Desfazer os worktrees: `files/` volta para `main`, os outros saem com
   `git worktree remove`.

---

## Próxima rodada

O que ficou de fora desta e já tem dono sugerido:

**Frente A — funil e clientes**
- `/conta/senha`: o botão "Senha" da barra aponta para uma rota que não existe.
  Hoje é 404 para qualquer usuário que clicar. Ou a tela existe, ou o botão sai.
- "Colunas no fluxo" e "Tags", no topo do funil, são botões sem `onClick`.

**Frente B — operação, esteira e fornecedor**
- Confirmar o segundo filtro da esteira contra dado real (`specs/08-melhorias-qol.md`,
  "A confirmar", ponto 1).
- "Soma:" no painel de status é um `input` sem efeito nenhum.
- "Enviar Email" existe no Bubble (`documentacao-completa.md:1997`) e não existe
  no app. É escopo, não bug — precisa de decisão antes de virar tarefa.

**Frente C — plataforma**
- Passos de QA para as telas novas (tarefas, calendário, tabela de declinados).
- `<Suspense>` por consulta dentro das páginas, agora que as `page.tsx` não
  estão mais divididas entre frentes.
- Esqueleto do funil com a fita de abas.

**Fora de rodada, precisa de decisão do usuário**
- RLS. `db/003_rls.sql` está escrito e não aplicado desde 17/09/2026. Enquanto
  isso, toda tabela é legível e gravável com a `anon key`, que sai no bundle do
  navegador. Isso tem que estar resolvido antes de dado real de cliente entrar
  (`docs/seguranca.md`).

---

## Protocolo, daqui em diante

1. **Um worktree por branch.** Nunca duas sessões no mesmo diretório: `git
   checkout` de uma puxa o chão da outra.
2. **Propriedade de arquivo publicada por rodada.** Fronteira se resolve por
   mensagem entre as sessões, nunca editando o arquivo da outra.
3. `npm run verify` antes de cada commit; `npm run qa` antes de entregar tela.
4. **Merge só pela frente C**, na ordem publicada.
5. `main` sempre publicável, porque `main` é o que está no ar.
