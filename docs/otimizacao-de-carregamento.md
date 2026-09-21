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
consulta própria filtrada por `perfil_id`.

### 3.3 Perfil e cliente Supabase, uma vez por requisição

`perfilAtual()` e `clienteServidor()` são `cache()` do React. Layout e página
pedem os dois na mesma requisição; sem isso cada um pagava o seu.

⚠️ **`cache()` não é `unstable_cache`.** O `cache()` vale para UMA requisição e
morre com ela. O `unstable_cache` guarda entre requisições e **já quebrou este
sistema uma vez**: a função guardada levava junto o cliente Supabase da
requisição que a criou, o refresh token vencia, o Supabase revogava a sessão
inteira e o usuário caía no login no meio do trabalho. Ver a nota em
`src/lib/perfil.ts`. Não repetir.

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
