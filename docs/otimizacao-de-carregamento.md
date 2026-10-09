# Guia de otimização de carregamento

Como este sistema fica rápido, o que já foi feito, o que foi medido e recusado,
e em que ordem mexer da próxima vez.

A regra que vale acima de todas: **mede antes, mede depois, e guarda o número
aqui.** Metade das coisas que parecem lentas não são, e metade das otimizações
"óbvias" não valem nada. As duas metades estão documentadas neste arquivo.

---

## 1. De onde vem o tempo

Medido em 21/09/2026, build de produção, `npm run start`, contra o Supabase de
verdade. Uma navegação interna gasta, em ordem:

| Etapa | Custo | Dá para mexer? |
|---|---|---|
| Middleware confere a sessão (`getUser`) | ~68ms | Não — ver §5.1 |
| Página lê o perfil (`getUser` + `select`) | ~90ms | **Sim** — ver §3.1 |
| Consultas da página ao Supabase | ~80ms (paralelas) a ~520ms (em série) | **Sim** — ver §3.1 |
| Desenho no servidor + streaming + hidratação | ~120ms | Pouco |

E o custo de uma ida ao Supabase, isolado:

```
   60–100ms   uma consulta, qualquer tamanho
      132ms   nove consultas em PARALELO
      520ms   as mesmas nove em SÉRIE
```

**A conclusão que manda em tudo:** o que custa é o **número de idas em série**,
não o tamanho do que volta. Uma consulta de 383 linhas custa o mesmo que uma de
1 linha (75ms contra 60ms). Duas consultas em série custam o dobro de duas em
paralelo. Otimizar aqui é sempre a mesma pergunta: *o que está esperando o que,
sem precisar?*

---

## 2. Como medir

```bash
npm run build && npm run start          # em outro terminal
node scripts/medir-navegacao.mjs --vezes 7
```

Duas leituras por tela:

- **resposta** — do clique até QUALQUER coisa aparecer (o esqueleto).
- **conteúdo** — do clique até o dado de verdade aparecer.

Três coisas que o script faz e que não são detalhe:

1. **Descarta a primeira passada.** Ela paga o aquecimento do servidor e mede o
   que nenhum usuário vê duas vezes.
2. **Repete e tira a mediana.** Uma medição por tela não serve para comparar: a
   mesma build, medida três vezes seguidas, deu 485ms, 360ms e 380ms. O que
   oscila é a internet até o Supabase. Sem `--vezes`, você vai "melhorar" ruído.
3. **Mede sempre a PRIMEIRA visita**, em contexto novo. Na segunda o router do
   Next já tem o payload guardado e tudo parece instantâneo.

Nunca meça em `next dev` — o número é o do compilador, não o do usuário.

### Quando precisar saber onde exatamente o tempo foi

Instrumente na mão, temporariamente, e leia o log do servidor:

```ts
const t = Date.now();
const { data } = await supabase.auth.getUser();
console.log('[T] perfil.getUser', Date.now() - t);
```

Foi assim que se descobriu que o perfil custava 90ms **na frente** das
consultas. O `medir-navegacao` diz que está lento; só o log diz onde.

---

## 3. O que já está feito

### 3.1 As consultas não esperam o perfil (todas as telas)

Era assim:

```ts
const perfil = await perfilAtual();   // 90ms parado
const supabase = await clienteServidor();
const [...] = await Promise.all([ ...12 consultas... ]);   // só agora o banco trabalha
```

Agora é assim:

```ts
const supabase = await clienteServidor();

const pedidos = Promise.all([ ...12 consultas... ]);   // o banco já está trabalhando
pedidos.catch(() => {});                               // ver a nota abaixo

const perfil = await perfilAtual();                    // corre JUNTO
if (perfil.nivel_acesso !== 'master') redirect('/clientes');

const [...] = await pedidos;
```

O `catch` vazio não é preguiça: se a página desistir no `redirect` com a
consulta ainda no ar, sem ele vira "unhandled rejection" no log do servidor.

**A guarda de acesso não afrouxa.** O `redirect` continua acontecendo antes de
qualquer dado chegar à tela. O que mudou é só quem espera quem.

### 3.2 Esteira: duas consultas em série viraram uma

A esteira precisa dos clientes com "contrato assinado". Fazia:

```ts
const status = await supabase.from('status_etapa').select('id').eq('chave', 'contrato_assinado');
const etapas = await supabase.from('etapa_operacao').select('cliente_id').eq('status_id', status.id);
```

