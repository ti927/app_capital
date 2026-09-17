# Prompt para o Claude Design — Sistema Lure (app.lureconsultoria.com)

> Cole este texto no Claude Design e anexe os dois materiais indicados na seção "Materiais".
> Objetivo: desenhar as interfaces, o esquema de cores e as formatações do **novo sistema de gestão da Lure** — reaproveitando o sistema visual que já existe (marca Lure + handoff do Lure CRM), sem reinventar a identidade.

---

## 1. O que você vai desenhar

Um **sistema de gestão interno multiempresa** para prestadoras de serviço de consultoria (a primeira organização é a própria **Lure**). Ele substitui um app antigo feito em Bubble e reúne, numa só casca, 9 áreas de navegação. É de **uso diário e intenso** por ~45–50 usuários internos (diretores e consultores), **desktop-first**, com **alta densidade de informação** (muitas tabelas, grades e formulários).

Não é um site institucional nem uma landing page: é uma **ferramenta de trabalho** (padrão "app de produtividade / ERP leve"), na linha visual do **Lure CRM** que você já desenhou.

**Hierarquia mental do produto:** Organização → Unidade de negócio → Serviço → Projeto. Tudo é isolado por Organização (multiempresa); a identidade do usuário é global (pode pertencer a mais de uma organização, com papel diferente em cada).

---

## 2. Materiais anexados (use como fonte da verdade — não reinvente)

1. **Guia Básico de Identidade Visual da Lure (PDF, BR/BAUEN).** É a marca-mãe. Extraia dele: o símbolo (o "+" que também é "×" — "somar e multiplicar", de *LUcro + REntabilidade*), a paleta (base preto/branco com cores CMYK pontuando: amarelo, ciano, magenta, verde), a tipografia grotesca pesada, e as regras de composição/assinatura/background. Seções relevantes no índice: *Identidade Visual* (Um elemento, Composição, "Cor, vida!", Assinaturas, Background, Elementos de composição, Tipografias) e *Ação* (papelaria, digital, ícones).
2. **Handoff do Lure CRM** (pasta `design_handoff_marca_crm`: `lure-crm-tokens.css`, `components/*.html`, `assets/*.svg`, `README.md`). **Este é o sistema de design já materializado da Lure em produto digital.** Adote-o como base e **estenda-o** para o novo sistema, mantendo consistência total (o CRM e este sistema são da mesma família). Os tokens de cor, tipografia, espaçamento, raio e sombra do `lure-crm-tokens.css` são **finais** — reutilize-os.

**Regra de ouro:** o novo sistema deve parecer **irmão do Lure CRM**. Mesmos tokens, mesma tipografia, mesmo símbolo, mesmos componentes-base. Você só vai **acrescentar** o que o CRM não tinha (as telas dos módulos abaixo) e **ajustar** o que for específico (paletas de status por domínio, assinatura do produto).

---

## 3. Sistema visual a adotar (resumo — detalhes no `lure-crm-tokens.css`)

- **Base:** preto/branco. Superfícies claras no app (`--bg #f5f5f5`, `--surface #fff`, `--border #dcdcdc`, tinta `--text #171717`). **Tema escuro** já definido em `.dark` — entregue os dois temas.
- **Ação = amarelo `#ffdd00`** com texto **preto** (botões primários "+ Novo…"). O amarelo **nunca é cor de texto** sobre claro — para texto/borda use `--accent-ink #7a6600`.
- **Foco = ciano `#0abaee`** (anel de foco único em todo o sistema).
- **Paleta de marca (oficial, imutável):** amarelo, ciano, magenta `#e5007d`, verde `#00973a`, oliva `#7aa42c`, roxo `#5c2482`, vinho `#6f163a`. Cada uma tem variante `-ink` (texto/borda, AA ≥ 4.5:1) e `-on-dark`. Use essas cores para **categorias e status**, nunca para recolorir a marca.
- **Semânticas:** success (verde), danger (vinho/magenta), warning (amarelo), info (ciano) — já nos tokens.
- **Tipografia:** **Archivo** (400–900; títulos e "LURE" em 800/900, caixa alta com tracking) e **IBM Plex Mono** (números, códigos, labels técnicos).
- **Escala densa:** corpo de tabela 13px, formulário 14px; alturas de linha compacta 32px / confortável 44px; controles 28/34/40px. Espaçamento base 4px. Raio 2/4/6px.
- **Símbolo:** o "+" em **5 blocos** com **miolo amarelo** (SVG puro em `assets/symbol.svg`); braços nunca coloridos; miolo amarelo é o único ponto de cor da marca.

---

## 4. Princípios de UX (aplicar em tudo)

