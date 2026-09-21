# Notas de versão

Uma seção por rodada, a mais recente no topo. Escrito para quem usa o sistema.

---

## 21/09/2026 — rodada de velocidade

### Em todas as telas

- **As telas param de esperar por elas mesmas.** O sistema perguntava "quem é
  esse usuário?" e só *depois* ia buscar os dados da tela — 90ms de banco
  parado em toda navegação. Agora as duas coisas acontecem ao mesmo tempo.
  Quem vê o quê não mudou em nada: o bloqueio de acesso continua acontecendo
  antes de qualquer dado aparecer.
- **Listas longas aparecem por partes.** Clientes, fundos, operações, etapas,
  esteira, cartões do funil e tarefas mostram as primeiras 40 linhas na hora e
  vão completando conforme você rola — sem clique, sem espera. Buscar e filtrar
  continuam valendo sobre a lista inteira: procurar um cliente que está na
  linha 800 acha do mesmo jeito.
- Quem navega por teclado tem um botão **"Mostrar mais"** no fim da lista, com
  a contagem do que falta.

### Esteira de Estruturação

- **A tela mais lenta virou a mais rápida.** Ela fazia quatro perguntas ao
  banco uma depois da outra, cada uma esperando a resposta da anterior. Duas
  viraram uma só, e as outras passaram a correr juntas. De 442ms para 366ms,
  e nos piores momentos de 567ms para menos de 500ms.

### Funil de Clientes

- **A aba Tarefas só é montada quando você abre.** Antes o calendário do mês e
  os oito grupos de tarefas eram desenhados junto com o quadro, mesmo em quem
  nunca abre essa aba. Depois de aberta uma vez, continua tudo como era:
  trocar de aba não recarrega nem perde busca e filtro.

### Bastidores

- Novo guia: `docs/otimizacao-de-carregamento.md` — de onde vem o tempo, como
  medir, o que foi feito e, principalmente, **as cinco ideias que foram medidas
  e descartadas**, para ninguém gastar o dia de novo nelas.
- `scripts/medir-navegacao.mjs` agora repete a medição e tira a mediana
  (`--vezes 7`). Uma medição só não servia para comparar nada: a mesma versão,
  medida três vezes seguidas, dava 485ms, 360ms e 380ms.
- Conferido de novo e descartado de novo: trocar a conferência de sessão do
  middleware por uma verificação local não economiza tempo nenhum (372ms contra
  375ms) e custaria a revogação de sessão pelo servidor.

### Onde chegamos

Mediana das quatro telas, da primeira visita até o dado na tela: **406ms →
375ms**. O desenho da tela continua respondendo em ~100ms. O que sobra agora é
ida e volta ao Supabase, não espera boba — para melhorar muito além disto seria
preciso aproximar o banco do servidor, o que não se justifica com o tamanho
atual da base.

---

## 18/09/2026 — rodada QOL, parte 4

### A casca do sistema

- **Quem está usando foi para a barra de cima**, à esquerda: bolinha com as
  iniciais, nome e cargo. Saiu da barra lateral, onde disputava espaço com os
  itens do menu.
- **A barra lateral não corta mais.** Antes a janela inteira rolava e a lateral
  ficava presa no meio do caminho, com um vão branco em cima. Agora ela vai de
  ponta a ponta em qualquer tela, rolada ou não — quem rola é só a área de
  conteúdo.

### Funil de Clientes

- **A barra de rolagem do quadro fica na base da janela**, à mão. Antes o quadro
  crescia com a coluna mais alta e era preciso descer até o fim de tudo para
  achar a barra. Cada coluna rola por dentro quando tem cartão demais.
- No celular nada disso vale: lá a página rola como sempre rolou, porque prender
  o quadro numa faixa de 400px seria pior.

### Esteira de Estruturação

- Confirmado na tela: escolher **CRA** abre Securitizadora, DTVM, Agente
  Fiduciário e Custodiante; **Debêntures** abre Emissor, Estruturador, Agente
  Fiduciário e DTVM; **FIDC/FIAGRO/FII/SLB** abre Gestor, Administrador, DTVM e
  Assessoria Legal — e a lista de instrumentos mostra só os oito que vão para a
  esteira.

---

## 18/09/2026 — rodada QOL, parte 3

### Funil de Clientes

- **O cartão agora abre numa caixa 4:3**, ocupando ~70% da tela — mais larga que
  alta, em vez da tela inteira. Continua mostrando tudo sem barra de rolagem.
- **Os quatro botões da coluna passaram a funcionar**, e nenhum fazia o que
  promete:
  - as **setas** trocam a coluna de lugar com a vizinha (antes o banco
    arredondava a posição e a coluna caía em cima da outra);
  - o **ícone de caixa** mostra os **arquivados daquela coluna** — é o que ele
    faz no funil original. A coluna muda de cara para dizer em que vista está;
  - o **✕** agora pergunta antes, com a contagem de cartões na frente. Antes
    excluía calado e os cartões sumiam do quadro sem jeito de voltar.
