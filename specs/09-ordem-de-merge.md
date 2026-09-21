# 09 — Ordem de merge e divisão das frentes · 18/09/2026

Três sessões trabalhando em paralelo, uma por frente. Este arquivo é o
combinado entre elas: quem faz o quê, em que ordem entra em `main`, e o que
cada uma tem que ter na mão antes de pedir merge.

**A frente C coordena**: publica a matriz de propriedade, faz os merges na
ordem abaixo e roda o QA de integração. A e B entregam a branch pronta e
avisam; não fazem merge.

---

## Estado — encerrado em 21/09/2026

**As três frentes entraram em `main`.** `git log main..<branch>` está vazio
para as três; a divisão de propriedade abaixo virou histórico.

| Branch | Worktree | O que tocou |
|---|---|---|
| `qol-funil-tarefas` (A) | `Downloads/AppLureCapital` | `db/006`, `funil/**`, `clientes/**`, `tsconfig.json` |
| `qol-operacao-esteira` (B) | `Downloads/app-capital-B` | `db/007`, `operacoes/**`, `esteira/**`, `fornecedores/**` |
| `qol-polimento` (C) | `Downloads/app-capital-C` | `components/**`, CSS global, layouts, `loading.tsx`, `perfil.ts`, `scripts/**` |

Depois do merge veio a **rodada de velocidade**, feita numa sessão só, em
`qol-funil-tarefas` já em cima da `main` unificada. Ela atravessa as fronteiras
da tabela de propósito — mexe em `page.tsx` e `tela.tsx` das cinco telas, em
`components/ui/rolagem.tsx`, na CSS global e em `scripts/` — e isso **só foi
possível porque não havia mais ninguém trabalhando em paralelo**. Com as
frentes vivas, uma mudança dessas teria que ser negociada arquivo por arquivo.

O resto deste arquivo fica como registro de como a rodada de três frentes foi
coordenada; o protocolo no fim continua valendo para a próxima vez que houver
mais de uma sessão no repositório.

---

## Definição de pronto (antes de pedir merge)

1. `npm run verify` passa.
2. `npm run qa` nas três formas (padrão, `-- --escuro`, `-- --celular`) e as
   **capturas foram abertas**. Passar não basta — regra 5 do CLAUDE.md.
3. A migration da frente já foi aplicada no Supabase — **quando ela mexe no
   esquema**. O banco é **um só**, e é o de produção: código que espera coluna
   nova quebra em `main` se a migration não subiu antes.
   - `006` (A) **é bloqueio**: cria colunas em `funil_tarefa` e fecha
     `cartao_id` em `not null`.
   - `007` (B) **não é bloqueio**: é só um índice parcial sobre
     `estruturacao_em_andamento`, coluna que existe desde a `002`. O índice é
     desempenho — com 14 operações na base, nem se mede.
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
2. `node scripts/medir-navegacao.mjs --vezes 7`, para comparar com a medição
   de antes (primeira visita: funil 1139ms, fornecedor 881ms, operação 854ms,
   com a tela anterior parada na frente do usuário o tempo todo). Depois da
   rodada de velocidade de 21/09 a mediana das quatro telas é **375ms**, com o
   esqueleto em ~100ms. O `--vezes` não é opcional: sem ele é uma medição só
   por tela, e o ruído da rede é maior que qualquer ganho que se vá medir.
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
- ~~Confirmar o segundo filtro da esteira~~ — **resolvido em 18/09/2026**, pelo
  MCP de leitura, operação por operação: o toggle sozinho dá 3 linhas (Garcia
  "CRA", Garcia "Giro com Barter", Trigobel "Giro Estruturado"); com o segundo
  filtro do Bubble a Trigobel sai, porque nenhuma das 12 etapas dela está em
  "contrato assinado", e sobram as 2 de produção. O filtro é por **cliente**,
  não por operação — "Giro com Barter" entra porque é a outra operação do mesmo
  cliente que tem contrato assinado; por operação sobraria 1. A decisão está em
  `specs/08-melhorias-qol.md`, seção "Decidido", com a tabela das 14.
- "Soma:" no painel de status é um `input` sem efeito nenhum.
- "Enviar Email" existe no Bubble (`documentacao-completa.md:1997`) e não existe
  no app. É escopo, não bug — precisa de decisão antes de virar tarefa.

**Plataforma**
- Passos de QA para as telas novas (tarefas, calendário, tabela de declinados).
- ~~`<Suspense>` por consulta dentro das páginas~~ — **medido e recusado em
  21/09/2026.** As consultas de cada página já são paralelas, então o ganho
  seria a diferença entre a mais lenta e a mais rápida do lote (~40ms), ao
  custo de partir cada página em componentes de servidor separados. Revisitar
  só se alguma tela passar a ter uma consulta claramente mais lenta que as
  outras. Ver `docs/otimizacao-de-carregamento.md`, §5.4.
- Esqueleto do funil com a fita de abas: `funil/loading.tsx` desenha o topo e o
  quadro, mas não as abas Quadro/Tarefas, então o esqueleto ainda pula uma
  linha quando o conteúdo chega. `EsqueletoAbas` já existe em
  `components/ui/esqueletos.tsx` — é encaixar.

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
