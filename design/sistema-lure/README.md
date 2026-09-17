# Handoff: Sistema de Gestão Lure (app.lureconsultoria.com)

## Visão geral
Sistema de gestão interno multiempresa para prestadoras de serviço de consultoria (a primeira
organização é a própria **Lure**). Substitui um app antigo em Bubble e reúne 9 áreas de navegação
numa só casca. Uso diário e intenso por ~45–50 usuários internos (diretores e consultores),
**desktop-first**, **alta densidade de informação** (tabelas, grades, formulários).

Hierarquia mental do produto: **Organização → Unidade de negócio → Serviço → Projeto**. Tudo é
isolado por Organização; a identidade do usuário é global (pode pertencer a várias organizações,
com papel diferente em cada).

É **irmão do Lure CRM** (repo `ti927/crm_lure`): mesmos tokens, mesma tipografia, mesmo símbolo,
mesmos componentes-base. Este design só acrescenta o que o CRM não tinha.

## Sobre os arquivos deste pacote
Os arquivos aqui são **referências de design em HTML** — protótipos que mostram aparência e
comportamento pretendidos, **não código de produção para copiar**. A tarefa é **recriar estas telas
no ambiente do codebase existente** (`ti927/crm_lure`: Next.js App Router + React + Tailwind v4 +
shadcn/ui + Supabase, textos e nomes de arquivo em português) usando seus padrões estabelecidos.

O arquivo `Sistema Lure - Fundação.dc.html` é um **canvas de artboards**: cada artboard é uma tela
em 1440px de largura, em seções por rodada. Abra no navegador (com `support.js` ao lado) e navegue
pelos ids (`#1a`, `#2b`, `#7d`…). O botão no topo de cada rodada alterna tema claro/escuro.

## Fidelidade
**Alta (hifi).** Cores, tipografia, espaçamentos e medidas são finais e devem ser reproduzidos
fielmente, usando os tokens já existentes em `app/tokens.css` do repo (idênticos aos de
`tokens/lure-crm-tokens.css`) mais a extensão `tokens/lure-sistema-tokens.css`.

---

## Design tokens

### Base herdada (não alterar)
`tokens/lure-crm-tokens.css` é cópia do que já está em produção no CRM. Em `app/tokens.css` do repo,
duas correções já estão aplicadas e foram incorporadas aqui:
- `--warning` é **âmbar `#d99000`** (ink `#8a5a00`, bg `#fdf3e0`), não amarelo — `#ffdd00` fica
  reservado à ação.
- `--surface-hover: #efefef` (claro) / `#2d2d2d` (escuro); `--skeleton: #e2e2e2` / `#333333`.

Resumo do que este design usa:

| Papel | Token | Claro | Escuro |
|---|---|---|---|
| Fundo da página | `--bg` | `#f5f5f5` | `#0d0d0d` |
| Superfície | `--surface` | `#ffffff` | `#1c1c1c` |
| Superfície rebaixada | `--surface-sunken` | `#ebebeb` | `#141414` |
| Borda | `--border` / `--border-strong` | `#dcdcdc` / `#c4c4c4` | `#333333` / `#4a4a4a` |
| Tinta | `--text` / `--text-secondary` / `--text-muted` | `#171717` / `#5c5c5c` / `#757575` | `#f5f5f5` / `#b8b8b8` / `#8f8f8f` |
| Ação | `--accent` + `--accent-on` | `#ffdd00` + `#000` | idem |
| Amarelo como texto/borda | `--accent-ink` | `#7a6600` | `#ffdd00` |
| Foco | `--focus-ring` | `#0abaee` | `#5ad2f5` |

Paleta de marca (imutável): amarelo `#ffdd00`, ciano `#0abaee`, magenta `#e5007d`, verde `#00973a`,
oliva `#7aa42c`, roxo `#5c2482`, vinho `#6f163a`, verde-escuro `#118937`. Cada uma tem `-ink`
(texto/borda, AA ≥ 4.5:1 sobre branco) e `-on-dark`.