Duas idas em série, a segunda esperando a primeira. O PostgREST junta as duas
no servidor:

```ts
supabase
  .from('etapa_operacao')
  .select('cliente_id, status_etapa!inner(chave)')
  .eq('status_etapa.chave', 'contrato_assinado');
```

Mesmo resultado (13 etapas, 7 clientes, conferido), uma ida. **Sempre que uma
consulta existe só para alimentar o `where` da próxima, ela é um `!inner`.**

Na tela de clientes o mesmo raciocínio tirou outra ida: os ids de
`cliente_visualizador` saem da lista que já vinha para o diálogo, em vez de uma
consulta própria filtrada por `perfil_id`. (E em 01/10 a consulta de `cliente` deixou de esperar — §3.3b.)

### 3.3 Perfil e cliente Supabase, uma vez por requisição

`perfilAtual()` e `clienteServidor()` são `cache()` do React. Layout e página
pedem os dois na mesma requisição; sem isso cada um pagava o seu.

⚠️ **`cache()` não é `unstable_cache`.** O `cache()` vale para UMA requisição e
morre com ela. O `unstable_cache` guarda entre requisições e **já quebrou este
sistema uma vez**: a função guardada levava junto o cliente Supabase da
requisição que a criou, o refresh token vencia, o Supabase revogava a sessão
inteira e o usuário caía no login no meio do trabalho. Ver a nota em
`src/lib/perfil.ts`. Não repetir.

### 3.3b Clientes: a carteira não espera mais o perfil (01/10/2026)

Queixa: "a página de clientes está demorando". Era a **única tela com uma
segunda volta na fila**: as consultas de apoio já corriam junto com o perfil
(§3.1), mas a de `cliente` esperava o perfil (para saber o recorte do
indicante) e `cliente_visualizador` (para montar o `id.in.(...)`), e só então
ia ao banco — ativos e arquivados em duas consultas.

Agora `cliente` sai no mesmo `Promise.all` que o resto, numa consulta só
(ativos e arquivados juntos, separados pelo campo), e o recorte do indicante
(`criado_por = eu` ou vínculo em `cliente_visualizador`) é feito **no
servidor**, em `page.tsx`, sobre a carteira que já veio. O que chega ao
navegador é o mesmo de antes; a guarda continua antes de qualquer desenho.

Medido com `[T]` no log do servidor (n=123 requisições de cada lado):

| Trecho da página | Antes | Depois |
|---|---|---|
| perfil pronto | 91ms | 96ms |
| todos os dados prontos | **163ms** (p25 151, p75 179) | **97ms** (p25 89, p75 110) |

Do clique ao conteúdo (`medir-navegacao --tela Cliente --vezes 15`, antes e
depois servidos lado a lado e medidos intercalados, três rodadas):
**383 / 429 / 389ms → 379 / 409 / 379ms.** Os ~65ms que saíram do servidor
aparecem só como ~10–20ms no relógio de ponta a ponta — o resto ficou dentro
do ruído da máquina (outras sessões rodando build e QA ao mesmo tempo; o
esqueleto chegou a levar 380ms numa rodada). **Ponto em aberto:** não
consegui confirmar onde o resto some; a próxima medição deve instrumentar
também o `layout.tsx` de `(app)` (perfil → `perfil` em série para o master)
para saber se ele roda na navegação interna e cobre o ganho da página.

Comparada às outras telas, Cliente já estava na mesma faixa (mediana de 7
passadas, mesma rodada: Cliente 437ms, Funil 511ms, Fornecedor 525ms, Operação
699ms, Esteira 394ms) — a queixa não era um outlier grosseiro, era a fila
extra. Payload: 12 KB, sem mudança.

⚠️ `db/003_rls.sql` — a policy `cliente_le` só conhece `cliente_visualizador`,
não `criado_por`. Ligada como está, o indicante deixa de ver os clientes que
ele mesmo cadastrou. Não é desta mudança (a consulta antiga tinha o mesmo
problema), mas precisa ser ajustada antes de aplicar a RLS.

Nenhum índice foi necessário: 51 clientes, e o tempo é ida e volta (§5.5).

`scripts/medir-navegacao.mjs` ganhou nesta rodada: a tela **Cliente** (antes
era só o ponto de partida, nunca medida — parte de `/fornecedores`), `--tela
<rótulo>` para medir uma tela só, e amostra que não chega em 30s vira falha
contada em vez de derrubar a execução inteira.

### 3.4 Esqueleto de carregamento (`loading.tsx`)

