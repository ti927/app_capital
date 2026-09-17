# Prompt para o Claude Design — app_capital (Lure Capital)

> Cole este texto no Claude Design. Os materiais estão em `design/` neste repositório.

---

## 0. A regra que manda em tudo

**Você herda o sistema visual. Você não redesenha as telas.**

O app_capital é a reconstrução de um app Bubble (`planilha-lurecapital`) que está em produção e é
usado todo dia. A equipe conhece essas telas de cor. A migração troca a tecnologia e a aparência —
**não** troca onde as coisas ficam.

| | |
|---|---|
| **Muda** | cores, tipografia, espaçamento, raio, sombra, ícones, estados de foco e hover, chips, componentes — tudo vem do design system Lure |
| **Não muda** | quais telas existem, quais elementos há em cada uma, a ordem e a disposição deles, os textos dos rótulos e botões, as colunas das tabelas e sua ordem, o que aparece e some conforme o nível de acesso |

Quando este documento parecer convidar a melhorar alguma coisa, ele não está. Se você achar que
um arranjo está ruim, **anote como observação e desenhe do jeito que está**. A única exceção é a
lista curta de defeitos na §11, e mesmo ela precisa de confirmação antes.

---

## 1. O que é o produto

Um sistema interno de **estruturação de operações de crédito**. A Lure Capital aproxima uma
empresa que precisa de dinheiro (**cliente**) de um fundo, securitizadora ou banco que tem o
dinheiro (**fornecedor**), e conduz a **operação** até o contrato assinado.

**Hierarquia:** Cliente → Operação → Etapa (uma por fundo) → Checklist de documentos. Uma operação
corre em vários fundos ao mesmo tempo; comparar esses fundos lado a lado é o valor da ferramenta.

Uso diário e intenso, **desktop-first**, alta densidade. Dez a vinte pessoas.

**Não confundir com o Sistema de Gestão Lure** (`app.lureconsultoria.com`, 9 módulos, ~45–50
usuários). São produtos irmãos, mesma família visual, escopos diferentes. O material do Sistema
Lure está aqui como **base de design a herdar**, não como referência de escopo.

---

## 2. Materiais

| Arquivo | Para quê |
|---|---|
| `design/sistema-lure/tokens/lure-crm-tokens.css` | **a base**. Cores, tipografia, espaçamento, raio, sombra. Valores finais |
| `design/sistema-lure/tokens/lure-sistema-tokens.css` | extensão de status do produto irmão. Adote as correções que ela traz (`--warning` é âmbar, não amarelo; `--surface-hover` mais visível) e siga o mesmo formato ao criar os status daqui |
| `design/sistema-lure/README.md` | handoff do irmão. **Leia "Componentes transversais" e reuse literalmente**: tabela densa, chip, botões, diálogos, grade, estados obrigatórios. As seis regras de filtro de coluna vieram de defeito real em produção — não as redescubra |
| `design/sistema-lure/Sistema Lure - Fundação.dc.html` | canvas de artboards do irmão. Referência visual dos componentes montados |
| `design/assets/*.svg` | símbolo, favicon, assinatura. Finais |
| `design/components/*.html` | header, footer, login, logo — protótipos de referência |

**Marca-mãe** (Guia BR/BAUEN, 106 páginas, fora do repo por tamanho). O essencial já está nos
tokens; o que importa saber:

- o símbolo é o **"+" que também vira "×"** — *somar e multiplicar* — acrônimo de
  **LU**cro + **RE**ntabilidade;
- a marca é **policromática** de propósito: o guia diz que fixar um Pantone único inviabilizaria
  o projeto;
- entre as muitas cores, **amarelo** é a escolhida para composição chapada ao lado do preto, e
  **azul** pontua detalhes — exatamente o que os tokens codificam como `--accent` e
  `--focus-ring`;
- a tipografia do logotipo é **Akkurat Bold**, com **FLAMA** e **Farnham** de apoio. Nenhuma está
  disponível para web; o design system substituiu por **Archivo**. Mantenha Archivo — a
  substituição já está decidida e em produção.

---

## 3. Sistema visual