**Regras duras:** `#ffdd00` nunca é cor de texto sobre claro (use `--accent-ink`); os braços do
símbolo nunca são coloridos (só o miolo, sempre `#ffdd00`); nenhuma cor aparece sem significar algo
(status, categoria, estado semântico).

### Extensão nova — `tokens/lure-sistema-tokens.css`
Status por domínio, no mesmo formato do CRM (pares `--st-X` para o ponto/fundo e `--st-X-ink` para
o texto). Grupos: papel do Clifor (`cliente`, `fornecedor`), projeto (`ativo`, `inativo`,
`consultoria`, `selecao`), fatura (`aberto`, `vencido`, `baixado`, `cancelado`), boleto
(`registrado`, `liquidado`, `rejeitado`), tipo de lançamento (`lanc-consultoria`, `lanc-comissao`,
`lanc-bonus`, `lanc-reembolso`) e identidade da organização (`--org-accent`, `--org-accent-on`,
`--org-accent-ink`, com fallback nos tokens Lure).

Reuso deliberado: NPS = `--st-consultoria` (ciano) e eNPS = `--st-selecao` (magenta); classe de
respondente usa `ativo`/`aberto`/`vencido`; situação de inscrito em evento usa
`baixado`/`aberto`/`vencido`.

### Tipografia
**Archivo** (400–900) na interface; **IBM Plex Mono** em números, datas, códigos, CNPJ e texto de
extrato bancário. Números em coluna sempre com `font-variant-numeric: tabular-nums`.

| Uso | Tamanho/entrelinha | Peso |
|---|---|---|
| Título de página | 22/28 | 800, tracking −0.01em |
| Título de seção/diálogo | 22/28 | 800 |
| Nome em detalhe | 16/22 | 700 |
| Corpo de formulário | 14/20 | 400 |
| Corpo de tabela | 13/18 | 400 (600 na 1ª coluna) |
| Rótulo/cabeçalho de coluna | 11/16, caps, tracking 0.06em | 600, cor `--text-muted` |
| Chip | 11 | 600 |
| Mono | 11–13 | 400–600 |

Exceções (telas públicas): título 32–44px, corpo 14–16px — ver 6c e 6e.

### Espaçamento, raio, densidade
Base 4px. Raio 2/4/6px (`--radius-sm/md/lg`) e pill 999px. Alturas: linha de tabela compacta
**32px**, confortável **44px**; controles **28 / 34 / 40px**; app bar **56px**; sub-nav de módulo
**40px**; cabeçalho de tabela 36px; chip 20–22px; ação dentro de linha 24px.

---

## Casca do app (shell)

- **App bar 56px**, `--surface`, borda inferior 1px `--border`, padding 0 20px, gap 20px:
  símbolo 28px + "LURE" (Archivo 800/18px, tracking 0.015em) → **seletor de organização** (botão
  30px, `--surface-sunken`, borda 1px, quadrado 16px com a inicial) → nav de 9 itens → à direita:
  busca (34px, 160px de largura, "Buscar (⌘K)"), botão de tema 34×34, avatar 34px redondo
  (`--text`/`--text-inverse`, iniciais 700/13px).
- **Assinatura do produto:** só símbolo + "LURE", **sem chip**. A ausência do chip é o que
  distingue este sistema do CRM (que mantém o chip "CRM").
- **Nav (9 itens):** Cadastro · Honorários · Reembolsos · Comissões e Extras · Financeiro ·
  Relacionamento · NPS/eNPS · Eventos · Configurações. Item: padding 7px 8px, raio 4px, 13px;
  ativo = 600 + fundo `--surface-sunken`; inativo = 500 + `--text-secondary`.
  ⚠️ Todos os links precisam de `white-space: nowrap` — sem isso "Comissões e Extras" quebra em
  duas linhas dentro dos 56px.
- **Sub-navegação de módulo:** faixa de 40px sob o header (usada em Financeiro e Reembolsos) ou
  segmentado ao lado do título (Orçamento, Honorários). Configurações é o único módulo com **nav
  lateral de 220px** — são muitas telas pequenas e a nav de topo já está cheia.