Cada rota tem o seu, com a **geometria da tela que vem** — as mesmas classes do
conteúdo real. É o que faz a tela responder em ~100ms em vez de ficar parada.

Toda classe emprestada do conteúdo leva um modificador `--esqueleto`. Sem isso
o QA dá `waitForSelector('.lista__item')` por satisfeito com a barra cinza e
fotografa o esqueleto no lugar da lista — já aconteceu.

### 3.5 Rolagem sob demanda (`src/components/ui/rolagem.tsx`)

Listas e tabelas entram em lotes de 40 (15 nas colunas do funil) e crescem
conforme a pessoa rola, via `IntersectionObserver` com 600px de folga.

Aplicado em: lista e arquivados de clientes · tabela e arquivados de
fornecedores · lista e arquivadas de operações · tabela de etapas por fundo
(a que mais cresce: 383 etapas) · lista da esteira · cartões de cada coluna do
funil · cada grupo de tarefas.

Três coisas para não errar ao aplicar em lugar novo:

1. **A lista passada ao hook precisa ser estável entre renders** (vir de
   `useMemo`), senão o efeito que reinicia o corte dispara sozinho e a lista
   nunca cresce. Quando o filtro tem de acontecer dentro de um `.map`, extraia
   um componente e faça o `useMemo` lá dentro — foi o que `CartoesDaColuna`
   resolveu no funil.
2. **Dentro de um container que rola por conta própria, passe `raiz`.** Sem
   `root`, o observador compara com a janela, a sentinela fica recortada pela
   coluna e o `rootMargin` não vale nada: o lote só entra ao chegar no fim, com
   um tranco.
3. **O botão não é enfeite.** O `IntersectionObserver` não dispara para quem
   navega por teclado. O botão é o caminho que sempre funciona.

**Isto não é paginação de banco.** A lista inteira já está na memória, então
busca, filtro, ordenação e contagem continuam valendo sobre o total — quem
busca "Trigobel" acha, mesmo na linha 800. O que se economiza é o **primeiro
desenho no navegador**, não a rede.

Com 51 clientes e 70 fundos isto não muda o relógio hoje. Está aqui porque é
onde a conta vira: a partir de algumas centenas de linhas o primeiro desenho
começa a pesar, e o remédio não pode chegar depois da queixa.

### 3.6 A aba de Tarefas do funil só monta quando aberta

O funil é a tela mais pesada. Montava junto o painel de tarefas inteiro — o
calendário do mês e os oito grupos — numa aba que a maioria das visitas nunca
abre. Agora monta na primeira vez que é aberta e fica montada daí em diante,
que é o que o `hidden` já garantia: trocar de aba continua não remontando o
quadro nem perdendo busca e filtro.

### 3.7 Botão Salvar (09/10/2026)

Queixa: "os botões de salvar demoram, até quando não tem informação nova".

**Região das funções (iad1 → gru1).** As funções da Vercel passaram de
Washington para São Paulo, ao lado do Supabase (sa-east-1). Uma chamada
autenticada que lê o banco (`listar_funil`, no MCP) caiu de **1245ms para 191ms**
(mediana). Foi o maior ganho disto tudo; o resto abaixo é o que sobrou.

**Como foi medido.** `scripts/medir-salvar.mjs`: Playwright, login programático
(`signInWithPassword` + cookies do `@supabase/ssr` injetados no contexto — a
`/entrar` com senha não está ligada em produção), relógio **dentro da página**,
do clique em Salvar até o `.lc-aviso` entrar no DOM. Registros de teste
("ZZ-MEDICAO-SALVAR": um cliente com vínculo, um fornecedor com 4 vínculos, uma
operação com 1 declínio) criados e apagados pelo próprio script; a "mudança" é
trocar um campo de texto, e depois restaurar (a restauração não entra na conta).
Mediana de 5 repetições, descartada a primeira volta.

| Diálogo | Produção hoje (gru1, código antigo) | Local, código antigo | Local, código novo |
|---|---|---|---|
| **sem mudança** — cliente | 480ms | 541ms | **3ms** |
| sem mudança — fornecedor | 451ms | 450ms | **3ms** |
| sem mudança — operação | 532ms | 541ms | **3ms** |
| **com mudança** — cliente | 493ms | 591ms | **377ms** |
| com mudança — fornecedor | 363ms | 466ms | **379ms** |
| com mudança — operação | 481ms | 652ms | **403ms** |