- **Base:** preto/branco. `--bg #f5f5f5` · `--surface #fff` · `--surface-sunken #ebebeb` ·
  `--border #dcdcdc` · tinta `--text #171717`. **Entregue claro e escuro.**
- **Ação = amarelo `#ffdd00`** com texto **preto**. Nunca como cor de texto sobre claro — aí use
  `--accent-ink #7a6600`.
- **Foco = ciano `#0abaee`**, 2px, offset 1px, anel único em todo o sistema.
- **Paleta de marca (imutável):** amarelo, ciano `#0abaee`, magenta `#e5007d`, verde `#00973a`,
  oliva `#7aa42c`, roxo `#5c2482`, vinho `#6f163a`, verde-escuro `#118937`. Cada uma com `-ink`
  (AA ≥ 4.5:1) e `-on-dark`. Servem para status e categoria, nunca para recolorir a marca.
- **Tipografia:** Archivo 400–900; IBM Plex Mono em números, datas, identificadores e valores.
  Coluna numérica com `font-variant-numeric: tabular-nums`.
- **Densidade:** corpo de tabela 13px, formulário 14px; linha compacta 32px, confortável 44px;
  controles 28/34/40px; app bar 56px. Base 4px. Raio 2/4/6px.
- **Símbolo:** "+" em 5 blocos, miolo amarelo. Braços nunca coloridos. Mínimo 16px.

**Acessibilidade AA:** contraste, foco visível, nunca cor como único sinal — sempre rótulo + cor.

**Formatação brasileira:** datas `dd/mm/aaaa`, moeda `R$ 1.234,56`.

> **Cuidado com os valores.** Faturamento anual, estimativa, margem líquida, passivo oneroso,
> ativos, volume e demanda são **texto livre** no banco, não número. Vêm como "R$ 2MM",
> "2.000.000", "dois milhões". Não desenhe assumindo alinhamento à direita nem casas decimais.

---

## 4. Níveis de acesso

| Nível | Vê |
|---|---|
| **master** | tudo |
| **indicante** | só Funil e Clientes, e dentro de Clientes só os vinculados a ele |

Para o indicante somem: Esteira, Operação e Fornecedor no menu; o botão "Configurações" no header;
os blocos "Arquivados" em todas as listas; a aba Status e a aba Fornecedor na tela de Operação; as
colunas de ação da tabela de etapas; o nome em "quem visualiza" na lista de operações. O seletor
de declínios fica **desabilitado**, não escondido.

Desenhe os dois estados de cada tela compartilhada.

---

## 5. A casca

**Header** (reusable `header`, presente em toda tela interna). Da esquerda para a direita:

1. logo
2. ícone que só aparece para indicante (largura mínima 30px)
3. à direita, nesta ordem: **Configurações** (texto + ícone, oculto para indicante) ·
   **troca de senha** (ícone de cadeado) · **sair** (ícone de saída, título "Sair")

Hover em "Configurações" escurece levemente o fundo. Os ícones trocam para a variante preenchida
no hover.

**Menu lateral** (reusable `MenuNavegação`, grupo flutuante). Cinco itens, **nesta ordem exata**:

1. **Funil de Clientes**
2. **Esteira de Estruturação** — oculto para indicante
3. **Operação** — oculto para indicante
4. **Fornecedor** — oculto para indicante
5. **Cliente**

Cada item é ícone + rótulo. Item da página atual: fundo cheio na cor de destaque, texto e ícone em
contraste. Hover nos demais: fundo cinza claro. Para o indicante o grupo alinha ao topo
(`flex-start`) e sobram dois itens.

**Painel administrativo** (Popup, abre em "Configurações"), na ordem:

1. título "Painel Admnistrativo" *(sic — grafia do original)*
2. botão "Adicionar Maicon a todos os clientes" — ver §11
3. bloco recolhível **"Acesso às páginas"**, fechado por padrão → tabela de 4 linhas (uma por
   página), colunas: **Página | Nível de Acesso | Usuários**. Nível e Usuários são seletores
   múltiplos; o de usuários mostra o e-mail
4. bloco recolhível **"Usuários"**, fechado por padrão → botão "Novo Usuário" (abre formulário
   embutido com Email, Cargo, Senha, e os botões "Salvar " / "Cancelar") e tabela com colunas
   **Nome | Nível de Acesso | Email | Senha**

