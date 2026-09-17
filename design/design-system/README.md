## A regra que manda em tudo

**Você herda o arranjo. Você não redesenha as telas.**

Este produto está em produção e é usado todo dia. A migração troca a tecnologia e a aparência —
cor, tipografia, espaçamento, raio, sombra, ícone, foco, chip, componente. **Não troca onde as
coisas ficam.** Em concreto:

- **Não invente página.** O produto tem as telas que tem: Funil de Clientes, Cliente, Fornecedor,
  Operação (abas Cliente, Fornecedor e Status), Esteira de Estruturação e Respostas de formulário.
  Nada de dashboard, home, onboarding, relatório, perfil ou tela de ajuda que não exista hoje.
  **Nenhuma tela é criada, removida, fundida ou dividida** a não ser que seja pedido.
- **Não invente campo, coluna, aba, botão nem seção**, e não tire nenhum. O inventário de cada
  tela e de cada diálogo está nas seções **Telas** e **Diálogos**, e é fechado.
- **A ordem da navegação é exatamente a de produção:** Funil de Clientes · Cliente · Fornecedor ·
  Operação · Esteira de Estruturação. A navegação é **lateral**, não horizontal. Não reordene,
  não reagrupe, não acrescente item.
- **A disposição dos elementos segue as capturas.** Onde cada campo fica, quantas colunas o
  diálogo tem, o que fica ao lado de quê, a largura da lista contra a área principal, a proporção
  das colunas, a ordem das abas, a ordem das ações dentro da linha — tudo isso vem da captura da
  tela em produção.
- **Os textos são literais.** Rótulos, títulos, placeholders e mensagens saem exatamente como
  estão hoje, **inclusive onde há erro de grafia ou espaço sobrando** ("Painel Admnistrativo",
  "Arquivados ", "Salvar ").

Quando este documento parecer convidar a melhorar alguma coisa, ele não está. Se um arranjo
parecer ruim, **anote como observação e desenhe do jeito que está.** Duas exceções, e só duas:
a lista curta de defeitos do original, que precisa de confirmação antes; e a troca do amarelo pelo
âmbar em "paralisado", já autorizada.

Quando a captura e um documento divergirem: **a captura vence no arranjo, o documento vence no
conteúdo.** As divergências já encontradas estão anotadas uma a uma na seção Telas.

## O produto

Sistema interno de estruturação de operações de crédito. Uso diário e intenso,
**desktop-first**, alta densidade, dez a vinte pessoas. Herda o sistema visual da Lure;
a base é preto e branco, e a cor pontua.

A hierarquia do produto é **Cliente → Operação → Etapa (uma por fundo) → Checklist de
documentos**. Uma operação corre em vários fundos ao mesmo tempo, e comparar esses fundos
lado a lado é o valor da ferramenta — por isso a tabela densa é o componente que mais
importa aqui.

## Fundamentos de conteúdo

Escreva em **português do Brasil**, na segunda pessoa direta, sem emoji e sem exclamação.
O tom é o de uma ferramenta de trabalho: nomeie a coisa e siga.

- **Rótulo de botão é verbo no infinitivo**: "Cadastrar", "Salvar", "Deletar", "Arquivar".
  Um rótulo por estado — "Cadastrar" quando é novo, "Salvar" quando é edição, nunca os dois.
- **Título de tela é substantivo**: "Detalhes da operação", "Funil de Clientes",
  "Esteira de Estruturação".
- **Cabeçalho de coluna em caixa alta** pelo estilo `column-label`, nunca escrito em maiúsculas
  no conteúdo — o `text-transform` faz o trabalho e o leitor de tela recebe o texto normal.
- **Mensagem de erro diz o que falhou e o que não mudou**: "A consulta falhou. Nada foi
  alterado." Código de erro cru não chega a quem usa.
- **Confirmação destrutiva nomeia o registro e a consequência**: "Tem certeza que deseja
  deletar o cliente **{nome}**? Essa ação é permanente e não pode ser revertida."
- **Vazio nunca é silencioso**: diga quantos itens o filtro esconde e ofereça a saída.

**Formatação brasileira, sem exceção:** datas `dd/mm/aaaa` (e `dd/mm` em coluna estreita),
moeda `R$ 1.234,56`, milhar com ponto e decimal com vírgula.

**Cuidado com os campos de valor.** Faturamento anual, estimativa, margem líquida, passivo
oneroso, ativos, volume e demanda são **texto livre** no banco — chegam como "R$ 2MM",
"2.000.000", "dois milhões". Não alinhe esses campos à direita, não aplique máscara e não
assuma casas decimais. Só o que é número de verdade vai em `font-mono` com
`font-variant-numeric: tabular-nums`.

