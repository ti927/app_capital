# Aprendizados

O que esta rodada ensinou, escrito para quem abrir o projeto amanhã — inclusive
para a próxima sessão do Claude. Não é diário: é o que muda decisão.

---

## 1. Teste verde e tela errada convivem bem

O QA passou 42/42 nas três formas **fotografando o esqueleto de carregamento no
lugar do conteúdo**. O esqueleto reusa `.lista__item`, `.funil__coluna` e as
linhas de tabela de propósito, para ter a mesma geometria — e com isso todo
`waitForSelector('.lista__item')` se dava por satisfeito com a barra cinza.

A captura da esteira mostrava uma tela em branco e o relatório dizia "ok".

**O que ficou:** classe emprestada do conteúdo vem com modificador
`--esqueleto`, e o QA espera por `:not(...--esqueleto)` — há constantes prontas
no topo de `scripts/qa.mjs` (`ITEM_REAL`, `LINHA_REAL`, `COLUNA_REAL`). Use-as
em vez das classes cruas.

**O que isso diz:** a regra 5 do `CLAUDE.md` não é zelo, é o único mecanismo que
pega esta classe de erro. Passo verde prova que o robô encontrou um seletor.
Só a imagem prova que o usuário vai ver a tela.

---

## 2. Medir antes, e medir a coisa certa

Três medições desta rodada saíram erradas antes de sair certas:

| Medida | O que parecia | O que era |
|---|---|---|
| navegação em ~90ms | rápido | cache do router do Next depois da primeira visita |
| conteúdo em 57ms | ganho enorme | o esqueleto aparecendo, não o dado |
| esteira em 24ms | instantâneo | o DOM da tela anterior ainda casando com o seletor |

**O que ficou:** `scripts/medir-navegacao.mjs` mede a **primeira** visita, saindo
sempre de `/clientes`, exigindo `location.pathname` junto com o seletor, e
separa duas leituras: *resposta* (a tela reagiu) e *conteúdo* (o dado chegou).
Também mostra quanto cada tela manda pelo fio.

**O que isso diz:** número sem método é decoração. Antes de otimizar, tenha uma
medida que você confia — e que mede o que o usuário sente.

---

## 3. Onde a lentidão está, de verdade

Medido em build de produção contra o Supabase real, com o mesmo script nos dois
lados:

- **Payload não é o problema:** 12 a 40 KB por tela.
- **Autenticação não é o problema:** trocar `getUser()` (ida à rede) por
  `getClaims()` (assinatura conferida local) valeu ~19ms em 377ms.
- **É ida e volta ao banco:** ~80ms por consulta, e cada tela faz uma leva delas.

**O ganho que já existe** é de percepção: com `loading.tsx` a tela responde em
~100ms em vez de ficar congelada por 340–490ms. O dado chega no mesmo tempo.

> **Correção de 21/09/2026.** Este trecho dizia que o caminho seguinte era
> "cortar consulta por página", porque `/operacoes` busca 383 etapas para
> derivar um rótulo e `/esteira` busca todas para mostrar duas linhas. **Medido,
> não era.** Uma consulta de 383 linhas custa 75ms; uma de 1 linha custa 60ms —
> o tamanho quase não entra na conta. O que custava era a **fila**: nove
> consultas em paralelo levam 132ms, e as mesmas nove em série levam 520ms.
> Ver a seção 8.

---

## 4. Duas otimizações que foram desfeitas — e por quê

- **`unstable_cache` na leitura do perfil.** A função guardada leva junto o
  cliente Supabase da requisição que criou a entrada. Cliente de requisição
  antiga, guardado num cache que vale para todas, é um jeito de misturar sessão
  de gente diferente. Economia: ~80ms. Desfeito.
- **`getClaims()` no lugar de `getUser()`.** ~19ms em 377ms, dentro do ruído.
  Desfeito: o caminho de autenticação é o último lugar onde vale trocar uma
  garantia do servidor por 5% de tempo. **Medido de novo em 21/09**, porque o
  log do servidor mostrava `getUser()` levando 68ms e parecia dinheiro no chão:
  372ms contra 375ms, empate. Esses 68ms correm junto com o prefetch da rota,
  não na frente do clique. Não medir uma terceira vez sem mudar outra coisa
  antes.

**O que isso diz:** otimização que toca sessão precisa de um ganho que se veja
sem régua. Se o ganho está no ruído da medição, não compensa o risco.

---

## 5. O robô também erra — e parece bug do sistema

Passei um bom tempo caçando "a sessão cai ao trocar a senha". Não caía: o meu
teste clicava `button[type="submit"]` e pegava o **"Sair"** da barra superior,
que é o primeiro do DOM. O teste se deslogava sozinho.

**O que ficou:** no `qa.mjs` e nas sondas, clique por texto ou por seletor
escopado (`.lc-btn[type="submit"]` na tela de login, `button:has-text("Trocar
senha")`), nunca pelo primeiro `[type=submit]` da página.

**O que isso diz:** antes de acusar o sistema, confira o instrumento. Instrumentar
o servidor (dois `console.log`) custou um build e matou a dúvida em um ciclo.