- **Multiempresa / white-label:** o logo, o nome, a tagline do login e a cor de ação vêm da
  organização ativa, com fallback Lure (`--org-accent`). Ver 7d.

---

## Componentes transversais

### Tabela de dados densa (o componente mais importante)
Linha 32px (ou 44px quando a linha tem avatar + duas linhas de texto), `table-layout: fixed`,
cabeçalho 36px em `--surface-sunken` ou `--surface`, segunda linha de `thead` opcional com os
filtros por coluna, `tfoot` com totais em `--surface-sunken`/700, rodapé de 40px com contagem,
seletor "N por página" e janela de paginação de largura fixa.

Regras que vêm de defeito real no CRM (Doc 08 §6.1) e valem aqui:
1. Rótulo de controle não repete o cabeçalho: o select sob PAPEL diz "Todos", não "Todos os papéis";
   o nome da coluna vai para o `aria-label` ("Filtrar por Papel").
2. Nenhum controle quebra linha: todo gatilho com `nowrap` + `overflow:hidden` + filho `truncate`.
3. Uma medida só para a linha de filtro inteira (28px de altura, mesmo padding).
4. Célula de filtro alinha pelo topo (`vertical-align: top`).
5. Filtro de intervalo (data, valor) **empilha**, não divide a coluna.
6. Rótulo que não cabe é encurtado, nunca cortado no meio (nome inteiro no `title`).

Além disso, nesta entrega: chips sempre `white-space: nowrap` (senão o texto vaza da pílula de
20px), colunas numéricas `nowrap`, e botões de toolbar `flex:none` (senão encolhem e quebram).

### Chip de status
Altura 20px (22px fora de tabela), padding 0 8–9px, raio 999px, borda 1px `--border`,
`nowrap`, 11px/600, cor do texto = `var(--st-X-ink)`, ponto de 6px = `var(--st-X)`.
**Sempre rótulo + cor, nunca só cor.**

### Botões
Primário: `--accent` + `--accent-on`, 700. Secundário: `--surface` + borda `--border-strong`, 600.
Terciário: transparente + `--text-secondary`. Perigo: `--brand-wine` preenchido, ou outline vinho
para ações destrutivas que exigem motivo (ex.: "Devolver mês"). Alturas 28/34/40; dentro de linha
de tabela, 24px. Foco: `outline: 2px solid var(--focus-ring); outline-offset: 1px`.

### Formulários e diálogos
Rótulo 12px/600 com 5px abaixo; campo 34px (40px em login e telas públicas); grade de 2 colunas com
gap 10–12px. Campos calculados são `readOnly` em `--surface-sunken` com rótulo em `--text-muted`
e sufixo "(calc.)". Erro: borda `--danger`, rótulo e mensagem em `--danger-ink`.
Diálogos: 620px (formulário simples), 880px (2 colunas), 1120px (projeto, com abas);
cabeçalho com contexto em mono/11px caps + título 22px/800; rodapé 56px com ações à direita.
Overlay `rgba(0,0,0,.45)`.

### Grade / matriz
Primeira coluna identifica a entidade; colunas numéricas à direita em mono tabular; coluna Total
separada por `border-left`; zeros em `--text-muted` (apagado, não escondido); totais no `tfoot` ou
numa segunda linha de `thead` (Honorários). Quando a célula tem dois valores (realizado/orçado),
linha de 44px com o principal em cima e o secundário 11px em `--text-muted`.

### Estados obrigatórios (toda tela)
- **Vazio:** símbolo da marca em `--border-strong`, título 13/700, contagem do que o filtro esconde
  ("42 estão escondidos pelo filtro") e botão "Limpar filtros". Vazio silencioso lê-se como "não
  existe".
- **Carregando:** blocos `--skeleton` de 12px com larguras variadas.
- **Erro:** cartão `--danger-bg` + borda `--danger`, texto `--danger-ink`, link "Tentar de novo".
- **Sem permissão:** cartão neutro dizendo o papel do usuário e quem libera.

---

## Telas (artboards)

Ids conforme o canvas. Todos 1440px de largura.