## Fundamentos visuais

### Cor

A base é preto e branco: `bg` atrás, `surface` nos cartões e tabelas, `surface-sunken` no
cabeçalho de tabela e nos campos calculados, `border` separando, `text` escrevendo. Tudo isso
tem par no tema escuro — **entregue os dois temas sempre**.

**Ação é amarelo.** `accent` (`#ffdd00`) preenche o botão primário, o item de menu da página
atual e a faixa de destaque, sempre com `accent-on` (preto) por cima. Branco sobre o amarelo dá
1,35:1 e está proibido. Quando o amarelo precisa ser **texto, ícone ou borda**, use `accent-ink`:
escurecido no claro, amarelo puro no escuro.

**Foco é ciano.** `focus-ring`, 2px de outline com 1px de offset, um anel só em todo o sistema —
botão, link, campo, seletor, célula editável.

A **paleta de marca** é policromática de propósito: `brand-yellow`, `brand-cyan`,
`brand-magenta`, `brand-green`, `brand-olive`, `brand-purple`, `brand-wine`, `brand-green-dark`.
Cada uma tem `-ink` (para texto sobre claro) e `-on-dark` (para texto sobre escuro). Elas servem
para **status e categoria, nunca para recolorir a marca**.

**Cor nunca é o único sinal.** Todo status carrega rótulo escrito ao lado do ponto colorido —
é o que faz `StatusChip` exigir `label`.

### Tipografia

**Archivo** 400–900 em toda a interface; **IBM Plex Mono** em número, data, identificador, CNPJ e
valor. Ambas vêm do Google Fonts — não há arquivo de fonte neste sistema.

Use os estilos nomeados em vez de tamanhos soltos: `page-title` e `section-title` (22/28, 800),
`detail-name` (16/22, 700), `form-body` (14/20), `table-body` (13/18), `table-first-col` (13/18,
600), `column-label` (11/16, 600, caixa alta), `field-label` (12/16, 600), `chip-label` (11/16,
600). Os estilos de **Mono** e de **Telas públicas** cobrem o resto. O grupo **Escala** é a régua
crua: consulte, mas componha com os de Interface.

Coluna numérica sempre com `tabular-nums`, senão os dígitos dançam de linha em linha.

### Espaçamento, raio e densidade

Base 4px (`space-*`, com 2px e 4px como sub-degraus para folga dentro de controle). Raio
`radius-sm` 2px em campo dentro de tabela, `radius-md` 4px como padrão, `radius-lg` 6px em
cartão e diálogo, `radius-pill` só em chip e avatar.

Densidade é fixa, não responsiva: linha de tabela `row-h-compact` 32px — `row-h-cozy` 44px só
quando há avatar, duas linhas de texto ou par realizado/orçado. Controles em `control-h-sm` 28px
(filtro de coluna), `control-h-md` 34px (padrão) e `control-h-lg` 40px (login e telas públicas).
App bar `app-bar-h` 56px, sub-navegação `subnav-h` 40px, cabeçalho de tabela `table-header-h`
36px, chip `chip-h` 20px, ação dentro de linha `row-action-h` 24px.

### Borda, sombra e camada

**A hierarquia se faz com `border` e `surface-sunken`, não com sombra.** `shadow-none` é o padrão
de cartão e de tabela. `shadow-md` no menu suspenso, `shadow-overlay` no diálogo sobre o overlay
`rgba(0,0,0,.45)` — e só. As larguras de borda são `border-w` 1px, `border-w-strong` 2px (o anel
de foco), `border-w-accent` 3px (faixa de etapa no cartão) e `border-w-tab` 5px (aba ativa).
Empilhamento pelos tokens `z-dropdown` · `z-sticky` · `z-modal` · `z-toast`.

### Estados obrigatórios

Toda tela desenha os quatro: **vazio** (`EmptyState` — símbolo, título, contagem do que o filtro
esconde, botão de saída), **carregando** (`LoadingSkeleton` — blocos de 12px em `skeleton`),
**erro** (`NoticeCard tone="danger"` com "Tentar de novo") e **sem permissão**
(`NoticeCard tone="neutral"` dizendo o papel do usuário e quem libera).

Dois vazios do original continuam **sumindo** em vez de virar estado vazio: a lista de e-mails do
cliente e o bloco "Arquivados " quando a contagem é zero.

### Níveis de acesso