⚠️ **Produção e local não são comparáveis entre si** (a máquina local fala com o
Supabase pela internet, a função da Vercel fala de dentro de São Paulo). A
comparação que vale é a da mesma coluna: antes e depois do código, na mesma
máquina e contra o mesmo banco — `next build` + `next start` do `HEAD` (cópia
limpa do commit) e do código novo, lado a lado. A coluna "produção" é o ponto de
partida real: o "depois" em produção só existe depois do deploy.

**1. Sem mudança = instantâneo.** `src/components/ui/sem-mudancas.ts`: o
navegador tira uma fotografia do `FormData` do formulário logo depois de ele
aparecer e, no submit, compara. Igual → não chama o servidor, fecha o diálogo e
mostra o aviso de sempre ("Cliente salvo"), sem spinner: **3ms e zero POST**
(o QA confere as duas coisas). A fotografia é do `FormData`, então já inclui
campos controlados, multisseleção (as fichas são `<input type="hidden">`),
interruptores e o que mora fora da `<form>` com `form="id"` — o "Estruturação em
Andamento" do rodapé da operação, coberto por um passo próprio do QA (mexer só
nele **tem** que ir ao servidor). Vale para cliente, fornecedor, operação,
cartão do funil e tarefa — só em **edição**: cadastro novo sempre vai ao servidor.
Na dúvida o envio segue (fotografia ainda não tirada, ou qualquer diferença).

**2. Com mudança: menos idas em fila.** Idas ao banco em SEQUÊNCIA por salvamento
de um registro existente (a leitura que corre junto com o `update` conta como a
mesma ida):

| Ação | Antes | Depois |
|---|---|---|
| Cliente (master) | getUser → perfil → update → delete vínculos → insert vínculos: **5** | getUser → perfil ‖ update ‖ ler vínculos: **2** (+1 só se "quem visualiza" mudou) |
| Fornecedor | update → delete → insert: **3** | update ‖ ler vínculos: **1** (+1 só se algum vínculo mudou) |
| Operação | update → update do parecer do cliente → delete → insert: **3 a 4** | update ‖ ler parecer ‖ ler declínios: **1** (+1 se o parecer do cliente mudou, +1 se os declínios mudaram) |
| Cartão | update → delete tags → insert tags: **3** | update ‖ ler tags: **1** (+1 só se as tags mudaram) |
| Tarefa (agenda) | update → ler tarefa → ler conectados → …: **3+** | update → ler tarefa ‖ ler conectados → …: **2+** |

Os vínculos (visualizadores, tipos de operação, tags, declínios) agora gravam só a
diferença (`src/lib/diferenca.ts`, com teste). Se a leitura do conjunto atual
falhar, regrava o conjunto inteiro, como sempre foi. O parecer do cliente só é
gravado quando mudou de verdade, e `/clientes` só é revalidada nesse caso. Regra
de negócio e RLS não mudaram.

**O que sobra do tempo com mudança** (~380ms local): middleware `getUser` (~70ms)
+ a fila da action (~100–120ms, medida com `[T]` no log) + **re-render da página
pelo `revalidatePath`, ~140ms**. Isso último foi medido tirando o
`revalidatePath` do `gravarCliente`: 396ms → 256ms. **Não aplicado**: o
`revalidate` é o que faz a lista já voltar atualizada junto com o aviso; trocar
por `router.refresh()` em segundo plano deixaria a linha velha na tela por
~150ms depois do "Cliente salvo", e fechar o diálogo antes de o servidor
responder (otimista de verdade) faria o aviso de sucesso mentir quando a gravação
falha. Se o tempo com mudança voltar a ser queixa, esta é a próxima alavanca —
com a lista atualizada localmente junto.

---

## 4. Resultado

Mediana de 7 passadas, build de produção, mesma máquina e mesma rede:

| Tela | Antes | Depois | Pior caso antes | Pior caso depois |
|---|---|---|---|---|
| Funil de Clientes | 379ms | **375ms** | 419ms | 465ms |
| Fornecedor | 406ms | **382ms** | 511ms | 456ms |
| Operação | 383ms | **374ms** | 411ms | 398ms |
| Esteira | 442ms | **366ms** | 567ms | 498ms |
| **mediana** | **406ms** | **375ms** | | |

O ganho de mediana é modesto (~8%), e a tela que mais ganhou foi a esteira
(442ms → 366ms, −17%), que era a que tinha a fila mais longa de consultas em
série. O funil praticamente não mudou de mediana: lá o tempo está nas nove
consultas em paralelo, e elas já estavam paralelas.

