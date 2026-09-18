# Notas de versão

Uma seção por rodada, a mais recente no topo. Escrito para quem usa o sistema.

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