Dois papéis: **master** vê tudo; **indicante** vê só Funil e Clientes, e dentro de Clientes só os
vinculados a ele. Para o indicante somem Esteira, Operação e Fornecedor do menu, o botão
Configurações, os blocos "Arquivados ", a aba Status e a aba Fornecedor, as colunas de ação da
tabela de etapas e o nome em "quem visualiza". O seletor de declínios fica **desabilitado, não
escondido** — use `Field disabled`, que aplica `opacity-disabled`.

Desenhe os dois estados de cada tela compartilhada. Nenhum componente daqui conhece nível de
acesso: quem monta a lista é o consumidor.

## Iconografia

**Este sistema ainda não tem conjunto de ícones.** Os protótipos de origem usam ícones do próprio
Bubble, que não vieram no repositório; as previsualizações deste sistema desenham as ações de
linha com glifos Unicode como marcador temporário, e isso **não é a iconografia definitiva**.

Enquanto o conjunto não é decidido, valem as regras que já existem:

- Ícone de ação dentro de linha tem `row-action-h` (24px) e **sempre** `aria-label` mais `title`.
- No hover o ícone troca para a variante preenchida — é o comportamento do original.
- Ícone que carrega significado precisa de 3:1 contra o fundo, como qualquer marca informativa.
- **O símbolo da marca não é ícone.** Use `Logo` ou `Symbol`, nunca o "+" da marca como sinal de
  adicionar.

## Acessibilidade

Piso **WCAG AA**: 4,5:1 para texto, 3:1 para texto de 24px ou mais, para borda de controle, anel
de foco, ícone e qualquer marca que carregue significado — **nos dois temas**. Foco sempre
visível. Cor nunca sozinha.

Três pares vêm da fonte original abaixo do piso. Ficam **exatos**, porque são a marca em produção;
o que muda é onde você pode usá-los:

| Par | Medida | O que fazer |
|---|---|---|
| `text-muted` sobre `bg`, `surface-sunken` e `surface-hover` (claro) e sobre `surface-hover` (escuro) | 4,23:1 · 3,86:1 · 4,01:1 · 4,26:1 | Só sobre `surface` (4,61:1). Fora daí — cabeçalho de coluna em `surface-sunken`, zero apagado em linha sob hover — troque por `text-secondary`, que dá 5,6:1 ou mais em qualquer fundo. |
| `focus-ring` no tema claro | 2,27:1 sobre `surface` | O anel só passa no piso de 3:1 no tema escuro. No claro, acompanhe o anel de uma mudança de borda (`border-w-strong` em `text`) para que o foco não dependa só do ciano. |
| `border-strong` como borda de botão secundário | 1,74:1 sobre `surface` | Não deixe a borda ser o único sinal de que aquilo é clicável: o botão secundário fica sobre `surface` com rótulo em `text` (17,9:1), e o hover muda o fundo. |

Resolver os três de verdade significa alterar valores de marca — é decisão do dono do sistema,
não deste arquivo.

## O que ainda não está aqui

- **A assinatura do app_capital.** Os oito arquivos em `assets/Marca/` são a marca do Lure CRM
  (símbolo preto com miolo amarelo, chip "CRM"). A aplicação em produção assina
  "LURE ✛ CAPITAL" com o símbolo **policromático** e ®. O vetor dessa versão não está no
  repositório e **não foi reconstruído** — `Logo` continua com o símbolo do CRM até o arquivo
  chegar.
- **Quatro diálogos ainda sem captura:** operação, usuário, painel administrativo e os curtos
  (troca de senha, exclusão, adicionar e-mail). O que a seção Diálogos traz deles vem do documento
  de design e precisa de conferência contra a tela. As cinco telas, o diálogo de cliente, o de
  fornecedor, o da esteira e os do funil já foram lidos das capturas — ver as seções **Telas** e
  **Diálogos**.
- **Oito componentes específicos do produto**: célula com duas formas (texto ⟷ campo) com edição
  por linha · item de checklist (rótulo + % + slider + observação) · bloco condicionado por
  seletor · seletor múltiplo sobre 31 tipos · kanban com arraste de cartão e de coluna · bloco
  "Arquivados " recolhível · painel de quatro colunas de status com soma no rodapé · e o
  tratamento dos 31 tipos de operação.
- **Quatro decisões de cor** ainda abertas: o agrupamento dos 14 status da etapa (os sete tokens
  `st-etapa-*` são a proposta da §8, a confirmar), a escala dos 4 status de cliente, a dos 4 de
  fornecedor e a dos 4 de operação.