**Diálogo de usuário** (separado): Nome · Nível de Acesso *(obrigatório)* · CPF · Telefone ·
parceiro vinculado *(placeholder "Escolha o parceiro")* · razão social · CNPJ · Região · e-mail.
Botão "Salvar" quando é edição, "Criar" quando é novo — nunca os dois.

**Diálogo de troca de senha:** título "Troca de Senha", campos Email (preenchido com o do usuário),
"Senha atual ", "Nova senha", botão "Salvar".

---

## 6. As telas

Sete telas. Textos entre aspas são literais do original — reproduza, inclusive onde há erro de
grafia ou espaço sobrando.

### 6.1 Login (`index`)

Única tela sem header e sem menu.

- Bloco **Login**: "Bem vindo de volta!" / "Faça login na sua conta"; campo **Email** (ícone +
  input, placeholder `voce@exemplo.com`); campo **Senha** (ícone + input, placeholder `*********`);
  "Esqueceu a senha? " *(oculto no carregamento)*; botão **"Log in"**; rodapé
  "Ainda não tem uma conta? Sign Up" *(oculto no carregamento)*.
- Bloco **Sign Up** *(oculto no carregamento)*: "Comece agora!" / "Crie uma nova conta:"; campos
  Email e Senha; botão **"Sign Up"**; rodapé "Já tenho uma conta? Login".
- **Logo** com animação de flutuação (`@keyframes flutuar-profissional`).
- **Pop-up de troca de senha**: "Digite seu email para que mandemos uma solicitação de troca de
  senha." · "Esqueci minha senha" · campo **Email** · botão **"Enviar solicitação "**.

Foco e hover nos campos já têm tratamento visual no original — mantenha, agora com o anel ciano.
O campo de e-mail tem estado de inválido.

### 6.2 Clientes

**Lista.** Ordem dos blocos: a lista, depois a barra com botão e busca, depois o bloco de
arquivados.

- **Lista de clientes** — filtra `arquivado = false` e por nome. Cada linha mostra **só o
  nome/razão**, e no hover o fundo clareia. À direita da linha, três ações **nesta ordem**:
  **lixeira · lápis · arquivar**.
- **Barra**: botão **"Novo Cliente"** e campo de busca com placeholder **"Buscar clientes"**.
- **Bloco "Arquivados "** *(oculto para indicante)*: cabeçalho com ícone de expandir/recolher e o
  rótulo "Arquivados ", fechado por padrão; some quando a contagem é zero. Lista de 2 linhas, com
  ações **lixeira · lápis · desarquivar**.

**Diálogo de cliente** (o mesmo para criar e editar). Botão **"Cadastrar"** quando é novo,
**"Salvar"** quando o nome/razão já está preenchido — muda também de cor.

Campos: CNPJ · nome/razão social · atividade da CIA · passivo oneroso · ativos · margem líquida ·
faturamento anual · parecer *(multilinha)* · estimativa de faturamento · demanda · **status do
cliente** *(seletor: contato inicial · mandato-nda em negociação · mandato assinado com fee ·
mandato assinado sem fee)* · diretor/gerente · telefone · cidade.

Mais dois blocos:

- **E-mails** — lista de uma linha por e-mail, cada uma com ícone de apagar e o endereço editável.
  **Some quando a lista é vazia.** Ao lado, rótulo "Email" e ícone que abre o pop-up de adicionar.
- **"Quem visualiza:"** — seletor múltiplo de usuários, mostrando o nome. Ao lado,
  **"Quem indicou "**.

**Pop-up de adicionar e-mail**: título "Adicionar Email", um campo, botões "Fechar" e "Salvar".

**Pop-up de exclusão**: título "Deletar Cliente"; texto *"Tem certeza que deseja deletar o cliente
**{nome}**? Essa ação é permanente e não pode ser revertida."*; botões "Cancelar" e "Deletar".

### 6.3 Fornecedor

**Duas abas**, nesta ordem: **"Tipo Operações "** e **"Fornecedores "**. A aba ativa ganha borda
inferior de 5px na cor de destaque. *(No original os dois botões fazem a mesma coisa — ver §11.)*