A resposta (o esqueleto) continua em ~100ms, que é onde já estava. O payload do
funil caiu de 45 KB para 41 KB, porque a aba de tarefas deixou de ser desenhada
sem ninguém pedir.

**Seja honesto sobre o teto.** Depois destas mudanças o que sobra é ~68ms de
middleware, ~80–130ms de consultas paralelas e ~120ms de desenho e hidratação.
Não há mais nenhuma espera boba na fila. Para descer bem abaixo de ~350ms seria
preciso mudar de patamar — §6.

---

## 5. Medido e recusado

Esta seção existe para ninguém gastar o dia de novo nas mesmas ideias.

### 5.1 `getClaims()` no lugar de `getUser()` no middleware — NÃO

`getClaims()` confere a assinatura do JWT localmente (ES256) e evitaria uma ida
à rede que o log mostra custando ~68ms. Parecia dinheiro no chão.

Medido duas vezes: 18/09 deu ~19ms de 377ms; 21/09 deu 372ms contra 375ms —
empate dentro do ruído. Os 68ms correm junto com o prefetch da rota, não na
frente do clique. Trocaria uma revogação de sessão conferida pelo servidor por
nada. **Não medir de novo sem mudar outra coisa antes.**

### 5.2 Guardar as tabelas de apoio entre requisições — NÃO

`tipo_operacao`, `status_etapa` e `status_operacao` nunca mudam e são iguais
para todo mundo; parecia caso óbvio de cache. Mas elas já viajam **dentro do
`Promise.all`**, em paralelo com as outras. Tirar três de doze consultas
paralelas economiza o quê? A diferença entre a mais lenta e a segunda mais
lenta — algo entre 0 e 20ms. E `unstable_cache` não pode usar `cookies()`, o
que obrigaria a um cliente sem sessão e a uma policy `to anon` que
`db/003_rls.sql` não tem.

### 5.3 Não trazer os arquivados no primeiro desenho — NÃO

O bloco "Arquivados" nasce fechado, então parecia candidato a carregar sob
demanda. Mas o cabeçalho mostra a contagem, e o bloco some quando é zero: sem a
consulta não há contagem, e a seção passaria a aparecer sempre, vazia ou não.
Custo: uma regressão visível. Ganho: 0 a 30ms dentro de um lote que já é
paralelo. Não compensa.

### 5.4 `<Suspense>` dentro da página, separando lista de dados de apoio — NÃO (por ora)

Faria a lista pintar antes das tabelas de apoio. Mas as consultas já são
paralelas, então o ganho é a diferença entre a mais lenta e a mais rápida do
lote — ~40ms —, ao custo de dividir cada página em componentes de servidor
separados. Revisitar **se** uma tela passar a ter uma consulta claramente mais
lenta que as outras.

### 5.5 Índices no banco — ainda não

Com 51 clientes, 70 fundos, 14 operações e 383 etapas, o Postgres resolve tudo
em varredura e os 60–100ms são ida e volta pela internet, não trabalho de
banco. Índice aqui não muda nada. Revisitar quando alguma tabela passar de uns
10 mil registros — aí comece por `etapa_operacao`.

---

## 6. A ordem para a próxima vez

1. **Mede** com `--vezes 7`, e anota o número de antes.
2. **Conta as idas em série.** Instrumente com `console.log` e procure o que
   está esperando o que sem precisar. É onde estava todo o ganho até hoje.
3. **Junta consultas encadeadas** com `!inner`, quando uma só existe para
   alimentar o `where` da outra.
4. **Não monta o que ninguém pediu** — aba fechada, diálogo fechado, bloco
   recolhido. Mas confira se algo visível (uma contagem) depende do dado antes
   de cortar.
5. **Lote em qualquer lista nova** que possa passar de ~100 linhas, com
   `useListaIncremental`.
6. **Mede de novo, e escreve aqui** — inclusive o que não deu certo. A §5 vale
   mais que a §3.

### O que NÃO adianta perseguir

- **O tamanho do payload.** As telas mandam de 13 a 46 KB. Não é o problema, e
  não vai ser tão cedo.
- **O tamanho do bundle.** 103 KB compartilhados, 111–120 KB por tela. Está bom.
- **Microtempos de render no React.** O gargalo está na rede, não na CPU.

O teto real hoje é a ida e volta ao Supabase. Para descer muito abaixo de
~350ms seria preciso mudar de patamar — Postgres na mesma região da Vercel, ou
um cache de verdade na frente do banco. Nada disso se justifica antes de a base
crescer.