- **Cor da tag é livre**: o quadradinho mostra a cor atual e abre o seletor do
  navegador, com todas as cores.
- **Tag pode ser desativada**: some dos filtros e do cartão **sem perder o
  histórico**. Excluir, esse sim, tira a tag de todos os cartões.

### Conta

- **A tela de trocar senha existe.** O botão "Senha" da barra apontava para uma
  rota que nunca foi escrita — dava 404 para qualquer um que clicasse.

### Quem vê o quê

- **Indicante, em Clientes**: vê os clientes em que está em "quem visualiza"
  **e** os que ele mesmo cadastrou. A segunda metade não era possível antes — o
  sistema não guardava quem cadastrou (passa a guardar a partir de agora; os 51
  clientes que vieram da carga ficam sem autor e seguem pela regra antiga).
- **"Puxar do funil" parou de mostrar a carteira inteira** ao indicante: agora
  só os cartões em que ele está como usuário.
- **Fornecedor, Operação e Esteira** já estavam bloqueadas para o indicante,
  tanto no menu quanto no servidor — conferido.

### Bastidores

- Voltou atrás na guarda de sessão em cache: dava para misturar dados de sessões
  diferentes para economizar ~80ms. Não compensa.

---

## 18/09/2026 — rodada QOL, parte 2

### Menu lateral

- **Quem está usando aparece no alto**: bolinha com as iniciais do nome (Maicon
  Farina vira MF), nome ao lado e o cargo embaixo, menor e em itálico. A
  bolinha é o lugar da foto do Google, para quando o login por Google entrar.

### Funil de Clientes

- **"Novo cartão" já cria o cartão.** Antes o cartão só nascia ao salvar: fechar
  o diálogo sem querer no meio de uma reunião levava junto o que tinha sido
  digitado. Agora ele existe desde o clique, grava sozinho, e cartão que não
  serviu se exclui pelo próprio diálogo.
- **O cartão abre em tela cheia**, com os campos curtos numa coluna e parecer e
  histórico lado a lado — tudo à vista, **sem barra de rolagem** (conferido em
  1920×1080, 1440×900 e 1366×768).
- **"Tags" e "Colunas no fluxo" passaram a funcionar.** Tags: criar, renomear,
  trocar a cor, excluir. Colunas: tirar do fluxo — a coluna some do quadro e
  **nenhum cartão se perde** — e renomear.
- **Cinzas mais leves no tema claro**: coluna quase branca, cartão branco com
  borda sutil. O tema escuro não mudou.

### Esteira de Estruturação

- **O campo "Instrumento" agora oferece só os oito que vão para a esteira** —
  CRA, CRI, CR, FIDC Proprietário, FIAGRO, FII, SLB e Debêntures. Listava os 31
  tipos de operação, incluindo M&A, Câmbio e Vendor, que não têm estruturação
  para acompanhar ali.
- Os campos que aparecem depois continuam mudando conforme o instrumento, como
  já era: CRA/CRI/CR pede Securitizadora, DTVM, Agente Fiduciário, Custodiante;
  Debêntures pede Emissor, Estruturador, Agente Fiduciário, DTVM;
  FIDC/FIAGRO/FII/SLB pede Gestor, Administrador, DTVM, Assessoria Legal.

### Velocidade

- **Uma ida à rede a menos em toda navegação.** O sistema perguntava ao Supabase
  "quem é esse usuário?" a cada requisição, antes de a página começar; agora a
  assinatura do acesso é conferida na hora, sem sair do servidor.
- **O cadastro de quem está logado fica 60s guardado** em vez de ser consultado
  a cada tela.
- Medido em build de produção: o conteúdo chega em ~358ms, contra 377ms. O
  ganho grande continua sendo o de antes — a tela responde em ~100ms em vez de
  ficar parada. O que sobra é o tempo de ida e volta ao banco (~80ms por
  consulta), e não o tamanho do que trafega: cada tela manda entre 12 e 40 KB.

### Pendente, precisa de decisão

- ⚠️ **Produção continua fora do ar** até `NEXT_PUBLIC_SUPABASE_ANON_KEY` entrar
  no projeto da Vercel.
- Otimizar as consultas de cada página ficou para a próxima rodada.

---

## 18/09/2026 — rodada QOL

### Funil de Clientes

- **Aba nova: Tarefas.** O funil agora tem duas abas — Quadro e Tarefas. A de
  tarefas mostra o que está **vencido**, o de **hoje**, **esta semana**, **este
  mês**, **próximo mês**, **depois** e **sem prazo**, cada grupo com contagem.
  As concluídas ficam recolhidas no fim.