**Aba Fornecedores** — tabela, colunas **nesta ordem**:

| Nome | Tipos de operação | Faturamento minimo | Operação minima | Segmento foco | *(ações)* |

Célula vazia mostra **"-"**. Hover na linha clareia o fundo; hover no nome aumenta a fonte e pinta
de azul. Ações da linha: **lixeira · lápis · arquivar**.

Acima: botão **"Novo Fundo"**, um seletor múltiplo *(oculto)* com placeholder "Buscar Operações" e
o campo de busca "Buscar fornecedores".

**Bloco "Arquivados "** — mesmas colunas, ações **lixeira · lápis · desarquivar**, some quando
vazio.

**Aba Tipo Operações** — tabela, colunas **nesta ordem**:

| Nome | 1° Linha | 2° Linha | Habilitados |

"Nome" é o tipo de operação. As três colunas seguintes listam os fundos. "Habilitados" é uma grade
de **4 colunas × 6 linhas** com os nomes dos fundos; hover sublinha e pinta de azul.

**Diálogo de fornecedor** — campos: nome do fundo · status *(seletor: contato inicial ·
contrato-nda em negociação · contrato-nda assinado com fee · nda assinado sem fee)* · contato ·
e-mail · número · cidade · PF ou PJ · segmento foco · segmento que não atua · operação mínima ·
faturamento mínimo · Fee · parecer *(multilinha)* · link de indicação.

Mais **quatro seletores múltiplos sobre os 31 tipos de operação**: 1ª Linha · 2ª Linha · tipos de
operações · **tipos de operações não atendidas** — este último com as tags **em vermelho**. O
seletor de 1ª e 2ª linha só oferece os tipos que não estão em "não atendidas".

Botão **"Cadastrar"** / **"Salvar"**, com ícone de cursor antes do texto.

**Pop-up de exclusão**: "Deletar Fornecedor" + o mesmo texto de confirmação, com o nome do fundo.

### 6.4 Operação — a tela central

Quatro botões no topo, **nesta ordem**: **"Fornecedor"** *(oculto p/ indicante)* · **"Cliente"** ·
**"Status "** *(oculto p/ indicante)* · **"Nova Operação"**.

Título da área: **"Detalhes da operação"**.

**Aba Cliente** — lista de operações, 2 linhas. Cada item traz o **identificador** e, em seguida,
**" - " + nome do cliente**; quando não há identificador, mostra o nome em texto. Acima do nome
aparece o nome de quem visualiza *(oculto p/ indicante)*. Ações da linha: **lixeira · lápis ·
arquivar**. Bloco **"Arquivados "** embaixo, fechado por padrão, oculto p/ indicante.

**Aba Fornecedor** — rótulo **"Fundo parceiro:"** + seletor de fundo. A tabela **só aparece depois
de escolher o fundo** — desenhe o estado anterior. Colunas, nesta ordem:

| Cliente | Demanda inicial | Tipo de operação | Status | Demanda final |

**Aba Status** — quatro colunas lado a lado, **nesta ordem**: **"Inicial"** · **"Em andamento"** ·
**"Operação Aprovada"** · **"Excluído ou Paralisado"**. Cada cartão traz, nesta ordem: a faixa
`demanda inicial + " a " + demanda final` (com "-" quando vazio), a comissão, o nome do cliente
truncado em 15 caracteres, e o identificador. As colunas "Em andamento" e "Operação Aprovada" têm
um campo **"Soma: "** no rodapé.

**Diálogo de operação** — contém, além dos campos: garantias sugeridas · limites/fundos assinados ·
declínios *(seletor múltiplo de fornecedores; desabilitado p/ indicante)* · PMTS · prazo ·
carência · demanda inicial *(rótulo "Demanda em R$")* · faturamento anual *(vem do cliente)* ·
parecer da operação *(multilinha)*.

- **Bloco de observações** — some quando não há cliente. Ícone de adicionar, ícone de fechar a
  lista, e uma tabela onde cada linha tem: ícone de excluir, **"Modificado em: {data}"**, e o
  texto da observação editável.