### 1a — Design System
Página de referência: assinatura (produto × organização), escala tipográfica, neutros, paleta de
marca com `-ink`, chips de status por domínio, botões/controles, e os quatro estados obrigatórios.

### 1b — Login
Split 50/50. Painel esquerdo **sempre escuro** (`#0d0d0d`, é identidade, não componente de UI):
assinatura no topo, símbolo 120px, h1 36px/800 "Organizando potencial em resultados.", subtítulo
14px `#b8b8b8`, rodapé mono "Lucro + Rentabilidade". Painel direito segue o tema: "Entrar" 24/800,
e-mail e senha (40px), link "Esqueci minha senha", botão amarelo 44px, divisor "ou", botão Google
40px, nota sobre múltiplas organizações. No white-label, o painel esquerdo recebe logo/nome/tagline
da organização.

### 1c — App shell + Cadastro › Clifor
Lista (fluida) + detalhe (520px). Segmentado Clifor/Projetos/Contratos com contagens; filtros
"Papel", "Unidade", "Ativos" (`flex:none`, o último com borda `--accent-ink` por estar filtrado);
"Exportar CSV" e "+ Novo Clifor". Tabela: seleção em lote, Clifor, Papel (180px), Unidade, CNPJs,
Projetos, Contato, Status; segunda linha de `thead` com filtros; paginação com janela fixa.
Detalhe: nome 16/700, chips de papel e status, abas Dados/Projetos/Contratos/Financeiro, e as
seções múltiplas do Clifor — **CNPJs**, **Contatos** (44px, avatar, aniversário), **dados
bancários**, **Projetos** (cartão com faixa esquerda 3px na cor do tipo).

### 1d — Financeiro › Contas a Receber
Sub-nav do módulo (Receber/Pagar/Transações/Orçamento). 5 cartões de resumo (Previsto, Recebido,
Em aberto, Vencido — este com borda `--danger` —, Boletos no banco). Abas Faturas/Boletos com
contador, ações em lote, tabela de 10 colunas com filtros (intervalos empilhados em vencimento,
recebimento e valor), `tfoot` com total do recorte, ação por linha que muda com o estado
(Ver/Baixar/Emitir/Cobrar). Vencido colore o chip **e** a data.

