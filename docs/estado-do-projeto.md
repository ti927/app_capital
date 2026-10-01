# Estado do projeto — 01/10/2026

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
Em 01/10 veio a **rodada de ajustes da operação**: flags que não salvavam,
cliente e os dois pareceres no diálogo, "Lista de Fornecedores", filtro de
status, busca e ordem alfabética, clientes mais rápido, botão de
sincronizar com o Bubble e a RLS reescrita (`db/009`, **ainda não aplicada**).
Produção está no ar em `app-capital-psi.vercel.app`, com `main` = `34dc200`.

---

## Banco

| Migration | O que faz | Aplicada |
|---|---|---|
| `001` … `005` | fundação, domínio, correções | sim |
| `006_funil_tarefas` | tarefas do funil, `cartao_id not null`, `funil_cartao.cliente_id` | sim |
| `007_operacao_esteira` | índice da esteira | sim |
| `008_cliente_criado_por` | `cliente.criado_por` | sim |
| `003_rls` | policies — **substituída pela 009, não aplicar** | não |
| `009_rls` | RLS espelhando o recorte da aplicação; `funil_cartao.criado_por` | **não** — pronta e medida |

**A RLS continua desligada, e o app já está publicado.** Toda tabela é
legível e gravável com a `anon key`, que está no bundle do navegador.

`db/009_rls.sql` está pronta. Foi testada inteira dentro de uma transação
desfeita no fim (01/10), com os perfis reais:

| | antes | depois |
|---|---|---|
| master, por consulta | 0,06–0,2ms | 0,04–0,26ms |
| indicante, por consulta | 0,04–0,08ms | 0,04–0,63ms |
| anon | lê e grava tudo | 0 linhas em toda tabela, gravação recusada |

As gravações do indicante que a aplicação faz (cadastrar cliente, se pôr em
"quem visualiza", criar cartão, tarefa e coluna) passaram. Ela substitui a
003, que quebrava o indicante em quatro lugares — ver o cabeçalho da 009.
Aplicar:

```
node scripts/aplicar-migration.mjs db/009_rls.sql
```

O modo automático do Claude Code barra esse comando (banco de produção):
rodar com `!` ou aprovar no modo manual. Ver `docs/seguranca.md`.

---

## Telas

| Tela | Estado |
|---|---|
| Funil | quadro, tarefas com calendário, cartão em caixa 4:3, tags com cor livre, colunas (mover, arquivados, excluir), cartão vira cliente |
| Cliente | lista, cadastro, "puxar do funil", recorte do indicante; consulta em paralelo (servidor 163 → 97ms) |
| Fornecedor | tabela, matriz de tipos com tags clicáveis — só master |
| Operação | três abas, busca e ordem alfabética, diálogo com cliente e os dois pareceres, flags salvando, "Lista de Fornecedores", filtro de status na aba Fornecedor — só master |
| Esteira | duas operações (toggle + cliente com contrato assinado), oito instrumentos, blocos condicionais — só master |
| Conta | troca de senha |
| Topo | botão "Bubble" (sincronizar cadastros novos) — só a conta de `SINCRONIZACAO_EMAIL` (Fabio TI) |

---

## O que ficou aberto

**Precisa de decisão do negócio**

1. **Quais operações estão de fato em estruturação.** 20 operações têm o toggle
   marcado, mas 17 estão arquivadas; sobram 3 ativas, e o segundo filtro do
   Bubble (cliente com etapa em "contrato assinado") deixa 2 — que é o que
   produção mostra. O toggle só passou a existir na tela na rodada de QOL, então
   o dado nunca teve como ser mantido.
2. **A esteira não tem dado para mostrar, e isso não é falha da migração.**
   Das 388 etapas do Bubble, **uma** tem os campos da esteira preenchidos
   (Hospcom / FIDC / Vert Capital) — e essa operação está **arquivada**, então a
   esteira nunca a lista. `DTVM`, `securitizadora`, `AgenteFiduciario`,
   `Custodiante`, `Emissor`, `Estruturador`, `Demais` e os três toggles não
   existem como chave em nenhuma linha do Bubble. O pop-up abre em branco
   porque a origem está em branco; conferido campo a campo em 21/09/2026
   (`docs/aprendizados.md`, seção 11).
   **Confirmado no live em 01/10:** no app oficial só o Garcia Agronegócios
   está configurado na esteira, e sem nenhum dado dentro. É o que esta tela
   mostra — não há o que puxar.
3. **"Enviar Email"** existe no Bubble (`documentacao-completa.md:1997`, fluxo
   em `:2210`) e não existe aqui. O app não tem serviço de e-mail; a proposta
   é o Resend, com a chave só no servidor. **Aguardando o ok.**
4. **RLS**: `db/009` pronta — falta aplicar (ver Banco).
5. **Sincronização com o Bubble** (`specs/10-sincronizacao-bubble.md`):
   - cliente, operação e etapas **não estão expostos na Data API do live** —
     alguém precisa marcá-los em Settings › API no Bubble; até lá o botão só
     traz fornecedor e funil;
   - registro excluído aqui volta no próximo clique se ainda existir no
     Bubble — aceitar, ou guardar uma lista de "não trazer de novo"?
   - cliente novo vindo do Bubble herda o autor de lá em `criado_por`?
6. **Quebra de linha dos textos longos.** O navegador manda CRLF; salvar sem
   mudar nada reescreve o texto (649 → 662 caracteres no teste). Só o parecer
   do cliente normaliza hoje. Aplicar a todos os campos?

**Próxima rodada, técnico**

0. **QA visual da rodada de 01/10 não rodou** — o modo automático barrou o
   `qa:tudo`. Rodar nas três formas e abrir `operacao-dialogo`,
   `operacao-aba-fornecedor-*` e a lista de operações com busca. Risco
   conhecido: no celular o filtro de status pode ficar apertado no cabeçalho.
0. **Mudanças da esteira de 21/09 ainda fora do git**: `specs/08b` (achado
   "por que a esteira parece vazia") e `esteira/{dialogo,page,tela}.tsx`
   (rótulo pelo identificador, diálogo abrindo na etapa com contrato
   assinado). Conferir e commitar.
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

Em 01/10/2026 `main` = `qol-funil-tarefas` = `34dc200`. Para limpar:

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