- **"Escolher cliente:"** + seletor — **só aparece quando a operação é nova**.
- **Tabela de etapas**, colunas **nesta ordem**:

  | Fundo | Tipo de operação | Na mão de | Status | *(ações)* | Alterado em: |

  **Cada célula tem duas formas**: texto quando está lendo, campo quando está editando. O modo de
  edição é **por linha**, acionado pelo lápis; as ações da linha são **salvar · editar · deletar**
  *(o grupo some p/ indicante)*. "Alterado em:" mostra a data em `dd/mm`. A tabela some quando não
  há nenhuma etapa.
- **Linha de criação de etapa** *(só master)*: seletor de tipo sugerido · seletor de fundo
  sugerido · seletor de status · campo **"Na mão de"** · botão de adicionar.
- **"Parecer Cliente"** — multilinha vindo do cadastro do cliente; some quando não há cliente.

**Cor por status** — já existe no original e deve ser mantida como significado:

| Status | Hoje |
|---|---|
| declinado pelo fundo · declinado pelo cliente · já cliente do fundo | vermelho |
| contrato assinado | azul da marca |
| aguardando interesse · teaser enviado | cor neutra de início |
| paralisado | amarelo — **ver §8, precisa virar âmbar** |

### 6.5 Esteira de Estruturação

**Lista** — operações em 2 linhas, cada uma com **identificador** + **" - " + nome do cliente**, e
ícone de lápis. Campo de busca com placeholder **"Buscar"**.

**Diálogo da esteira**, na ordem do original:

**(a) Checklist.** Onze itens. Cada um é: **rótulo + ":"**, o valor em **"%"**, um **slider de 0 a
100**, e abaixo um campo multilinha de observação. Ordem exata:

| # | Rótulo |
|---|---|
| 1 | Integralização de cota sub: |
| 2 | Integralização de cotas senior e mezo: |
| 3 | Inclusão de DC: |
| 4 | *(campo livre 1 — o usuário nomeia)* |
| 5 | *(campo livre 2)* |
| 6 | *(campo livre 3)* |
| 7 | *(campo livre 4)* |
| 8 | Regulamento: |
| 9 | Arquivos de Remessa e Retorno: |
| 10 | Contrato de Cessão |
| 11 | Contrato de Cobrança |

Os quatro livres têm um campo de texto para o nome, ao lado do slider.

**(b) "OBSERVAÇÕES"** — rótulo em caixa alta.

**(c) Cabeçalho e campos:** **"Instrumento: "** + seletor múltiplo · **"Operação: "** +
identificador + " - " + nome do cliente · **"Volume: "** + campo com símbolo R$ ·
**"Instituição Líder:"** + valor calculado.

**(d) Blocos condicionados pelo instrumento** — três, mutuamente exclusivos:

| Aparece quando o instrumento contém | Título | Campos, nesta ordem |
|---|---|---|
| FIDC Proprietário · FIAGRO · FII · SLB | "FIDC, FIAGRO, FII, SLB" | Gestor · Admnistrador *(sic)* · DTVM · Assessoria Legal · Demais *(multilinha)* |
| CRA · CRI · CR | — | Securitizadora · DTVM · Agente Fiduciário · Custodiante · Demais *(multilinha)* |
| Debêntures | — | Emissor · Estruturador · Agente Fiduciário · DTVM · Demais *(multilinha)* |

**(e) Fecho:** **"Inicio: "** + seletor de data · **"Ts Assinado: "** + interruptor ·
**"Operação de pé:"** + interruptor · **"Fee Recebido:"** + interruptor.

### 6.6 Funil de Clientes

Kanban de prospecção. No original o quadro inteiro é um componente HTML embutido; no novo é React,
mas **o comportamento e o arranjo se mantêm**:

- colunas são etapas, cartões são empresas;
- **arrastar cartão** entre colunas e **reordenar colunas** por arraste;
- barra horizontal fixa no rodapé;
- arquivar cartão;
- filtros por usuário.

**Cartão** — campos, na ordem do pop-up original: Empresa · Contato · Segmento · Faturamento ·
Indicante · Parecer · Histórico. Mais tags coloridas e datas (**DataKB**, **DataCall**).