### 2a / 2b — Diálogo de Projeto (1120px, abas "Lança & Edita Projeto" / "Financeiro")
Casca comum: contexto mono (cliente + #id), título, chips de tipo e status, segmentado
**Consultoria/Seleção** (editável só na criação), rodapé com "Cancelar / Salvar e emitir contrato /
Salvar projeto".
- **2a Consultoria:** nome, área/serviço, unidade de negócio, unidade jurídica emissora, CNPJ do
  cliente, início, duração, fim (calc.); faturamento `parcelas × valor = total`, dia de vencimento,
  1ª parcela; toggle "Projeto tem comissões" revelando comissionado/%/motivo; **Consultores &
  honorários** (44px, total/mês e margem estimada); **Trechos de deslocamento** (km × R$/km,
  frequência) com placeholder de mapa.
- **2b Seleção:** título da vaga, serviço, unidade jurídica, abertura, status; toggle **vaga
  sigilosa**; honorário `taxa % × remuneração anual = honorário`; **2 parcelas manuais** editáveis
  em linha (descrição, vencimento, valor, chip de situação — coluna de 90px); **honorários em
  linha** em % do total.

### 2c — Aba Financeiro do projeto
4 cartões (Faturado, Recebido, Custo, Margem × meta) e lista de lançamentos do projeto por tipo
(Fatura/Comissão/Honorário/Reembolso) com competência, vencimento, valor e situação. Lançamentos
automáticos vêm do projeto; os individuais ficam marcados como manuais e não são sobrescritos.

### 2d — Emissão de contrato (tela cheia, 3 colunas 300 / fluida / 280)
Esquerda: modelo, serviço, contratada, representante, testemunhas, anexos (proposta em PDF).
Centro: editor rich-text com barra de 40px e o documento em 14/22px; **marcadores `{{campo}}`** são
tokens atômicos — chip mono 12px em `--accent-ink` sobre `--surface-sunken` com borda, não editável
letra a letra. Direita: paleta de marcadores por grupo (Cliente, Projeto, Contratada, Testemunhas),
busca e seletor de caixa (Normal/MAIÚSC/minúsc/Título). Marcador sem valor bloqueia a emissão.
O **editor de modelos** é a mesma tela sem a coluna de parâmetros.

### 3a — Financeiro › Contas a Pagar
Matriz **fornecedor × unidade de negócio** (Gestão Empresarial, Pessoas, Agro, Saúde) + Total +
Situação; abas por tipo (Tudo/Consultoria/Comissões/Bônus/Reembolsos) e **Análise CNPJ** (troca o
eixo para o CNPJ do fornecedor). 4 cartões (Total a pagar, Pago, Atrasado, Sem nota fiscal — este
bloqueia a baixa). Painel lateral **440px** = "Lista de Lançamentos" do fornecedor: NF, seleção,
tipo, lançamento, valor, data de pagamento, unidade jurídica pagadora e baixa em lote.
⚠️ Larguras: com o painel aberto, a coluna do fornecedor precisa de ~180px — colunas numéricas em
104px, Total 116px, Situação 124px, ação 84px.

### 3b — Financeiro › Transações (conciliação)
Extrato Pluggy com chip de sincronização. 5 cartões (Entradas, Saídas, Líquido, Conciliadas N/M,
Pendentes). Tabela com filtros por coluna: data (intervalo empilhado), descrição do extrato **em
mono** (texto do banco, não editável), tipo, valor, conciliação, vínculo e ação. Estados:
Conciliado (`--st-baixado`), Sugestão com % de confiança (`--st-registrado`), Sem vínculo /
Divergente (`--st-aberto` + linha em `--warning-bg`, com legenda no rodapé). Ação por linha:
Ver / **Confirmar** (amarelo) / Vincular.

### 4a — Orçamento › Versões
Segmentado Versões / Orçado × Realizado / DRE ao lado do título. Linha 44px: versão, exercício,
status (Aprovado em uso / Rascunho / Encerrado), entradas, saídas, líquido, margem, atualizado por
quem, ações Abrir/Comparar. Só uma versão por exercício fica **em uso**; é contra ela que OxR e DRE
comparam.

### 4b — Orçado × Realizado
Grade conta × 6 meses, linha 44px, célula com **realizado em cima** e `orç.` 11px embaixo; meses
futuros mostram `—` no realizado. Linhas de grupo em `--surface-sunken`/700, contas filhas
indentadas. Segmentado **Competência / Caixa** (troca a fonte dos dados, não o layout).
Coluna **Variação** = % + valor + cor, com sinal consistente: calcule sobre **magnitudes**
(`|real| − |orç|`), favorável quando receita sobe e quando despesa cai; |variação| < 2% fica
neutro (`--text-secondary`). Legenda de cores no rodapé.

### 4c — DRE
Tabela de 36px: receita bruta → impostos → receita líquida → custos → margem bruta → despesas →
EBITDA → financeiro/IRPJ → resultado líquido. Subtotais `(=)` em `--surface-sunken`/700; deduções
`(−)` indentadas em `--text-secondary`. Colunas: mês atual, mês anterior, acumulado, % da receita.
Coluna lateral 320px: resultado líquido em 28px/800, composição da receita (barra
`--st-consultoria` / `--st-selecao`) e margens vs. meta.

### 4d — Diálogo "Novo lançamento orçado" (880px)
Duas colunas por pergunta: **O quê** (segmentado Entrada/Saída, categoria do plano de contas,
descrição) + **Dimensões** (unidade de negócio, unidade jurídica, centro de custo); **Quando**
(Única/Recorrente, periodicidade, de/até) + **Quanto** (valor base, "como o valor varia" — Fixo /
Cresce % / Sazonal —, crescimento, total calculado e **prévia de 12 meses** clicável; em Sazonal os
meses viram inputs). Rodapé: "Gera 12 ocorrências na versão v4. A versão em uso não muda."

### 5a — Honorários
Grade projeto × 6 meses com **total por mês na segunda linha do `thead`** (borda inferior 2px) e
mês corrente destacado em `--warning-bg`. Célula: `✓` + fundo `--success-bg` (lançado e enviado ao
Financeiro) ou `○` + `--warning-bg` (previsto); faixa esquerda 3px = tipo de projeto; valores
`nowrap` em colunas de 136px. Total geral calculado, nunca fixo. Segmentado Grade / Detalhar;
ações "Enviar nota" e "Lançar em lote · <mês>" (confirma todas as células `○` do mês).

### 5b — Reembolsos › Aprovar
Sub-nav "Meus reembolsos / Aprovar" com contador amarelo de pendências. Mestre-detalhe (520px /
fluida): lista de consultores com valor, nº de gastos e situação; à direita, cabeçalho do consultor
+ total do mês e tabela de gastos (data, tipo com `↻` quando recorrente, descrição/projeto,
comprovante — ausente em `--st-vencido-ink` —, valor). Aprovação é **tudo-ou-nada**: um botão
primário com o valor ("Aprovar R$ 1.284,60") e "Devolver mês" em outline vinho, com motivo
obrigatório. Aprovado gera lançamento tipo Reembolso em Contas a Pagar.

### 5c — Comissões e Extras
Grade consultor × 6 meses (32px, coluna "Predominante" com o chip do tipo, mês atual destacado,
totais no `tfoot`) e, na mesma tela, **listagem detalhada** (vencimento, tipo, beneficiário,
motivo/origem, valor, situação, ações). Comissões nascem do projeto a cada baixa; bônus são
lançados à mão e, acima do limite da área, ficam "Aprovação pendente".

### 5d — Diálogos "Lançar gasto" e "Lançar extra" (620px cada)
- **Lançar gasto** (consultor): segmentado Único/Recorrente; tipo de gasto, projeto, **trecho
  cadastrado no projeto** (calcula o valor e dispensa comprovante), repetição, período, valor por
  ocorrência (calc.), observação e área de anexo. Recorrente gera N gastos, cada um aprovado no seu
  mês.
- **Lançar extra** (diretor): segmentado Comissão/Bônus com o ponto de cor do tipo; beneficiário,
  motivo, projeto opcional, valor, competência/vencimento, unidades, justificativa. Acima do limite
  da área, aviso âmbar e o botão muda para "Enviar para aprovação".

### 6a — Relacionamento › Aniversariantes
4 cartões (Hoje — borda `--accent` —, Próximos 7 dias, Sem presente definido, Gasto vs. orçado) e
tabela 44px: contato/cliente, data, quando ("hoje" em negrito, sem cor própria), quem entrega,
presente + preço, situação (`--st-aberto` definir → `--st-registrado` definido → `--st-baixado`
entregue), ação "Definir". Presente acima do limite exige aprovação do Diretor geral. Abas do
módulo: Clientes e contatos · Aniversariantes · Consultores.

### 6b — NPS / eNPS
Lista de pesquisas (36px): nome, tipo (NPS ciano / eNPS magenta), período, enviados, respostas,
taxa, score (verde ≥ 50), situação. Abaixo, respostas (44px) com nota 16px/700, classe
(Promotor 9–10 / Neutro 7–8 / Detrator 0–6 — faixa escrita no rótulo) e justificativa; coluna
lateral 320px com score 36px/800, distribuição em barra e status de campo com "Reenviar aos N
pendentes". Detrator gera tarefa de retorno em 48h.

### 6c — Formulário público de NPS
Única tela pública sem chrome de app: barra escura da marca 64px, título 32px/800, escala 0–10 em
11 botões de **56px** (selecionado = `--accent` com borda 2px `--text` — a leitura
promotor/detrator é interna, não do respondente), textarea de justificativa, botão 48px.
Abaixo de 640px a escala quebra em 6+5. No white-label, a barra escura recebe o logo da organização.

### 6d — Eventos
Aqui o cartão vence a tabela (poucos eventos, cada um com ocupação): nome/subtítulo, data/hora,
barra de inscritos (única barra de progresso do sistema, em `--accent`), confirmados, chip de
situação e ações Editar/Landing. ⚠️ o cartão precisa de **uma só** declaração de `background`
(vinda dos dados: `--surface` normal, `--info-bg` selecionado). Painel lateral 480px com abas
Inscritos / Divulgação / Formulário: contadores e lista de inscritos (confirmado / aguardando /
não comparecerá), "Exportar lista" e "Cobrar N confirmações". O **construtor de formulário** segue
o padrão do diálogo de projeto (lista de campos + propriedades ao lado).

### 6e — Landing page do evento
Herói escuro da marca (44px/800) com data, local, vagas e investimento, e cartão de inscrição claro
sobreposto (400px) cujos campos vêm do construtor de 6d. Abaixo, programação em 3 colunas com
faixas de 36×4px. Chip amarelo "Inscrições abertas" é o mesmo estado da lista; encerrado vira
neutro e o botão desaparece. Única tela, com a 6c, onde a tipografia sai da densidade de ferramenta.

### 7a — Configurações › Usuários
Nav lateral 220px (Usuários · Papéis e permissões · Cadastros · Parâmetros gerais · Meu perfil).
Tabela 44px (usuário com avatar e e-mail, papel, unidade, situação, último acesso) + **painel fixo
de convite** à direita (340px): e-mail, papel, unidade, **vínculo ao Clifor fornecedor** (é por esse
vínculo que os honorários caem em Contas a Pagar), aviso de identidade global e validade de 7 dias.

### 7b — Configurações › Papéis e permissões
Matriz módulo × papel (Diretor geral, Diretor de área, Consultor Gerente/Pleno/Júnior), cabeçalho
48px, células 44px. A célula é um select disfarçado de chip com 5 níveis **escritos**: Total
(`--success-bg`), Área e Próprio (`--warning-bg`), Leitura (`--info-bg`), Sem acesso (sem fundo — o
item nem aparece na navegação). Legenda completa no rodapé. Novo papel duplica um existente; papel
em uso não é excluído.

### 7c — Configurações › Cadastros
8 listas de domínio como cartões iguais em grade de 4 (unidades de negócio, unidades jurídicas,
serviços, centros de custo, tipos de honorário, tipos de gasto, motivos de comissão, tipos de
fornecedor) — um componente só, conteúdo diferente. Abaixo, **plano de contas** em tabela própria
(código mono, conta indentada, natureza Entrada/Saída, grupo na DRE). Item em uso é **desativado**,
nunca excluído.

### 7d — Configurações › Parâmetros gerais + Meu perfil
Coluna principal em cartões-seção:
- **Identidade da organização** (white-label): logo do header/login, nome exibido, **cor de ação**
  (swatches curados: amarelo Lure padrão, ciano, roxo, verde) e tagline do login.
- **Limites e aprovações:** limite de bônus por área, limite de presente, valor do km, dia de
  pagamento de honorários, toggle "exigir comprovante em todo reembolso" (exceto trecho cadastrado).
- **Formatos e exportação:** data `dd/mm/aaaa`, moeda `R$ 1.234,56`, **CSV separado por
  ponto-e-vírgula em UTF-8 com BOM** — campos com borda `--accent-ink` porque são padrão do cliente,
  não preferência.
Coluna direita (380px): **Meu perfil** (foto, nome, e-mail somente leitura, telefone, aniversário,
tema Sistema/Claro/Escuro, densidade Compacta/Confortável, sair) e **Minhas organizações** (a ativa
com borda `--accent-ink`; identidade global, papel por organização).

---

## Interações e comportamento

- **Tema:** claro padrão + escuro, alternável no header e no perfil; preferência persistida por
  usuário. Todo componente novo é conferido nos dois temas.
- **Navegação:** nav de topo → sub-nav do módulo (40px) → segmentado dentro da tela. Detalhe abre
  em **painel lateral** (Clifor 520px, Contas a Pagar 440px, Eventos 480px) quando o usuário precisa
  continuar vendo a lista; abre em **diálogo** quando é uma edição fechada (projeto, lançamento).
- **Filtros:** commit no blur/Enter em campos de texto, imediato em selects e datas; coluna filtrada
  ganha borda `--accent-ink` e ícone de funil no cabeçalho; "Limpar filtros" no estado vazio.
- **Seleção em lote:** checkbox no cabeçalho e por linha; a barra de ações mostra a contagem e o
  valor somado; ação primária nomeia o efeito ("Baixar 4 lançamentos", "Aprovar R$ 1.284,60").
- **Aprovações:** reembolso é tudo-ou-nada por mês (devolver exige motivo); bônus e presente acima
  do limite vão para o Diretor geral, com aviso âmbar no diálogo e botão renomeado.
- **Formatação brasileira:** `dd/mm/aaaa`, `R$ 1.234,56`, milhar com ponto; vazio vira `—`, nunca
  `R$ 0,00` nem string vazia. Reuse `lib/formato.ts` do repo (`real`, `data`, `texto`, `local`,
  `dataHora`, `realCurto`).
- **Exportação CSV:** `;` + UTF-8 com BOM em todas as telas com "Exportar CSV".
- **Acessibilidade AA:** contraste dos `-ink`, foco ciano visível único, alvos adequados, cor nunca
  como único sinal (sempre rótulo, símbolo ou número ao lado).
- **Responsividade:** alvo é desktop; degrada com elegância até tablet (painéis laterais colapsam,
  grades rolam horizontalmente). Celular é consulta — as grandes grades não precisam ser
  reproduzidas; as telas públicas (6c, 6e) precisam funcionar bem no celular.

## Estado e dados
Por tela: filtros (na URL, como no CRM — links de ordenação e paginação são navegáveis), seleção em
lote, item aberto no painel/diálogo, tema, densidade. Dados esperados: Clifor (com múltiplos CNPJs,
contatos e dados bancários), Projeto (tipo Consultoria/Seleção, parcelas, consultores, trechos),
Contrato (modelo + marcadores resolvidos), Fatura/Boleto, Lançamento (honorário, comissão, bônus,
reembolso), Transação bancária + vínculo de conciliação, Orçamento (versão → lançamento orçado →
ocorrências), Pesquisa/Resposta, Evento/Inscrição, Usuário/Papel/Permissão, Parâmetros da
organização.

## Assets
`assets/symbol.svg` (fundo claro), `assets/symbol-white.svg` (fundo escuro), `assets/favicon.svg`.
No app, prefira o componente `SimboloLure` que já existe no repo (`components/dominio/marca.tsx`):
os braços usam `currentColor` e o miolo é fixo `#ffdd00`. "LURE" é **texto vivo** em Archivo, não
parte do SVG. Área de proteção = altura de 1 bloco do símbolo; tamanho mínimo 16px.

## Arquivos deste pacote
- `Sistema Lure - Fundação.dc.html` — canvas com os 23 artboards (abrir com `support.js` ao lado).
- `support.js` — runtime necessário para o canvas abrir no navegador.
- `tokens/lure-crm-tokens.css` — tokens herdados do CRM (base).
- `tokens/lure-sistema-tokens.css` — extensão nova (status por domínio, âmbar de alerta,
  `--org-accent`).
- `assets/*.svg` — símbolo e favicon.

## Referências no codebase (`ti927/crm_lure`, branch `main`)
- `app/tokens.css`, `app/globals.css` — tokens e `@theme` do Tailwind v4.
- `docs/08-ui-e-design-system-v0.2.md` — princípios, correções de paleta e as regras de tabela densa.
- `app/(sistema)/layout.tsx` — moldura autenticada (`h-svh`, rolagem por dentro, rodapé no fim do
  conteúdo).
- `app/(sistema)/negocios/filtro-coluna.tsx` — filtros por coluna (constante única de altura).
- `app/(sistema)/estilo/page.tsx` — página de verificação de tokens nos dois temas.
- `components/dominio/marca.tsx` — símbolo e assinatura.
- `lib/formato.ts` — formatação pt-BR.