---

## 6. Três frentes em paralelo: o que funcionou

- **Um worktree por branch.** Três sessões no mesmo diretório não funciona: `git
  checkout` de uma puxa o chão das outras. Ver `specs/09-ordem-de-merge.md`.
- **Propriedade de arquivo publicada antes de começar.** As três branches
  fecharam com **zero arquivos em comum** — o merge não teve um conflito de
  texto sequer. O que exigiu conversa foi comportamento (o seletor que mudou de
  forma, o diálogo que passou a desmontar com atraso).
- **Fronteira se resolve por mensagem, não editando o arquivo do outro.** As
  correções mais úteis da rodada vieram assim: uma frente avisou que
  `.interruptor` já era `nowrap`, outra apontou que migration de índice não é
  bloqueio de merge. As duas estavam certas.
- **O QA das três formas roda em paralelo** (`npm run qa:tudo`): de ~4 minutos
  para ~40 segundos. Elas batem no **mesmo banco**, então dado de teste precisa
  de nome próprio por forma — senão uma corrida enxerga a tarefa da outra.

---

## 7. Regra de negócio se confere no dado, não na memória

A esteira devia listar duas operações e listava sete. A tentação era somar
filtro até o número bater. O que resolveu foi abrir o banco pelo MCP de leitura
e conferir operação por operação: o toggle sozinho dá 3, e o segundo filtro do
Bubble — **por cliente, não por operação** — tira a que faltava. A tabela está
em `specs/08-melhorias-qol.md`, seção "Decidido".

**O que isso diz:** quando o número não bate, o dado responde mais rápido que a
discussão. E quando o dado mostra que o campo nunca teve manutenção (3 de 14
operações com o toggle marcado, sem tela para marcá-lo até hoje), a resposta não
é código — é uma pergunta para o negócio.

---

## 8. O que custa é a fila, não o tamanho

Rodada de velocidade, 21/09/2026. Instrumentei o servidor com dois
`console.log` antes de mexer em qualquer coisa, e o número desmontou a hipótese
da seção 3:

```
   60–100ms   uma consulta, de 1 linha ou de 383 — quase não muda
      132ms   nove consultas em PARALELO
      520ms   as mesmas nove em SÉRIE
```

Pelo fio cada tela manda de 13 a 46 KB. Cortar colunas ou linhas não move o
relógio; **tirar uma espera da fila move**.

As esperas que existiam, e nenhuma delas precisava existir:

- Toda página lia o perfil (`getUser` + `select`, ~90ms em série) e **só
  depois** pedia os dados. Agora as consultas saem primeiro e o perfil é lido em
  paralelo. A guarda de acesso não afrouxou: o `redirect` continua antes de
  qualquer dado chegar à tela.
- A esteira encadeava quatro idas: perfil → o id do status → as etapas com esse
  id → o resto. As duas do meio viraram uma, com `!inner` do PostgREST. **Toda
  consulta que só existe para alimentar o `where` da próxima é um `!inner`.**

Resultado, mediana de 7 passadas: 406ms → 375ms no geral, e a esteira 442ms →
366ms. O pior caso, que é o que o usuário chama de "às vezes trava", saiu de
567ms para menos de 500ms.

**O que isso diz:** a intuição de otimização quase sempre aponta para volume —
menos linhas, menos colunas, menos bytes. Aqui o volume era irrelevante e a
topologia era tudo. A pergunta certa não é *"o que dá para diminuir?"*, é
**"o que está esperando o quê, sem precisar?"**.

---

## 9. Medição de uma amostra só não compara nada

O `medir-navegacao.mjs` media cada tela **uma vez** por execução. Rodando três
vezes seguidas na mesma build: mediana de 485ms, 360ms e 380ms. O ruído da
internet até o Supabase era maior que qualquer ganho que se fosse medir — dava
para "provar" melhora ou piora só escolhendo a execução.

**O que ficou:** o script repete (`--vezes 7`, padrão 5), descarta a primeira
passada (que paga o aquecimento) e tira a **mediana por tela**, mostrando
também o pior caso. Só depois disso o antes-e-depois virou comparação.

**O que isso diz:** é a seção 2 outra vez, um nível acima. Lá o erro era medir a
coisa errada; aqui era medir a coisa certa **uma vez só**. Antes de comparar
duas versões, rode a medição duas vezes na *mesma* versão: se os números não
baterem entre si, ainda não dá para comparar nada.

---

## 10. Escrever o que foi recusado vale mais que escrever o que foi feito

Das ideias desta rodada, quatro foram medidas e descartadas: `getClaims()` no
middleware, cache das tabelas de apoio entre requisições, adiar o carregamento
dos arquivados e `<Suspense>` por consulta. Três delas estavam em documento
como "próximo passo" — inclusive aqui, na seção 3.

Sem registrar a recusa **com o número**, a próxima sessão refaz o trabalho e
chega na mesma parede. O `docs/otimizacao-de-carregamento.md` tem uma seção §5
só para isso, e ela é a parte mais útil do arquivo.

**O que isso diz:** documentação de otimização que só lista vitórias é um mapa
sem os penhascos marcados.