Os pop-ups de cliente, exclusão e e-mail são **os mesmos da tela Clientes** — mesmo componente, um
só. A única diferença no original é o rótulo do botão, que tem um ícone de cursor antes do texto.

Existem **tarefas** no banco (título, prazo, conclusão, responsável) que o funil atual **não usa**.
Não invente lugar para elas: deixe fora, como está hoje.

É a tela mais provável de ser aberta no celular, em reunião.

### 6.7 Respostas de formulário (`respforms1`)

Tabela de **15 colunas de layout** com as respostas da pesquisa (ESG, governança, crédito), 16
perguntas. Leitura, sem edição. Densidade baixa.

---

## 7. As capturas de tela mandam no arranjo

**Vão ser anexadas capturas de tela do app Bubble em produção, tela por tela.** Elas são a
autoridade sobre **posição**: onde cada campo fica, quantas colunas o diálogo tem, o que fica ao
lado de quê, a largura da lista contra a área principal, a proporção das colunas.

Este documento é a autoridade sobre o **resto**: quais elementos existem, os textos exatos, as
colunas das tabelas e a ordem delas, as regras de visibilidade por nível de acesso, e o
comportamento.

Por que a divisão: a documentação de origem registra a **árvore de elementos** do Bubble, que é
ordem de z-index, não ordem visual, e não tem coordenada nem largura. Prova: no diálogo de
fornecedor o campo `nome do fundo` — o principal — aparece **por último** na árvore. Então a
árvore diz o que existe, e a captura diz onde está.

**Quando os dois divergirem, a captura vence no arranjo e este documento vence no conteúdo.** Se
um elemento descrito aqui não aparecer em nenhuma captura, não o invente: pergunte — pode ser um
elemento que só aparece sob condição (há vários), ou uma tela que faltou capturar.

---

## 8. Tokens novos deste produto

Mesmo formato do `lure-sistema-tokens.css`: par `--st-X` (ponto/fundo) + `--st-X-ink` (texto), com
bloco `.dark`.

### Status da etapa — 14, com progressão

É a informação mais importante da tela de operação. O original pinta quatro casos e deixa dez
neutros; como o significado se perde, **proponha o agrupamento** — esta é decisão visual, não de
layout. Sugestão de partida:

| Grupo | Status | Cor sugerida |
|---|---|---|
| Início | aguardando interesse · teaser enviado | neutro |
| Em curso | documentação inicial enviada · docs requeridos · operação em análise · proposta feita · em estudo | ciano `#0abaee` |
| Avanço | operação aprovada · contrato enviado | oliva `#7aa42c` |
| Fechado | contrato assinado | verde `#118937` |
| Terminal neutro | já cliente do fundo | roxo `#5c2482` |
| Pausado | paralisado | âmbar `#d99000` |
| Terminal negativo | declinado pelo fundo · declinado pelo cliente | vinho `#6f163a` |

**"Paralisado" é amarelo `#ffdd00` no Bubble. Não reproduza esse amarelo** — ele é reservado à
ação. Âmbar é a cor certa, e o Sistema Lure já fez exatamente essa correção. É a única troca de
cor que este documento autoriza sem perguntar.

### Status do cliente e do fornecedor — 4 cada
Escalas de progressão de contrato. Proponha uma escala que mostre avanço.

### Status da operação — 4
Inicial · Em andamento · Operação Aprovada · Excluído ou Paralisado — as colunas da aba Status.

### Tipo de operação — 31
Categoria, não status. 31 cores é ruído; proponha tratamento alternativo (mono, agrupamento por
família) **sem mudar onde o seletor fica**.

---

## 9. Componentes

**Reuse literalmente do `design/sistema-lure/README.md`:** tabela densa (com as seis regras de
filtro por coluna), chip de status, botões, formulários e diálogos, grade/matriz, estados
obrigatórios, app bar.

**Novos aqui, precisam ser resolvidos — sem mudar o arranjo:**

1. **Célula com duas formas** (texto ⟷ campo), edição por linha — tabela de etapas.
2. **Item de checklist**: rótulo + "%" + slider 0–100 + observação multilinha. Onze deles.
3. **Bloco condicionado por seletor** — os três grupos de instrumento.
4. **Seletor múltiplo sobre lista de 31**, quatro vezes no mesmo diálogo, um deles com tags
   vermelhas.