- **Calendário do mês, clicável.** Dia com tarefa ganha ponto — vermelho quando
  há vencida, amarelo quando está em dia. Clicar no dia filtra a lista ao lado.
- **Tarefa dentro do cartão.** Cada cartão tem seu bloco de tarefas: criar,
  concluir e excluir sem sair do cartão e sem precisar salvar o cartão.
- **Toda tarefa pertence a um cartão** — não existe tarefa solta. Prazo é data,
  com hora opcional (reunião às 15h).
- **Cartão vira cliente.** Ação no cartão cadastra o cliente puxando seis
  campos: razão social, diretor/gerente, faturamento anual, atividade, parecer e
  indicante. Se o cartão já virou cliente, a ação passa a levar até ele.
- **O caminho inverso também existe:** no cadastro de um cliente novo, o seletor
  "puxar do funil" preenche esses mesmos seis campos a partir de um cartão.
- **Nome repetido não passa em silêncio.** Se já existir cliente com o mesmo
  nome, a tela avisa e deixa você escolher: ligar ao que existe, ou criar um
  segundo cadastro.

### Operação

- **Campos que faltavam:** Destino do recurso, Mandato assinado com o fundo e o
  toggle **Estruturação em Andamento** — é ele que manda a operação para a
  esteira.
- **Rótulos corrigidos** para os de produção: "Com fee", "NDA assinado com o
  Cliente", "Mandato assinado pelo cliente".
- **Faturamento anual virou campo livre** — era somente leitura.
- **Declinados em tabela própria**, abaixo da principal: as etapas com "já
  cliente do fundo", "declinado pelo fundo" e "declinado pelo cliente" saem da
  lista de cima e aparecem embaixo, com a legenda explicando.
- **"Na mão de" mostra o texto inteiro.** Antes cortava com reticências; agora
  quebra linha, e a edição é campo de várias linhas.

### Esteira de Estruturação

- **Lista só o que está de fato em estruturação** — duas operações, como no app
  antigo. Antes trazia tudo. Entra quem tem o toggle marcado **e** cliente com
  etapa em "contrato assinado".

### Fornecedor

- **Fundos habilitados viram tags clicáveis** na matriz de tipos de operação,
  uma por fundo, cada uma abrindo o cadastro daquele fundo. Antes era texto
  corrido cortado em uma linha.

### Em todas as telas

- **Escolher um valor não abre mais uma tela por cima.** Os campos de seleção
  agora abrem um menu ancorado no próprio campo, com busca quando a lista é
  grande (31 tipos de operação, 73 fundos) e teclado completo: setas, Enter,
  Esc. Dentro de tabela e dentro de diálogo também.
- **As telas respondem na hora.** Antes a tela anterior ficava parada de um
  terço a meio segundo sem sinal nenhum; agora o desenho da tela aparece em
  ~100ms e o conteúdo entra por cima. O tempo do dado é o mesmo — o que mudou é
  não ficar no escuro.
- **Campo de texto longo com respiro.** Parecer, histórico e observação tinham o
  texto colado na borda de cima.
- **Movimento.** Diálogo entra e sai com transição, troca de tela também, e a
  barra de carregamento tem brilho. Tudo curto (120–180ms), e desligado para
  quem pede menos movimento no sistema operacional.

### Bastidores

- Banco: `006` (tarefas do funil, cartão ligado a cliente) e `007` (índice da
  esteira), as duas aplicadas.
- QA interno: 42 passos nas três formas (claro, escuro, celular), agora em
  paralelo — de ~4 minutos para 30 segundos.
- O esqueleto de carregamento estava se passando por conteúdo no QA: os passos
  passavam fotografando a tela em branco. Corrigido — foi assim que a lista da
  esteira apareceu errada numa captura.

### Pendente, precisa de decisão

- **Produção fora do ar até alguém colocar `NEXT_PUBLIC_SUPABASE_ANON_KEY` no
  projeto da Vercel.** O build passa; o app cai em toda requisição sem essa
  variável.
- **Botão "Senha" da barra superior dá 404** — a tela `/conta/senha` nunca foi
  escrita. Ou ela existe, ou o botão sai.
- **Toggle de estruturação:** 3 das 14 operações estão marcadas, e o toggle só
  passou a existir na tela agora. Vale revisar quais operações estão de fato em
  estruturação.
- **RLS continua desligada** (`db/003_rls.sql` escrito, não aplicado). Precisa
  entrar antes de dado real de cliente.
- **Sem conferência visual:** a tabela de declinados e o "Na mão de" longo — o
  QA não rola o diálogo até lá. Caso de teste indicado: operação "FIDC Prop /
  Sementes Veneza", 15 etapas, 6 declinadas.