- **Desktop-first, densidade alta.** Prioridade a tabelas/grades legíveis e escaneáveis; nada de espaçamento "marketing".
- **Dois temas** (claro padrão + escuro), usando os tokens.
- **Formatação brasileira:** datas `dd/mm/aaaa`, moeda `R$ 1.234,56`, números com separador de milhar por ponto. Exportações CSV **separadas por ponto-e-vírgula, UTF-8 com BOM** (padrão do cliente).
- **Acessibilidade AA:** contraste, foco visível (ciano), alvos clicáveis adequados; nunca usar cor como único sinal (use rótulo + cor).
- **Estados obrigatórios** por tela: vazio, carregando, erro, sem permissão.
- **Padrão de tabela densa** (inspirado na tela `/transacoes` do lure.expert): resumo no topo (totais), **filtro e ordenação no cabeçalho de cada coluna**, seleção em lote, paginação por N, colunas de largura ajustável.
- Responsividade: alvo principal é desktop; degrade com elegância até tablet. Celular é secundário (consulta), não precisa reproduzir as grandes grades.

---

## 5. Arquitetura de navegação (a casca do app)

**App shell** com barra superior (referência: `components/header.html` do CRM — app bar 56px, logo à esquerda, nav, busca, botão amarelo de ação, avatar/menu do usuário) e navegação de topo com estes 9 itens:

1. **Cadastro** — Clifor (clientes e fornecedores na mesma entidade) + Projetos + Contratos, tudo na mesma página.
2. **Honorários**
3. **Reembolsos**
4. **Comissões e Extras**
5. **Financeiro**
6. **Relacionamento**
7. **NPS/eNPS**
8. **Eventos**
9. **Configurações** — Usuários / Cadastros / Parâmetros gerais.

O shell precisa de um **seletor de organização** (o usuário pode pertencer a várias) e de um **menu de usuário** (perfil próprio, tema, sair). Ver seção 8 sobre multiempresa/white-label.

---

## 6. Telas a desenhar (por módulo)

Priorize **P1** (fluxo comercial e financeiro, o coração do produto). P2 e P3 podem vir como telas-chave + padrões reutilizados.

### P1 — Núcleo comercial e financeiro
- **Login** — split painel escuro (marca + tagline) / formulário à direita, botão amarelo "Entrar" (ver `components/login.html`). Adapte a tagline para o sistema (ex.: "A gestão da sua consultoria num só lugar." — proponha 2–3).
- **Cadastro (página unificada):**
  - Lista de **Clifor** com filtros (papel Cliente/Fornecedor, ativo/inativo, unidade de negócio) e busca; card/linha do Clifor.
  - **Detalhe do Clifor:** dados cadastrais, **papel** (Cliente e/ou Fornecedor; se Fornecedor, tipo Consultor/Parceiro/Outro), **múltiplos CNPJs, múltiplos contatos, múltiplos dados bancários**; lista de **Contatos** (com perfil, aniversário).
  - **Projetos do cliente** (dentro do Clifor): card do projeto (Serviço, unidade jurídica, datas, status Ativo/Inativo).
  - **Diálogo de Projeto** com abas: *Lança & Edita Projeto* e *Lança & Edita Financeiro*. **Dois tipos com layouts próprios:** **Consultoria** (área/serviço, duração, qtd parcelas × valor, toggle comissões, consultores & honorários, trechos com mapa) e **Seleção** (título da vaga, taxa %, vaga sigilosa, 2 parcelas manuais, honorários em linha). A aba Financeiro lista faturas/comissões/honorários com lançamento individual.
  - **Painel de emissão de contrato:** seleção de Modelo + Serviço + Testemunhas, editor rich-text com **marcadores `{{campo}}`** (paleta de marcadores lateral), anexar proposta, gerar PDF. Inclua também o **editor de modelos** (com a paleta de marcadores e opção de caixa: Normal/MAIÚSC/minúsc/Título).
- **Financeiro** (o grande módulo novo — padrão "financeiro profissional de mercado"):
  - **Contas a Receber:** lista de faturas (colunas: cliente, serviço/parcela, unidade jurídica/CNPJ, vencimento, recebimento, valores, baixado) + lista de boletos (situação no banco) — tabela densa com ações por linha.
  - **Contas a Pagar:** matriz consultor × unidade de negócio, com abas por tipo (Consultoria/Comissões/Bônus/Reembolsos) e aba "Análise CNPJ"; detalhe "Lista de Lançamentos" com baixa e unidade jurídica por lançamento.
  - **Transações / Conciliação:** tela densa estilo `/transacoes` do lure.expert (resumo Entradas/Saídas/Líquido no topo, filtros por coluna, conciliação de extrato Pluggy contra contas a pagar/receber).
  - **Orçamento:** aba **Versões** (cenários por exercício, status Rascunho, entradas/saídas/líquido), **Orçado × Realizado** (tabela conta × meses, com Competência/Caixa e Variação), **DRE**, e o **diálogo "Novo lançamento orçado"** (categoria, tipo, dimensões, ocorrências/periodicidade, "como o valor varia").
  - **Cadastros do financeiro** (categorias/plano de contas, centro de custo) — em Configurações, mas o Financeiro os consome.

