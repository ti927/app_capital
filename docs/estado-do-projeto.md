# Estado do projeto — 21/09/2026

Onde o app está ao fim do dia, o que está bloqueado e por onde continuar.
Atualize este arquivo ao fim de cada rodada.

---

## Em uma linha

As cinco telas estão de pé e a rodada de QOL fechou: funil com tarefas e
calendário, operação com os campos que faltavam, esteira listando o que deve,
menu com o perfil, troca de senha, e o recorte do indicante fechado. Em 21/09
veio a **rodada de velocidade**: as telas deixaram de esperar a leitura do
perfil para só então ir ao banco, e listas longas passaram a entrar em lotes
conforme a pessoa rola. Mediana das quatro telas: 406ms → 375ms.
**Produção está fora do ar por falta de uma variável na Vercel.**

---

## Bloqueio de produção

`NEXT_PUBLIC_SUPABASE_ANON_KEY` **não existe** no projeto da Vercel — só a URL.
O build passa e o app cai em toda requisição, no middleware, com *"Your
project's URL and Key are required to create a Supabase client"*.

```powershell
cd C:\Users\fabio\Downloads\AppLureCapital
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# cole o valor que está no .env local (é chave pública, vai no bundle de qualquer jeito)
npx vercel --prod
```

Conferir depois com `npx vercel env ls production`.

---

## Banco

| Migration | O que faz | Aplicada |
|---|---|---|
| `001` … `005` | fundação, domínio, correções | sim |
| `006_funil_tarefas` | tarefas do funil, `cartao_id not null`, `funil_cartao.cliente_id` | sim |
| `007_operacao_esteira` | índice da esteira | sim |
| `008_cliente_criado_por` | `cliente.criado_por` | sim |
| `003_rls` | policies | **não** — decisão de 17/09 |

**A RLS continua desligada.** Enquanto estiver assim, toda tabela é legível e
gravável com a `anon key`, que sai no bundle do navegador. Precisa entrar antes
de dado real de cliente. Ver `docs/seguranca.md`.

Quando a RLS for ligada, duas coisas desta rodada pedem policy nova:

- `cliente`: o recorte do indicante virou **união** de "está em quem visualiza"
  **ou** "é quem cadastrou" (`criado_por`).
- `funil_tarefa`: tarefa segue o cartão, e quem é responsável também vê.

---

## Telas

| Tela | Estado |
|---|---|
| Funil | quadro, tarefas com calendário, cartão em caixa 4:3, tags com cor livre, colunas (mover, arquivados, excluir), cartão vira cliente |
| Cliente | lista, cadastro, "puxar do funil", recorte do indicante |
| Fornecedor | tabela, matriz de tipos com tags clicáveis — só master |
| Operação | três abas, campos do Bubble, tabela de declinados, "na mão de" inteiro — só master |
| Esteira | duas operações (toggle + cliente com contrato assinado), oito instrumentos, blocos condicionais — só master |
| Conta | troca de senha |

---

## O que ficou aberto

**Precisa de decisão do negócio**

1. **Quais operações estão de fato em estruturação.** 3 das 14 têm o toggle
   marcado, e o toggle só passou a existir na tela nesta rodada — o dado nunca
   teve como ser mantido.
2. **"Enviar Email"** existe no Bubble (`documentacao-completa.md:1997`) e não
   existe aqui. É escopo, não bug.
3. **RLS**: quando ligar.

**Próxima rodada, técnico**

1. **Passos de QA que faltam**: a tabela de etapas declinadas e o "Na mão de"
   com texto longo — nenhum passo rola o diálogo de operação até lá. Caso de
   teste indicado pela frente B: operação "FIDC Prop / Sementes Veneza", 15
   etapas, 6 declinadas.
2. **Esqueleto do funil sem a fita de abas**: `funil/loading.tsx` desenha o topo
   e o quadro, mas não as abas Quadro/Tarefas, então o esqueleto pula uma linha
   quando o conteúdo chega. `EsqueletoAbas` já existe — é encaixar.
3. ~~Cortar consulta por página~~ e ~~`<Suspense>` por consulta~~ — **medidos e
   recusados em 21/09.** Não era volume, era fila; e as consultas de cada página
   já são paralelas. Antes de tentar qualquer otimização de carregamento, leia
   `docs/otimizacao-de-carregamento.md` — a §5 lista as quatro ideias já
   descartadas, com o número de cada uma.
4. Botões do topo do funil que ainda não têm ação: nenhum — os quatro da coluna
   e os dois do topo foram fechados na rodada de QOL.

---

## Worktrees

A rodada rodou em três sessões paralelas, uma por worktree:

| Pasta | Branch | Para quê |
|---|---|---|
| `Downloads/AppLureCapital` | `qol-funil-tarefas` | repositório principal |
| `Downloads/app-capital-B` | `qol-operacao-esteira` | frente B (encerrada) |
| `Downloads/app-capital-C` | `qol-polimento` | frente C (encerrada) |
| `Downloads/app-capital-main` | `main` | estação de merge |

Tudo já está em `main`. Para limpar:

```bash
git worktree remove ../app-capital-B
git worktree remove ../app-capital-C
git branch -d qol-operacao-esteira qol-funil-tarefas qol-polimento
```

> Worktree quebra quando a pasta do repositório é renomeada: o `.git` de cada um
> guarda o caminho absoluto do principal. Aconteceu na saída de
> `Downloads/files` para `Downloads/AppLureCapital` — todo comando git dentro
> deles dava `fatal: not a git repository`. Conserto:
> `git worktree repair <caminho> ...`, rodado do repositório principal.

O protocolo de trabalho em paralelo está em `specs/09-ordem-de-merge.md`.