5. **Kanban** com arraste de cartão e de coluna.
6. **Bloco "Arquivados " recolhível** no rodapé da lista — recorre em clientes, fornecedores e
   operações.
7. **Painel de quatro colunas de status** com campo de soma no rodapé de duas delas.
8. **Tabela com "-" em célula vazia** — padrão do original, mantenha.

---

## 10. Estados obrigatórios

Em toda tela, conforme o `README.md` do irmão: **vazio** (símbolo da marca, título, contagem do
que o filtro esconde, botão "Limpar filtros") · **carregando** (esqueleto) · **erro** (cartão
`--danger-bg`, link "Tentar de novo") · **sem permissão** (cartão neutro dizendo o papel e quem
libera).

O original já tem dois comportamentos de vazio que devem ser mantidos: a lista de e-mails do
cliente some quando vazia, e os blocos de arquivados somem quando a contagem é zero.

---

## 11. Defeitos do original — **não reproduzir, mas confirmar antes**

Estes são erros, não layout. Marque no artboard e pergunte:

1. **Abas que não são abas** (tela Fornecedor): os dois botões executam a mesma sequência de
   toggles, então qualquer um alterna a visão e não existe estado de aba ativa de verdade.
   Precisa de aba com estado.
2. **Rótulo que mostra o campo errado**: no diálogo de fornecedor, "segmento que não atua" exibe
   o conteúdo de *segmento foco*; no diálogo de usuário, o campo de telefone exibe o *CPF*.
3. **Senha em texto puro** na tabela de usuários do painel administrativo.
4. **Botões sem ação**: no bloco de arquivados de fornecedor, os ícones de excluir e editar
   existem e não fazem nada.
5. **Botão "Adicionar Maicon a todos os clientes"** no painel administrativo — ação com nome de
   pessoa cravado.
6. **Item de menu morto**: no menu antigo, "Clientes" não leva a lugar nenhum.

---

## 12. Decisões que preciso que você proponha

Só visuais — nenhuma mexe em layout.

1. **Assinatura do produto.** O CRM usa "LURE" + chip "CRM"; o Sistema Lure usa "LURE" sem chip.
   Proponha 2–3 opções para este (ex.: chip "CAPITAL"). Símbolo idêntico, sempre.
2. **Tagline do login** — 2–3 opções.
3. **Agrupamento de cor dos 14 status** (§8).
4. **Tratamento dos 31 tipos de operação** (§8).
5. Onde a densidade deve ser compacta e onde confortável.

---

## 13. Entregáveis

1. **Canvas de artboards**, 1440px, claro e escuro:
   - página de **Design System**: o que foi herdado e o que é extensão deste produto;
   - as **sete telas**, nos dois níveis de acesso onde diferem;
   - os **diálogos**: cliente, fornecedor, operação, esteira, cartão do funil, usuário, troca de
     senha, exclusão;
   - o **app shell** e o **login**.
2. **Extensão de tokens** — só o que falta, no formato do `lure-sistema-tokens.css`.
3. **Notas de handoff por tela**: o que é componente reutilizado, o que é novo, e **onde você
   precisou supor arranjo** (§7).

Fidelidade **alta** no visual e **máxima** no layout. Este design vira código depois, então
priorize componentes e tokens, não telas pixel-únicas.

---

### Contexto de apoio

- Banco já modelado e aplicado: 27 tabelas no Postgres/Supabase. Campos exatos em
  `db/002_dominio.sql`.
- Comportamento atual, tela a tela, com árvore de elementos e todos os fluxos:
  `specs/bubble/documentacao-completa.md`, 2.540 linhas. Consulte a seção da tela que estiver
  desenhando, nunca o arquivo inteiro.

| Tela | Linhas |
|---|---|
| login (`index`) | 589–670 |
| header e menu | 873–1104 |
| clientes | 1105–1270 |
| funil | 1271–1359 |
| fornecedor | 1360–1521 |
| respostas | 1522–1566 |
| esteira | 1567–1807 |
| operação | 1808+ |