### P2 — Controles do diretor de área
- **Honorários:** grade projeto × mês (total por mês no cabeçalho), aba "Detalhar", lançamento em lote, envio de nota.
- **Reembolsos:** "Meus reembolsos" (consultor lança, com comprovante) e "Aprovar" (diretor, aprovação tudo-ou-nada); diálogo de lançar gasto (único/recorrente).
- **Comissões e Extras:** grade consultor × mês + listagem detalhada; diálogo de lançar extra (Comissão/Bônus).

### P3 — Relacionamento, pesquisas e eventos
- **Relacionamento:** lista de clientes + contatos (aniversários), aba de aniversariantes com controle de presente (preço, quem entrega, cartão virtual), aba de consultores.
- **NPS/eNPS:** lista de pesquisas trimestrais, tela de respostas, e o **formulário público** de resposta (escala 0–10 + justificativa).
- **Eventos:** lista de eventos (cards com inscritos/confirmados, badges ativo/inscrição), diálogo de edição (dados + divulgação), **construtor de formulário de inscrição**, lista de inscritos/confirmados, e uma **landing page** de evento.

### Configurações
- **Usuários:** lista + convite; **tela de setup de papéis e permissões** (matriz papel × módulo). Papéis: Diretor geral, Diretor de área, Consultor (Gerente/Pleno/Junior).
- **Cadastros:** unidades de negócio, unidades jurídicas, serviços, categorias/plano de contas, centro de custo, e listas de domínio (tipos de honorário, tipos de gasto, motivos de comissão, tipos de fornecedor).
- **Parâmetros gerais** + **perfil do próprio usuário** (visível a qualquer papel).

---

## 7. Componentes e padrões transversais (defina uma vez, reuse)

- **Tabela de dados densa** (o componente mais importante): cabeçalho com filtro/ordenação por coluna, linha compacta 32px, resumo/totais no topo, seleção em lote, paginação, estados vazio/carregando/erro.
- **Chips de status** usando a paleta de marca por domínio: ex.: Projeto Ativo/Inativo; Fatura Ativa/Cancelada, Baixado/Em aberto; tipos de lançamento (Consultoria/Comissão/Bônus/Reembolso). Sempre rótulo + cor + variante `-ink` para o texto.
- **Botões:** primário amarelo (texto preto), secundário/outline neutro, perigo (vinho). Alturas 28/34/40.
- **Formulários e diálogos** (modais) densos, com validação e o padrão de "abas" visto no diálogo de projeto.
- **Grade/matriz** (linhas × meses ou consultor × unidade) com totais.
- **Cabeçalho de página** com título, filtros e ação primária.
- **Navegação de topo** + seletor de organização + menu de usuário.
- **Estados** e **empty states** com o símbolo/ilustração da marca.

---

## 8. Multiempresa / white-label no shell

- O sistema é multiempresa. No **V1** opera só a Lure, mas a casca deve estar **pronta para identidade por organização**: o **logo e o nome no header e no login** devem poder ser trocados pela marca da organização ativa (com fallback para a Lure). Considere também um **acento configurável por organização** (mantendo o amarelo como padrão Lure).
- **Seletor de organização** no header (o usuário pode alternar entre as organizações de que é membro).
- Deixe claro no design o que é **identidade fixa do produto** (símbolo Lure quando é a Lure) versus **identidade da organização** (logo do cliente, no futuro).

---

## 9. Entregáveis que espero de você

1. Um **canvas de design (artboards)** contendo:
   - **Página de Design System** (cores/tokens aplicados, tipografia, componentes, estados) — herdando do `lure-crm-tokens.css` e mostrando as extensões (status por domínio).
   - As **telas P1** completas (claro e, quando fizer sentido, escuro), + telas-chave de P2/P3.
   - O **app shell** (header, nav, org switcher) e o **login**.
2. Uma **extensão de tokens** (só o que faltar além do CRM — ex.: cores de status de projeto/fatura/lançamento), no mesmo formato do `lure-crm-tokens.css`.
3. Notas de handoff curtas por tela (o que é fixo, o que é componente reutilizado).

Fidelidade **alta**: cores, tipografia e medidas devem bater com o sistema Lure existente.

---

## 10. Decisões que preciso que você me proponha (com opções)

1. **Assinatura do produto:** o CRM usa "LURE" + chip "CRM". Este é o **sistema principal de gestão** — proponha 2–3 opções de assinatura (ex.: só "LURE"; "LURE" + chip "GESTÃO"; "LURE" + "+"). Mantenha o símbolo idêntico.
2. **Tagline do login** (2–3 opções).
3. Onde faz sentido **densidade compacta × confortável** por tela.
4. Qualquer ponto em que a paleta de marca precise de uma cor de status nova (proponha dentro da família, com variante `-ink`).

---

### Contexto de apoio (se perguntarem)
- Usuários: diretores (geral e de área) e consultores (gerente/pleno/júnior). Uso diário ~2h, ~100 projetos ativos, volume de dados baixo.
- Este design vai virar código depois (via Claude Code), então priorize **componentes reutilizáveis e tokens**, não telas "pixel únicas".
