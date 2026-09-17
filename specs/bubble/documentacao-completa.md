# Documentação técnica — App Bubble `planilha-lurecapital` (LureCapital)

Mapeamento completo do editor Bubble, feito em modo somente leitura em 17/09/2026.
Nenhum elemento, workflow ou dado foi alterado. Chaves, tokens e campos privados aparecem como [PRIVADO].

Índice:

1. Fase 1 — Inventário geral
2. Fase 2 — Banco de dados
3. Fase 3 — Páginas e reusables (partes 1 a 8)
4. Fase 4 — Backend workflows
5. Fase 5 — Integrações
6. Fase 6 — Resumo final

Convenções nas expressões: `X:campo` = "X's campo"; `:get_data` = "'s value"; `:get_group_data` = "'s data";
`<...>` = trecho dinâmico dentro de um texto; `Ancestor[TableCrossAxis]` = "Parent group's Thing" na linha de uma Table;
`? cond:` = conditional do elemento, com as propriedades alteradas depois da seta.

---

# Mapeamento Bubble — planilha-lurecapital
## FASE 1 — Inventário geral

**Fonte:** editor Bubble aberto na aba atual (app `planilha-lurecapital`, branch Main). Leitura feita pela estrutura do app carregada no editor + conferência visual (App Manager e aba Plugins). Nada foi alterado.

### 1. Páginas (12)

| # | Página | Elementos | Pop-ups | Repeating groups | Workflows |
|---|---|---|---|---|---|
| 1 | index (página inicial) | 55 | 1 | 0 | 8 |
| 2 | clientes | 116 | 3 | 3 | 22 |
| 3 | esteira_de_estrutura__o | 257 | 4 | 1 | 34 |
| 4 | fms | 62 | 0 | 0 | 2 |
| 5 | fornecedor | 192 | 2 | 1 | 20 |
| 6 | fornecedor_api | 41 | 0 | 0 | 0 |
| 7 | funilclientes | 90 | 3 | 1 | 11 |
| 8 | old_index | 33 | 3 | 0 | 9 |
| 9 | operacao | 420 | 5 | 7 | 61 |
| 10 | respforms1 | 85 | 0 | 0 | 0 |
| 11 | reset_pw | 17 | 0 | 0 | 1 |
| 12 | 404 | 5 | 0 | 0 | 0 |

Observação: o índice interno do Bubble ainda associa o nome `index` a outra página (hoje chamada `clientes`). É um resíduo de renomeação. No App Manager, a página inicial (ícone de casa) é `index`.

### 2. Reusable elements (3)

| Reusable | Elementos | Pop-ups | Workflows |
|---|---|---|---|
| header | 140 | 3 | 21 |
| navegação | 3 | 0 | 2 |
| MenuNavegação | 16 | 0 | 5 |

O índice também guarda os nomes "Signup / Login Popup", "Header" e "Footer", que vieram do template e não existem mais como reusables.

### 3. Data types (14 ativos + 1 excluído)

| Data type (nome exibido) | Nome interno | Campos ativos | Privacy rules |
|---|---|---|---|
| User | user | 11 | 2 |
| cliente | cliente | 21 | 2 |
| fornecedor | fornecedor | 23 | 2 |
| operação | opera__o | 25 | 2 |
| tbl.etapas operação | etapas_opera__o | 50 | 2 |
| Tbl.Etapas da operação (observações) | tbl_etapas_da_opera__o__observa__es_ | 2 | 2 |
| Tbl.InfoCliente | tbl_infocliente | 2 | 2 |
| Tbl.observações | tbl_observa__es | 2 | 2 |
| tbl.config | tbl_config | 3 | 2 |
| funilcartao | funilcartao | 16 | 2 |
| funiletapa | funiletapa | 4 | 2 |
| funiltag | funiltag | 4 | 2 |
| FunilTarefa | funiltarefa | 10 | 2 |
| RespostasForms1 | respostas | 17 | **0** |
| ~~tabela fundo~~ (excluído) | tabela_fundo | 4 | 0 |

### 4. Option sets (4)

| Option set | Nome interno | Atributos | Nº de opções |
|---|---|---|---|
| Páginas | p_ginas | (apenas Display) | 4 |
| status.tbl | status_tbl | (apenas Display) | 14 |
| NivelDeAcesso | niveldeacesso | (apenas Display) | 2 |
| tipo operação op | tipo_opera__o | Display; `Custeio - deleted` (text, **excluído**) | 31 |

### 5. Backend workflows / API workflows

Nenhum encontrado: a seção de backend workflows está vazia na estrutura do app e não aparece no App Manager. Apesar disso, a Workflow API está habilitada nas configurações (item 7).
[NÃO VERIFICADO pela tela dedicada de Backend workflows: o editor novo não mostra esse atalho no App Manager deste app.]

### 6. Plugins (17) e API Connector

| # | Plugin | Observação |
|---|---|---|
| 1 | API Connector | 1 API configurada |
| 2 | Better Slider Input | |
| 3 | Better Toast Notifications/Alerts | pode ser atualizado |
| 4 | Convert To PNG | |
| 5 | Custom Progress Bar | |
| 6 | Element To PNG | |
| 7 | Excel-Like HandsonTable | **descontinuado** |
| 8 | Free Toggle | pode ser atualizado |
| 9 | Fuzzy Search & Autocomplete | pode ser atualizado |
| 10 | List Popper And Friends (SSAs) | |
| 11 | Multiselect Dropdown | |
| 12 | OneSignal Push Notifications | |
| 13 | OpenAI ChatGPT Dall-E · BEP | |
| 14 | Slider And Multislider Input | |
| 15 | Switch (Toggle) And Checkbox | pode ser atualizado |
| 16 | Toolbox | pode ser atualizado |
| 17 | Ultimate Toolkit | pode ser atualizado |

**API Connector**

| API | Chamada | Use as | Método |
|---|---|---|---|
| OpenAI - ChatGPT | Chatgpt - Request | Action | POST |

Autenticação: [PRIVADO] (os detalhes ficam para a Fase 5).

### 7. Configurações relevantes

| Configuração | Valor |
|---|---|
| Nome do app | planilha-lurecapital |
| Título padrão das páginas | Planilha LureCapital |
| Idioma do app | en_us (inglês EUA) |
| Domínio personalizado | nenhum encontrado [NÃO VERIFICADO na aba Settings → Domain] |
| Redirecionar tudo para o domínio | sim |
| Workflow API exposta | sim |
| Data API (GET) exposta | sim |
| Chaves de API do app | existem [PRIVADO] |
| Permitir iframe | DENY (bloqueado) |
| Opção "expose ID" | ativa |
| Controles de fuso horário (página, inputs, backend) | desativados |
| Profundidade máxima de workflows recursivos (live/test) | 10 / 10 |
| Responsivo legado | desativado (motor responsivo novo) |
| Versão do Bubble | 29 |
| Editor | só web (sem app mobile) |
| Visibilidade do editor (`app_rights`) | `open` |
| Sitemap | vazio |

### Contagem

| Item | Quantidade |
|---|---|
| Páginas | 12 |
| Reusable elements | 3 |
| Data types ativos | 14 (+1 excluído) |
| Option sets | 4 |
| Backend workflows | 0 |
| Plugins | 17 |
| APIs no API Connector | 1 (1 chamada) |
| Workflows em páginas | 168 (operacao 61 · esteira 34 · clientes 22 · fornecedor 20 · funilclientes 11 · old_index 9 · index 8 · fms 2 · reset_pw 1 · demais 0) |
| Workflows em reusables | 28 (header 21 · MenuNavegação 5 · navegação 2) |
| Elementos (páginas / reusables) | 1.373 / 159 |
# FASE 2 — Banco de dados

Legenda de tipos: `text`, `number`, `date`, `boolean` (yes/no), `custom.X` (outro data type), `option.X` (option set), `list.` = campo de lista.
Campos marcados **(excluído)** continuam no schema do Bubble, mas estão apagados.

---

## 2.1 User (`user`) — exposto na Data API

| Campo | Tipo | Lista? | Padrão |
|---|---|---|---|
| Nome | text | não | — |
| CPF | text | não | — |
| CNPJ | text | não | — |
| Razão Social | text | não | — |
| Telefone | text | não | — |
| Região | text | não | — |
| senha | text | não | — |
| Vinculado a parceiro | text | não | — |
| Soma Stts em Andamento | text | não | — |
| Soma Stts em Operação Aprovada | text | não | — |
| NivelDeAcesso | option.niveldeacesso | não | — |
| Vinculado à Parceiro **(excluído)** | custom.fornecedor | não | — |

**Privacy rules**

| Regra | Condição | Permite |
|---|---|---|
| everyone | (sem condição) | nada: sem view all, sem find in searches, sem auto-binding, sem anexos |
| AutoBinding | `Current User is logged in` | view all, find in searches, anexos e **auto-binding** em 11 campos: Soma Stts em Operação Aprovada, Soma Stts em Andamento, CNPJ, CPF, Telefone, NivelDeAcesso, Vinculado à Parceiro (excluído), Nome, Razão Social, Região, Vinculado a parceiro |

Atenção: o campo `senha` (text) guarda senha em texto no banco, em paralelo à senha nativa do Bubble.

---

## 2.2 cliente (`cliente`)

| Campo | Tipo | Lista? | Padrão |
|---|---|---|---|
| nome/razão | text | não | — |
| CNPJ | text | não | — |
| cidade | text | não | — |
| telefone | number | não | — |
| emailcliente | text | não | — |
| emailscliente | text | **sim** | — |
| ativiade da CIA | text | não | — |
| diretor/gerente | text | não | — |
| faturamento anual | text | não | — |
| estimativa de faturamento | text | não | — |
| margem líquida | text | não | — |
| passivo oneroso | text | não | — |
| ativos | text | não | — |
| demanda | text | não | — |
| info adicionais | text | não | — |
| parecer.cliente | text | não | — |
| status cliente | text | não | — |
| quem indicou | text | não | — |
| operações | text | **sim** | — |
| quem visualiza | user | **sim** | — |
| arquivado | boolean | não | — |
| fat anual **(excluído)** | number | não | — |
| quem visualiza **(excluído)** | user | não | — |

**Privacy rules**

| Regra | Condição | Permite |
|---|---|---|
| everyone | (sem condição) | view all, find in searches, anexos (sem auto-binding) |
| auto-binding | `Current User is logged in` | o mesmo + auto-binding no campo nome/razão |

---

## 2.3 fornecedor (`fornecedor`) — exposto na Data API

| Campo | Tipo | Lista? | Padrão |
|---|---|---|---|
| nome do fundo | text | não | — |
| contato | text | não | — |
| email fornecedor | text | não | — |
| numero | text | não | — |
| cidade fornecedor | text | não | — |
| PF ou PJ | text | não | — |
| status | text | não | — |
| status fornecedor | text | não | — |
| na mao de.tbl | text | não | — |
| tipo de operação.tbl | text | não | — |
| segmento foco | text | não | — |
| segmento que não atua | text | não | — |
| operação mínima | text | não | — |
| faturamento minimo | text | não | — |
| Fee | text | não | — |
| parecer fornecedor | text | não | — |
| link de indicação | text | não | — |
| arquivado | boolean | não | `false` |
| 1°Linha | option.tipo_opera__o | **sim** | — |
| 2°Linha | option.tipo_opera__o | **sim** | — |
| 3°Linha | option.tipo_opera__o | **sim** | — |
| tipos de operações | option.tipo_opera__o | **sim** | — |
| tipos de operações não atendidas | option.tipo_opera__o | **sim** | — |
| contato **(excluído)** | text | não | — |
| 1°linha / 2°Linha / 2° linha / 3° linha **(excluídos)** | option.tipo_opera__o | não | — |
| tipos de operações **(excluído)** | text | sim | — |
| tipos de operações não atendidas **(excluído)** | option.tipo_opera__o | não | — |

**Privacy rules**

| Regra | Condição | Permite |
|---|---|---|
| api | `Current User is logged in` | view all, find in searches, criar/modificar/apagar via API, anexos e auto-binding em 26 campos |
| everyone | (sem condição) | **tudo**: view all, find in searches, criar/modificar/apagar via API, auto-binding e anexos |

**Ponto crítico:** a regra `everyone` libera criação, modificação e exclusão via API, sem login, para todos os fornecedores.

---

## 2.4 operação (`opera__o`)

| Campo | Tipo | Lista? | Padrão |
|---|---|---|---|
| identificador | text | não | — |
| qual cliente | custom.cliente | não | — |
| nome cliente txt | text | não | — |
| tipo operação | option.tipo_opera__o | não | — |
| Status Atual da Operação | text | não | — |
| demanda inicial | text | não | — |
| demanda final | text | não | — |
| destino do recurso | text | não | — |
| faturamento anual | text | não | — |
| garantias sugeridas | text | não | — |
| limites/fundos assinados | text | não | — |
| prazo | text | não | — |
| carência | text | não | — |
| PMTS | text | não | — |
| comissão | text | não | — |
| parecer operação | text | não | — |
| observação | text | **sim** | — |
| declínios | custom.fornecedor | **sim** | — |
| quais etapas | custom.etapas_opera__o | **sim** | — |
| fee (yes/no) | boolean | não | — |
| nda assinado | boolean | não | — |
| mandato assinado | boolean | não | — |
| mandatoassinadofor | boolean | não | — |
| Estruturação em Andamento | boolean | não | — |
| arquivado | boolean | não | `false` |
| **(excluídos)** declínios, na mão de, observação, status.tbl, na mão de.tbl, nome operação, qual operação, status operação, fundos sugeridos, observações, tipo de operação, operações sugeridas, fundos sugeridos (list), qual operação (custom), fundos sugeridos (list custom) | vários | — | — |

**Privacy rules**

| Regra | Condição | Permite |
|---|---|---|
| autobinding | `Current User is logged in` | view all, find in searches, anexos e auto-binding em 24 campos |
| everyone | (sem condição) | view all, find in searches, anexos e **auto-binding em 19 campos** (carência, demanda inicial, limites/fundos assinados, prazo, nome cliente txt, destino do recurso, mandato assinado, quais etapas, declínios (excluído), faturamento anual, parecer operação, qual cliente, demanda final, garantias sugeridas, PMTS, tipo operação, observação, Estruturação em Andamento, declínios) |

**Ponto crítico:** `everyone` com auto-binding permite gravar nesses 19 campos sem login.

---

## 2.5 tbl.etapas operação (`etapas_opera__o`)

| Campo | Tipo | Lista? |
|---|---|---|
| qual operação etapa | custom.opera__o | não |
| qual cliente | custom.cliente | não |
| qual cliente txt | text | não |
| fundo etapa | custom.fornecedor | não |
| fornecedor nome | text | não |
| status etapa | option.status_tbl | não |
| tipo operação etapa | option.tipo_opera__o | não |
| instrumento | option.tipo_opera__o | **sim** |
| na mão de etapa | text | não |
| DtInicio | date | não |
| volume | text | não |
| Emissor | text | não |
| Estruturador | text | não |
| Custodiante | text | não |
| Admnistrador | text | não |
| AgenteFiduciario | text | não |
| AssessoriaLegal | text | não |
| securitizadora | text | não |
| DTVM | text | não |
| Gesto | text | não |
| Demais | text | não |
| Opdepe | boolean | não |
| TsAssinado | boolean | não |
| FeeRecebido | boolean | não |
| ArquivosDesc / ArquivosValue | text / number | não |
| RegulamentoDesc / RegulamentoValue | text / number | não |
| CnrtdeCessãoDesc / ContratoDeCessãoValue | text / number | não |
| ContratoCobrançaDesc / ContratoCobrançaValue | text / number | não |
| IntegralizaçãoSubDesc / IntegralizaçãoSubValue | text / number | não |
| IntSeniorDesc / IntSeniorValue | text / number | não |
| INcDCDesc / IncDCValue | text / number | não |
| nomeCmp1..nomeCmp4 | text | não |
| Cmp1Desc..Cmp4Desc | text | não |
| Cmp1Value..Cmp4Value | number | não |
| **(excluídos)** Gesto (antigo), Cmp4Desc (number), tipo da operação, tipo de operação, obeservações, IntegralizaçãoSubDesc (number) | vários | — |

Estrutura de checklist: cada item da esteira tem um par Desc/Value (Value guarda o estado numérico do passo; Desc, a observação).

**Privacy rules**

| Regra | Condição | Permite |
|---|---|---|
| everyone | (sem condição) | view all, find in searches, anexos e auto-binding em 7 campos (fundo etapa, qual operação etapa, na mão de etapa, status etapa, qual cliente, tipo operação etapa, qual cliente txt) |
| autobinding | `Current User is logged in` | o mesmo, com auto-binding em 52 campos |

---

## 2.6 Tabelas auxiliares de observação e info

### Tbl.observações (`tbl_observa__es`)

| Campo | Tipo |
|---|---|
| cpo.observação | text |
| cpo.qualoperação | custom.opera__o |

Privacy: `everyone` → view all, find in searches, anexos. `autobinding` (`Current User is logged in`) → + auto-binding em cpo.observação.

### Tbl.Etapas da operação (observações) (`tbl_etapas_da_opera__o__observa__es_`)

| Campo | Tipo |
|---|---|
| cpo.observação | text |
| cpo.QualOperaçãoEtapa | custom.etapas_opera__o |

Privacy: idêntica à anterior.

### Tbl.InfoCliente (`tbl_infocliente`)

| Campo | Tipo |
|---|---|
| emailcliente | text |
| qualcliente | custom.cliente |
| emailcliente **(excluído)** | text |

Privacy: `everyone` → view all, find in searches, anexos. `autobinding` (`Current User is logged in`) → + auto-binding em emailcliente e qualcliente.

### tbl.config (`tbl_config`)

| Campo | Tipo |
|---|---|
| User | user |
| qualPagina | option.p_ginas |
| NívelDeAcesso | option.niveldeacesso |

Privacy: `everyone` → view all, find in searches, anexos. `autobinding` (`Current User is logged in`) → + auto-binding nos 3 campos.

Esta tabela é a matriz de permissão de acesso: liga um usuário a uma página e a um nível.

---

## 2.7 Funil (CRM)

### funilcartao (`funilcartao`) — exposto na Data API

| Campo | Tipo | Lista? | Padrão |
|---|---|---|---|
| Empresa | text | não | — |
| Contato | text | não | — |
| Segmento | text | não | — |
| Faturamento | text | não | — |
| Indicante | text | não | — |
| Parecer | text | não | — |
| Historico | text | não | — |
| Quadro | text | não | — |
| Ordem | number | não | `0` |
| DataKB | date | não | — |
| DataCall | date | não | — |
| DataAtualizacao | date | não | — |
| Arquivado | boolean | não | `false` |
| Usuarios | user | **sim** | — |
| QualEtapa | custom.funiletapa | não | — |
| QuaisTags | custom.funiltag | **sim** | — |

Privacy: `everyone` → **nada** (todos os campos como non-filterable); `Api Connect` (`Current User is logged in`) → view all, find in searches, criar/modificar/apagar via API, anexos.

### funiletapa (`funiletapa`) — exposto na Data API

| Campo | Tipo | Padrão |
|---|---|---|
| NomeEtapa | text | — |
| Quadro | text | — |
| Ordem | number | — |
| NoFluxo | boolean | `true` |

Privacy: `everyone` → nada; `api connect` (`Current User is logged in`) → view all, find in searches, criar/modificar/apagar via API, anexos.

### funiltag (`funiltag`) — exposto na Data API

| Campo | Tipo | Padrão |
|---|---|---|
| NomeTag | text | — |
| CorTag | text | — |
| Quadro | text | — |
| Ativo | boolean | `true` |

Privacy: `everyone` → nada; `api connect` (`Current User is logged in`) → view all, find in searches, criar/modificar/apagar via API, anexos.

### FunilTarefa (`funiltarefa`) — exposto na Data API

| Campo | Tipo | Lista? |
|---|---|---|
| Titulo | text | não |
| Quadro | text | não |
| Ordem | number | não |
| Prazo | date | não |
| DataConclusao | date | não |
| DataAtualizacao | date | não |
| Concluida | boolean | não |
| Responsavel | user | não |
| Usuarios | user | **sim** |
| QualCartao | custom.funilcartao | não |

Privacy:

| Regra | Condição | Permite |
|---|---|---|
| everyone | (sem condição) | view all, find in searches, criar/modificar/apagar via API, com view_fields explícito em todos os 14 campos; sem auto-binding e sem anexos |
| New rule | `Current User is logged in` | tudo, inclusive anexos |

**Ponto crítico:** `everyone` já permite criar, modificar e apagar tarefas via API sem login.

---

## 2.8 RespostasForms1 (`respostas`)

| Campo | Tipo | Lista? |
|---|---|---|
| P1 … P9 | text | não |
| P10 (campo interno `p101_text`) | text | não |
| P11 (campo interno `p10_text`) | text | não |
| P12 … P16 | text | não |
| p15 - lista | text | **sim** |

**Privacy rules: nenhuma regra cadastrada.** Sem regras, o Bubble aplica a permissão padrão e o data type fica sem restrição.

Atenção à numeração trocada: o campo interno `p10_text` aparece como "P11" e o `p101_text` como "P10".

---

## 2.9 tabela fundo (`tabela_fundo`) — data type **excluído**

Campos: status (text), na mão de (text), tipo de operação (text), qual fundo (custom.fornecedor). Sem privacy rules.

---

## 2.10 Option sets

### Páginas (`p_ginas`) — 4 opções

| Display | Valor no banco | Ordem |
|---|---|---|
| Clientes | clientes | 1 |
| Fornecedores | fornecedores | 2 |
| Operação | opera__o | 3 |
| Esteira de Estruturação | esteira_de_estrutura__o | 4 |

Atributos: apenas Display.

### NivelDeAcesso (`niveldeacesso`) — 2 opções

| Display | Valor no banco | Ordem |
|---|---|---|
| Master | master | 1 |
| Indicante | indicante | 2 |

Atributos: apenas Display.

### status.tbl (`status_tbl`) — 14 opções

| Display | Valor no banco | Ordem |
|---|---|---|
| aguardando interesse | aguardando_interesse | 1 |
| teaser enviado | teaser_enviado | 2 |
| documentação inicial enviada | documenta__o_inicial_enviada | 3 |
| docs requeridos | docs_requeridos | 4 |
| operação em análise | opera__o_em_an_lise | 5 |
| proposta feita | proposta_feita | 6 |
| em estudo | em_estudo | 7 |
| operação aprovada | opera__o_aprovada | 8 |
| contrato enviado | contrato_enviado | 9 |
| contrato assinado | contrato_assinado | 10 |
| já cliente do fundo | opera__o_declinada | 11 |
| paralisado | paralisado | 12 |
| declinado pelo fundo | declinado | 13 |
| declinado pelo cliente | declinado_pelo_cliente | 14 |

Atributos: apenas Display. Repare que "já cliente do fundo" guarda no banco `opera__o_declinada` e "declinado pelo fundo" guarda `declinado` — os valores internos não acompanham os rótulos.

### tipo operação op (`tipo_opera__o`) — 31 opções

Atributos: Display + `Custeio - deleted` (text, excluído).

| Display | Valor no banco | Ordem |
|---|---|---|
| Antecipação de Contratos | antecipa__o_de_contratos | 0 |
| Antecipação de Recebíveis | antecipa__o_de_receb_veis | 1 |
| Aquisição de Ativos | aquisi__o_de_ativos | 2 |
| BNDES | bndes | 3 |
| Câmbio | c_mbio_e_derivativos | 4 |
| Capital de Giro | capital_de_giro | 5 |
| CDA - WA | cda___wa | 6 |
| CR | cr | 7 |
| CCB | ccb | 8 |
| CCI | cci | 9 |
| CPR | cpr | 10 |
| CRA | cra | 11 |
| CRI | cri | 12 |
| Custeio | custeio | 13 |
| Debêntures | deb_ntures | 14 |
| FCO | fco | 15 |
| FGI | fgi | 16 |
| FIAGRO | fiagro | 17 |
| FIDC Proprietário | fidc_dedicado | 18 |
| FII | fii | 19 |
| FIP | fip | 20 |
| FINEP | finep | 21 |
| Home Equity | home_equity | 22 |
| Hot Money | hot_money | 23 |
| Imobiliária / Incorporadora | imobili_ria___incorporadora | 24 |
| M&A | m_a | 25 |
| Nota Comercial | nota_comercial | 26 |
| PRONAF | pronaf | 27 |
| SLB | slb | 28 |
| Venda | venda_de_ativo | 29 |
| Vendor | vendor | 30 |
# FASE 3 — Páginas e reusables (Parte 1: index, reset_pw, 404, fms, old_index, fornecedor_api)

Convenções usadas na transcrição das expressões:
`X:campo` = "X's campo"; `:get_data` = "'s value"; `:get_group_data` = "'s data"; `<...>` = trecho dinâmico dentro de um texto; `Ancestor[TableCrossAxis]` = "Parent group's Thing" dentro da linha de uma Table.

---

## 3.1 index — tela de login (página inicial)

**Propósito:** porta de entrada do sistema. Faz login, cadastro e pedido de troca de senha; ao autenticar, manda o usuário para `clientes`.

**Configurações da página:** `type of content` não definido; título `Planilha LureCapital`; sem parâmetros de URL; sem redirecionamento condicional no carregamento (o redirecionamento acontece no evento "User is logged in").

### Árvore de elementos

```
- Popup C [Popup]                      (troca de senha)
  - Group P > Group Q
    - Text P  "Digite seu email para que mandemos uma solicitação de troca de senha."
    - Group D > Text K  "Esqueci minha senha"
  - Group E > Group C
    - Button A  "Enviar solicitação "
    - Shape A
  - Group O
    - Text Q  "Email "
    - Input D  [content_format: email | placeholder: voce@exemplo.com]
  - Group R > Icon C   (fechar)
- FloatingGroup A
  - Group Login
    - Group A > Text A "Bem vindo de volta!" | Text D "Faça login na sua conta"
    - Group K > Group I
      - Group H  > Text C "Senha" | Group T > Icon B + ipt.senha [password, placeholder *********]
      - Group G  > Text B "Email" | Group S > Icon A + ipt.email [email, placeholder voce@exemplo.com]
      - Group M  [não visível no load] > Text M "Esqueceu a senha? " [não visível]
    - Button B  "Log in"
    - Text N    "Ainda não tem uma conta? [u]Sign Up[/u]"  [não visível no load]
  - Image A   [não visível no load] (logo lure cap.png)
  - Group Sign Up  [não visível no load]
    - Group N > Text O "Comece agora!" | Text O "Crie uma nova conta:"
    - Group N > Group N
      - Group N > Text O "Senha" + ipt.senhasign [password]
      - Group N > ipt.emailsign [text, placeholder voce@exemplo.com] + Text O "Email"
    - Button C  "Sign Up"
    - Text O    "Já tenho uma conta? [u]Login[/u]"
- Group B > Group F
  - HTML A  [não visível no load] — CSS de animação `@keyframes flutuar-profissional` aplicado a `#minha-logo`
  - Image C (logo) com `unique_id: minha-logo`
```

Custom states: nenhum na página.

**Conditionals** (todos apenas visuais): `This Element:is_hovered` em Icon C, Text M, Text N, Text O; `This Element:is_hovered` / `ipt.senha:is_focused` no Group T; `This Element:is_hovered` / `ipt.email:is_focused` no Group S; em `ipt.email` também `This Element:is_focused` e `This Element:isnt_valid`.

### Workflows

| WF | Evento | Ações |
|---|---|---|
| bTJPw | `User is logged in` | 1. `Go to page clientes` |
| bTMcO | `Button A is clicked` (popup troca de senha) | 1. `SendPasswordResetEmail` |
| bTMiP | `Button B is clicked` (Log in) | 1. `LogIn`; 2. `Go to page clientes` |
| bTMjP | `Button C is clicked` (Sign Up) | 1. `SignUp`; 2. `Go to page clientes` |
| bTMjc | `Text N is clicked` | 1. `ToggleElement Group Login`; 2. `ToggleElement Group Sign Up` |
| bTMju | `Text O is clicked` | 1. `ToggleElement Group Login`; 2. `ToggleElement Group Sign Up` |
| bTMkA | `Text M is clicked` | 1. `ShowElement Popup C` |
| bTMmP | `Icon C is clicked` | 1. `HideElement Popup C` |

Expressões completas:

```
WF bTMcO — 1. Send password reset email
   to      = Input D's value
   subject = "Pedido de troca de senha LureCapital"
   body    = "Olá,

Alguém (esperamos que você!) solicitou um pedido para troca de senha. Se não foi você, por favor ignore essa mensagem. Se foi você, clique no link abaixo para alterar sua senha!

Time DevLureCapital"

WF bTMiP — 1. Log the user in
   email = ipt.email's value ; password = ipt.senha's value ; remember_email = true
WF bTMiP — 2. Go to page clientes

WF bTMjP — 1. Sign the user up
   email = ipt.emailsign's value ; password = ipt.senhasign's value ; remember_email = true
WF bTMjP — 2. Go to page clientes
```

---

## 3.2 reset_pw — redefinição de senha

**Propósito:** tela para onde o link do e-mail de reset leva; o usuário digita a nova senha duas vezes.

**Configurações:** título padrão do template (`Bubble | No-code apps`); sem type of content.

```
- Group Reset Password
  ? cond: Current Page thing:less_or_equal_than(768) -> padding_top: 128 | padding_left: 16 | padding_right: 16 | padding_bottom: 74
  - Group Container > Card Reset Password > Group Content
    - Group Password copy / Group Confirm Password / Group Password  (grupos vazios)
    - Group Password copy 2
      - Text C "Nova senha:"
      - Input Senha  [mandatory: false | password | placeholder ******** | not_submit_on_enter: true]
        ? cond: This Element:is_focused  -> border_color #52A8EC, sombra #52A8EC
        ? cond: This Element:isnt_valid  -> border_color #FF0000, sombra #FF0000
    - Group Password copy 3
      - Text D "Confirmar nova senha:"
      - Input Nova Senha  [mesmas propriedades e conditionals]
    - Button B "Confirmar"
  - Text Header "Reinicie sua senha" (h2)
```

### Workflow

```
WF bTMaX: Button B is clicked
   1. Reset password
      new_password       = Input Senha's value
      new_password_again = Input Nova Senha's value
      only when: Input Senha's value is not empty
   2. Make changes to a thing
      to_change = Current User
      (nenhum campo alterado — ação vazia)
```

Atenção: a ação 2 não altera campo nenhum e a 1 não confere se as duas senhas são iguais; quem confere é o próprio Bubble via `new_password_again`.

---

## 3.3 404

**Propósito:** página de erro padrão do template Bubble, sem customização.

```
- Group main  (gradiente rgba(50,67,128,1) → rgba(42,61,130,1))
  - Group container > Group text content
    - Text B  "The page you're looking for does not exist. ..." (texto boilerplate em inglês)
    - Text A  "Oops! 404 error" (h1)
```

Sem workflows, sem pop-ups, sem custom states. Conteúdo ainda em inglês, do template.

---

## 3.4 fms — formulário de pesquisa (ESG / governança / crédito)

**Propósito:** questionário público de 13 perguntas que grava um registro em `RespostasForms1`.

**Configurações:** título `Planilha LureCapital`; fundo branco; sem type of content e sem parâmetros de URL.

### Elementos (perguntas e opções)

| Elemento | Tipo | Pergunta / rótulo | Opções |
|---|---|---|---|
| RadioButtons 1 | RadioButtons (1 coluna) | 1 - Qual o segmento da sua Empresa e/ou Grupo Econômico? | Indústria e Comércio; Varejo/Comércio/Revenda; Saúde; Transportes em geral; Serviços; Empresa de tecnologia; Agronegócios; Imobiliário; Entidade sem fins lucrativos; Outras |
| RadioButtons 2 | RadioButtons | 2 - Faturamento da empresa ou Grupo em 2024? | Acima de 1 bilhão; R$ 301 milhões até R$ 1 bilhão; R$ 78 milhões até R$ 300 milhões; De R$ 4,8 milhões a R$ 78 milhões; Até de 4,8 milhões |
| RadioButtons 3 | RadioButtons | 3 – Cargo do respondente | Conselheiro; Proprietário/Acionista/Cotista; Presidente/CEO; C-Level / Diretor; Controller; Gerente; Outro cargo |
| RadioButtons 4 | RadioButtons | 1 - O tema ESG está na pauta de discussões mensais da alta administração? | Sim; Não; Raramente; Nunca foi discutido |
| RadioButtons 5 | RadioButtons | 2 – Na sua visão esse tema (ESG) para os negócios é: | Relevante; Tem pouca relevância; Sem relevância; Não sei dizer |
| RadioButtons 6 | RadioButtons | 3 – Estágio das práticas de governança corporativa | Ótimo; Bom, mas pode melhorar; Regular; Inadequado; Não sei |
| RadioButtons 7 | RadioButtons | 4 – Importância da governança corporativa | Necessário; Parcialmente necessário; Desnecessário; Não sei |
| RadioButtons 8 | RadioButtons | 5 – Governança contribui para redução do custo de capital? | Sim, mas não tenho conhecimento de situações reais; Sim e conheço casos reais; Não |
| RadioButtons 9 | RadioButtons | 6 - As demonstrações contábeis são auditadas anualmente? | Sim; Não e nem temos intenção; Não, mas a administração pretende adotar |
| RadioButtons 10 | RadioButtons | 7 - Classifique por ordem de importância | Auditoria das demonstrações contábeis; Conselho de Administração; Conselho Consultivo; Comitês de assessoramento; Código de Conduta; Política de Sustentabilidade; Compliance; Canal de Denúncia; Gerenciamento de riscos; Acordo de acionistas; Diversidade |
| RadioButtons 11 | RadioButtons | 8 - É dependente de recursos de terceiros onerosos? | Sim; Não; Raramente |
| RadioButtons 12 | RadioButtons | 9 - Pretende acessar o mercado de capitais em 2025? | Sim, é comum para nós; Sim, mas serão as primeiras operações; Por enquanto não |
| RadioButtons 13 | RadioButtons | 10 - Quando toma crédito, busca em: | Bancos / Cooperativas de Crédito; Fundos / Securitizadoras / Assets; Mútuos ou operações com os próprios sócios; BNDES, FCO ou outra linha subsidiada; Outra fonte; Não somos tomadores |
| RadioButtons 14 | RadioButtons | 11 - O que dificultou ou onerou a aprovação dos empréstimos? (até 3) | Indisponibilidade da garantia; Ausência de Balanço Auditado; Ausência de Conselho de Administração; Ausência de práticas de Sustentabilidade; Resultados/margens não eram bons; Volume maior do que o ofertado; Empresa muito alavancada; Empresa ou sócio com restrição; Nunca tivemos dificuldade; Outro motivo. Descreva: |
| Checkbox A … G | Checkbox | 12 - O que impede tomar crédito em Mercado de Capitais? (até 2) | A: Nada, apenas não conhecemos…; B: Acho arriscado; C: Acredito que os juros sejam mais altos; D: Muito burocrático…; E: Excesso de garantias requeridas; F: Já uso recursos do Mercado de Capitais; G: Outro motivo. Descreva: |
| MultilineInput A | MultiLineInput | campo livre do "Outro motivo" | `is_visible: false` no load — `? cond: Checkbox A:get_data -> is_visible: true` (o conditional aponta para o Checkbox A, e não para o G, que é o "Outro motivo") |
| RadioButtons 16 | RadioButtons | 13 - Já estruturou operação dedicada? | Nunca; Sim, CRA ou FIAGRO; Sim, FIDC ou CR; Sim, CRI; Sim, Nota Comercial; Sim, emitimos Debêntures; Sim, outra |
| Button A | Button | "Enviar Formulário" | — |

Todos os RadioButtons têm `computed_value: text`.

### Workflows

```
WF bTKZF: Button A is clicked
   1. Create a new thing (thing_type: RespostasForms1)
      p1_text   ← RadioButtons 1's value
      p101_text ← RadioButtons 10's value      (campo com display "P10")
      p10_text  ← RadioButtons 11's value      (campo com display "P11")
      p12_text  ← RadioButtons 12's value
      p13_text  ← RadioButtons 13's value
      p14_text  ← RadioButtons 14's value
      p16_text  ← RadioButtons 16's value
      p2_text   ← RadioButtons 2's value
      p3_text   ← RadioButtons 3's value
      p4_text   ← RadioButtons 4's value
      p5_text   ← RadioButtons 5's value
      p6_text   ← RadioButtons 6's value
      p7_text   ← RadioButtons 7's value
      p8_text   ← RadioButtons 8's value
      p9_text   ← RadioButtons 9's value
      p15___lista_list_text [add] Checkbox A's value
   2. [plugin 1658328157117x953686184769617900-AAT]  (ação de toast/alerta)
      AAF = "Formulário enviado com sucesso!"

WF bTKqz: Checkbox A is clicked
   1. Create a new thing (thing_type: RespostasForms1)   — sem nenhum campo preenchido
```

Pontos de atenção: o campo `p11` nunca é gravado (não há RadioButtons 15 ligado); apenas o Checkbox A entra na lista `p15 - lista`, então B a G não são salvos; o MultilineInput do "Outro motivo" não é gravado; e o WF bTKqz cria um registro vazio a cada clique no Checkbox A.

---

## 3.5 old_index — tela de login antiga (legado)

**Propósito:** versão anterior da tela de login, substituída pela `index`. Continua publicada e funcional.

```
- Group A
  - Image A (logo)
  - Text A "Área administrativa particular da Lure Capital"
  - Text B "Faça seu login"
  - Group B > Text C "[fa]mouse-pointer[/fa]  Login" | Text D "... Sign up"
- Popup Login
  - Text E "Faça seu login" | Icon A
  - ipt.loginemail [email] | ipt.loginsenha [password]
  - Text F "Email:" | Text G "Senha:" | Text H "Não tenho conta"
  - Text I "... Login" | Text L "Esqueci minha senha"
- Popup Sign Up
  - Text J "Faça seu cadastro" | Icon B
  - ipt.cadastroemail [email] | ipt.cadastrosenha [password]
  - Text J "Email:" / "Senha:" / "Já tenho uma conta" / "... Cadastrar"
- Popup C (esqueci minha senha)
  - Text K "Esqueci minha senha"
  - Group C > Input D [email, placeholder Email] + Button A "Enviar solicitação "
  - Group D, Group E (vazios)
```

Conditionals: em todos os "botões" de texto, `This Element:is_hovered:or_(This Element:is_pressed)` → borda `#9DA9E8` e fundo `rgba(19,22,40,1)`; `This Element:isnt_clickable` → borda `#6C7FEB` e fundo `rgba(24,28,50,0.5)`. Em Text L, `This Element:is_hovered` → cor da fonte `var(--color_bTJfr1_default)`.

### Workflows

| WF | Evento | Ações |
|---|---|---|
| bTJOX | Text I clicado | 1. `LogIn` (email: ipt.loginemail's value; password: ipt.loginsenha's value); 2. `Go to page clientes` |
| bTJPF | Text J clicado | 1. `SignUp` (ipt.cadastroemail / ipt.cadastrosenha); 2. `Go to page clientes` |
| bTJPN | Text C clicado | 1. `ShowElement Popup Login` |
| bTJPX | Text D clicado | 1. `ShowElement Popup Sign Up` |
| bTJPe | Text H clicado | 1. `ShowElement Popup Sign Up`; 2. `HideElement Popup Login` |
| bTJPl | Text J clicado | 1. `ShowElement Popup Login`; 2. `HideElement Popup Sign Up` |
| bTJPw | User is logged in | 1. `Go to page clientes` |
| bTMcO | Button A clicado | 1. `Send password reset email` (to: Input D's value) |
| bTMdF | Text L clicado | 1. `ShowElement Popup C` |

---

## 3.6 fornecedor_api — tabela de fornecedores (somente leitura)

**Propósito:** listagem em tabela dos fornecedores/fundos ativos. Não tem workflow nenhum — parece uma tela de teste do componente Table.

**Configurações:** título `Planilha LureCapital`; sem type of content.

```
- Group B
  - Table A [Table]
      data_source: Do a search for fornecedor where arquivado_boolean equals false
      group_type (type of content): fornecedor
    - TableMainAxis A ×3
    - TableCrossAxis A  (linha de cabeçalho)
      - Cell A > Text A "Nome"
      - Cell A > Text A "Tipos de operação"
      - Cell A > Text A "Faturamento minimo"
      - Cell A > Text A "Operação minima"
      - Cell A > Text A "Segmento foco"
      - Cell A  (vazia)
      - Cell B > Text C "Parecer Fornecedor"
    - TableCrossAxis A  (linha de dados; fixed_number_repeating_axis: false, count 3)
      ? cond: This Element:is_hovered -> bgcolor rgba(var(--color_primary_default_rgb),0.04)
      - Cell A > Text A  = Parent group's fornecedor's nome do fundo
          ? cond: ...nome_do_fundo_text:is_empty -> text: "-"
          ? cond: This Element:is_hovered -> font_color var(--color_bTJfr1_default), font_size 20
      - Cell A > Text A  = Parent group's fornecedor's tipos de operações:display
          ? cond: ...:display:count:less_or_equal_than(0) -> text: "-"
      - Cell A > Text A  = Parent group's fornecedor's faturamento minimo   (cond is_empty -> "-")
      - Cell A > Text A  = Parent group's fornecedor's operação mínima      (cond is_empty -> "-")
      - Cell A > Text A  = Parent group's fornecedor's segmento foco        (cond is_empty -> "-")
      - Cell A > Group A [data_source: Parent group's fornecedor | type: fornecedor]
          - Icon A ×3  (cada um com cond is_hovered -> bgcolor rgba(160,160,160,0.2)) — sem workflow ligado
      - Cell C > Text B = Parent group's fornecedor's parecer fornecedor
    - TableMainAxis A ×3, Column F [TableMainAxis]
```

**Workflows:** nenhum. Os três ícones de ação da linha não fazem nada.
# FASE 3 — Parte 2: Reusable elements

---

## 3.7 header (reusable, tipo Group) — barra superior + painel administrativo

**Propósito:** cabeçalho presente nas telas internas. Traz logo, botão de configurações (painel admin com controle de acesso por página e cadastro de usuários), troca de senha e logout.

### Árvore de elementos

```
- Group A
  - Image A  (logo lure cap.png)
  - Icon A  [is_visible: false]
    ? cond: Current User's NivelDeAcesso = Option NivelDeAcesso "indicante" -> min_width 30px
  - Group L
    - Icon G  (sair)
      ? cond: This Element:is_hovered -> icon: ionic filled exit | title_attribute: "Sair"
    - Group Z  (Configurações)
      ? cond: This Element:is_hovered -> bgcolor rgba(202,203,204,0.2)
      ? cond: Current User's NivelDeAcesso = "indicante" -> is_visible: false
      - Text T "Configurações" | Icon B
    - Icon I [is_visible: true]  (troca de senha)
      ? cond: This Element:is_hovered -> icon: ionic filled lock-closed
- Popup A  (Painel Administrativo)
  - Group B > Group B > Group B
    - Text A "Painel Admnistrativo"
    - Button G "Adicionar Maicon a todos os clientes"
  - Group B  (bloco "Acesso às páginas")
    - Group D  (cabeçalho clicável) > Icon E, Group E > Icon D + Text A "Acesso às páginas"
    - Table A [Table]  [is_visible: false]
        data_source: All Páginas (option set)   |   type of content: option.p_ginas
      - TableCrossAxis A (cabeçalho): "Página" | "Nível de Acesso" | "Usuários"
      - TableCrossAxis A (linha):
        - Cell A > Text E = Parent group's Páginas:display
        - Cell A > Multidropdown A [plugin select2-MultiDropdown]
            data_source: All NivelDeAcesso  |  dynamic_type: option.niveldeacesso
            auto_binding: true  |  placeholder "Escolha as opções"
            option_display_expression: This option's display
        - Cell A > Multidropdown B [plugin select2-MultiDropdown]
            data_source: Do a search for user  |  dynamic_type: user
            option_display_expression: This user's email
  - Group F  (bloco "Usuários")
    - Group F (cabeçalho) > Icon F, Group F > Icon F + Text F "Usuários"
    - Group N [is_visible: false]
      - Button A "Novo Usuário"
      - Group NewUser [is_visible: false]
        - Group H > Text G "Email: " + Input Email [email, placeholder user@exemplo.com]
        - Group I > Text H "Cargo" + dd cargoNewUser [Dropdown]
            data_source: All NivelDeAcesso | option_display_expression: This option's display
        - Group J > Group Senha [type of content: text] > Text K "Senha: <Parent group>"
        - Group M > Button C "Salvar " | Button B "Cancelar"
      - Table B [Table]  data_source: Do a search for user | type of content: user
        - TableCrossAxis B (cabeçalho): "Nome" | "Nível de Acesso" | "Email" | "Senha"
        - TableCrossAxis B (linha):
          - Text F  = Parent group's User's Nome
          - Text J  = Parent group's User's NivelDeAcesso:display
          - txt emailuser = Parent group's User's email
          - Text Y  = Parent group's User's senha
  - Group C > Icon C  (fechar)
- Popup C  [type of content: user]  — cadastro/edição de usuário
  - vários Group O/R/S/T/AZ/P/Y/Q/V/W/X/U  [data_source: Parent group | type: user]
    - Input D  content: Parent group's User's Nome     | bind_field: nome_text        | auto_binding: true
    - Dropdown B (mandatory) data_source: All NivelDeAcesso | bind_field: niveldeacesso_option_niveldeacesso | auto_binding: true
    - Input C  content: Parent group's User's CPF       | bind_field: cpf_text        | auto_binding: true
    - Input Telefone content: Parent group's User's CPF | bind_field: telefone_text   | auto_binding: true   ← conteúdo inicial aponta para o CPF
    - Input E  placeholder "Escolha o parceiro"         | bind_field: vinculado_a_parceiro_text | auto_binding: true
    - Input F  placeholder "razão social"               | bind_field: raz_o_social_text | auto_binding: true
    - Input F  placeholder "CNPJ"                       | bind_field: cnpj_text        | auto_binding: true
    - Input F  placeholder "Região"                     | bind_field: regi_o_text      | auto_binding: true
    - Input B  content: Parent group's User's email     | auto_binding: false
  - Group BZ
    - Button Salvar [is_visible: false]
        ? cond: Parent group is not empty -> is_visible: true
        ? cond: Parent group is empty -> is_visible: false
    - Button Criar [is_visible: false]
        ? cond: Parent group is not empty -> is_visible: false
        ? cond: Parent group is empty -> is_visible: true
  - Group O > Icon H  (fechar)
- Popup B  (Troca de Senha)
  - Group CZ > Icon J (fechar) | Text Z "Troca de Senha" | Button F "Salvar"
  - Group DZ > Text AZ "Email" + Input email user  [content: Current User's email]
  - Group EZ > Text BZ "Senha atual " + Input Senha atual [password]
  - Group FZ > Text CZ "Nova senha" + Input nova senha [password]
```

Custom states: nenhum.

### Workflows (21)

```
WF bTMQh: Page is loaded
   only when: Current User is not logged in
   1. Go to page index

WF bTMtZ: Group Z is clicked        1. Show Popup A
WF bTMxU: Icon C is clicked         1. Hide Popup A
WF bTMyD: Icon G is clicked         1. Log the user out   2. Go to page index
WF bTMyQ: Group D is clicked        1. Toggle Table A
WF bTMzj: Group F is clicked        1. Toggle Group N
WF bTMyd: Button A is clicked       1. Show Popup C   2. Reset relevant inputs (Popup C)
WF bTMzS: Button B is clicked       1. Toggle Group NewUser  2. Toggle Button A  3. Toggle Table B

WF bTMwl: Button B is clicked
   1. Create an account for someone else   (email: Input Email's value)
   2. Assign a temp password  (user: Result of step 1)
   3. Display data in Group Senha  (data_source: Result of step 2)

WF bTMzv: Button C is clicked
   1. Create an account for someone else
        email = Input Email's value
        NivelDeAcesso ← dd cargoNewUser's value
   2. Assign a temp password  (user: Result of step 1)
   3. Display data in Group Senha (data_source: Result of step 2)

WF bTNHu: Button Criar is clicked
   1. Create an account for someone else
        email = Input B's value
        CNPJ            ← Input F's value
        CPF             ← Input C's value
        NivelDeAcesso   ← Dropdown B's value
        Nome            ← Input D's value
        Razão Social    ← Input F's value
        Região          ← Input F's value
        Telefone        ← Input Telefone's value
        Vinculado a parceiro ← Input E's value
   2. Assign a temp password (user: Result of step 1)
   3. Make changes to a thing
        to_change = Result of step 1 (usuário criado)
        senha ← Result of step 2 (a senha temporária, gravada em texto)
   4. Send email
        to      = Result of step 1's email
        subject = "Nova Conta"
        sender_name = "LureCapital"
        body    = "[size=3]Olá [b]<Result of step 1's Nome>[/b]![/size]

[size=3]Você foi cadastrado no sistema da [b]LureCapital[/b].[/size]

[size=3]Acesse <Website Home> e faça login com as seguintes credenciais:[/size]

[size=3][b]Email de login:[/b] <Result of step 1's email>[/size]

[size=3][b]Senha:[/b] <Result of step 2>[/size]

[size=3]Bem vindo ao sistema LureCapital![/size]"

WF bTNUe: Button Salvar is clicked
   1. Make changes to a thing (to_change: Parent group — o User do popup)
        CNPJ ← Input F's value ; CPF ← Input C's value ; NivelDeAcesso ← Dropdown B's value ;
        Nome ← Input D's value ; Razão Social ← Input F's value ; Região ← Input F's value ;
        Telefone ← Input Telefone's value ; Vinculado a parceiro ← Input E's value
   2. Hide Popup C

WF bTNLf: txt emailuser is clicked
   1. Show Popup C
   2. Display data in Popup C (data_source: Parent group's User da linha da tabela)

WF bTNQQ: Icon H is clicked          1. Hide Popup C
WF bTNUr: Popup C is closed          1. Reset relevant inputs
WF bTNTF: txt emailuser is clicked   (sem ações)
WF bTNPn: Input B's value changed    [workflow desativado]

WF bTNYb: Icon I is clicked          1. Show Popup B
WF bTNYm: Icon J is clicked          1. Hide Popup B
WF bTNYO: Button F is clicked
   1. Update the user's credentials
        password = Input nova senha's value
        old_password = Input Senha atual's value
        change_password = true ; do_not_show_success_alert = true
   2. Make changes to Current User:  senha ← Input nova senha's value
   3. [plugin toast] "Senha atualizada com sucesso!"
   4. Hide Popup B

WF bTNal: Button G is clicked ("Adicionar Maicon a todos os clientes")
   1. Make changes to a list of things
        type_to_change = cliente
        to_change      = Do a search for cliente   (sem restrição — todos os clientes)
        quem visualiza [add] Do a search for user where _id = "1724347578001x492302103806268900":first item
```

Pontos de atenção: a senha do usuário é gravada em texto no campo `senha` (WF bTNHu ação 3 e WF bTNYO ação 2) e exibida na coluna "Senha" da Table B; o `Input Telefone` tem como conteúdo inicial o CPF; e o botão "Adicionar Maicon a todos os clientes" grava um usuário fixo (ID cravado na expressão) em todos os clientes.

---

## 3.8 MenuNavegação (reusable, tipo FloatingGroup) — menu lateral

**Propósito:** menu lateral flutuante das telas internas, com destaque da página atual e itens escondidos conforme o nível de acesso.

```
- FloatingGroup A  [float_zindex: front]
  ? cond: Current User's NivelDeAcesso = "indicante" -> container_vert_alignment: flex-start
  - Group 3 copy 2 → "Funil de Clientes"
      ? cond: This Element:is_hovered and Current Page Name ≠ "funilclientes" -> bgcolor rgba(130,130,130,0.15)
      ? cond: Current Page Name = "funilclientes" -> bgcolor var(--color_bTJfr1_default)
      ? cond: Current User's NivelDeAcesso = "indicante" -> is_visible: true
      - Text B "Funil de Clientes" (h6) + Icon B  (conditionals de cor/hover equivalentes)
  - Group 3 copy → "Esteira de Estruturação"
      ? cond: Current User's NivelDeAcesso = "indicante" -> is_visible: false
  - Group 3 → "Operação"
  - Group 2 → "Fornecedor"
      ? cond: Current User's NivelDeAcesso = "indicante" -> is_visible: false
  - Group 1 → "Cliente"
```

Padrão dos conditionals em todos os itens: hover quando não é a página atual → fundo cinza claro; página atual → fundo azul da marca e texto/ícone em cor de contraste.

### Workflows

| WF | Evento | Ação |
|---|---|---|
| bTOEZ | Group 3 copy 2 clicado | `Go to page funilclientes` |
| bTNNW | Group 3 copy clicado | `Go to page esteira_de_estrutura__o` |
| bTNNd | Group 3 clicado | `Go to page operacao` |
| bTNNF | Group 2 clicado | `Go to page fornecedor` |
| bTNNP | Group 1 clicado | `Go to page clientes` |

O acesso por página gravado em `tbl.config` não é usado aqui: o menu esconde itens apenas pelo `NivelDeAcesso` do usuário.

---

## 3.9 navegação (reusable, tipo Group) — menu antigo

**Propósito:** menu horizontal legado, substituído pelo MenuNavegação.

```
- Text A "Clientes"   ? cond: (condição vazia) -> (sem mudança)
- Text B "Fornecedor"
- Text C "Operação"
```

| WF | Evento | Ação |
|---|---|---|
| bTIUt | Text B clicado | `Go to page fornecedor` |
| bTIVD | Text C clicado | `Go to page operacao` |

Text A ("Clientes") não tem workflow: o item não leva a lugar nenhum.
# FASE 3 — Parte 3: página `clientes`

**Propósito:** tela principal de clientes. Lista os clientes ativos (com busca por nome), permite criar, editar, arquivar, desarquivar e deletar cliente, gerenciar os e-mails do cliente e definir quem enxerga cada cliente.

**Configurações da página:** título `Bubble | No-code apps` (não customizado); fundo `var(--color_bTNLv_default)`; sem type of content; sem parâmetros de URL; sem custom states de página. A proteção de acesso vem do reusable `header` (redireciona para `index` se o usuário não estiver logado).

---

## Árvore de elementos

```
- Popup cliente [Popup]  [type of content: cliente]           ← cadastro/edição
  - Group V (vários aninhados, todos data_source: Parent group / type: cliente)
    - ipt.cnpj                 [Input]  content: Parent group's cliente's CNPJ
    - ipt.nome/razão social    [Input]  content: ...nome/razão | bind_field: nome_raz_o_text | auto_binding: true
    - ipt.atividadecia         [Input]  content: ...ativiade da CIA
    - ipt.passivo-oneroso      [Input]  content: ...passivo oneroso
    - ipt.ativos               [Input]  content: ...ativos
    - ipt.margemliquida        [Input]  content: ...margem líquida
    - ipt.faturamento anual    [Input]  content: ...faturamento anual
    - ipt.parecer              [MultiLineInput] content: ...parecer.cliente
    - ipt.estfaturamento       [Input]  content: ...estimativa de faturamento
    - ipt.demanda              [Input]  content: ...demanda
    - dd.sttscliente           [Dropdown] default: ...status cliente | computed_value: text
         choices: contato inicial / mandato-nda em negociação / mandato assinado com fee / mandato assinado sem fee
    - ipt.diretor              [Input]  content: ...diretor/gerente
    - ipt.telefone             [Input, int_number] content: ...telefone
    - ipt.cidade               [Input]  content: ...cidade
    - bttn cria cliente [Text] "Cadastrar"
        ? cond: This Element:is_hovered or is_pressed -> bgcolor rgba(0,149,232,1)
        ? cond: This Element:isnt_clickable -> bgcolor rgba(134,193,255,1)
        ? cond: Parent group's cliente's nome/razão is not empty -> text: "Salvar" | bgcolor var(--color_bTJft1_default)
        ? cond: is_hovered and Parent group's nome/razão is not empty -> bgcolor rgba(var(--color_bTJft1_default_rgb),0.8)
    - Group I
      - RepeatingGroup B  [type: Tbl.InfoCliente | 1 linha fixa | is_visible: false]
          data_source: Do a search for Tbl.InfoCliente where qualcliente = Parent group (cliente)
          ? cond: This Element's list of things:count is not empty -> is_visible: true
          ? cond: This Element's list of things:count ≤ 0 -> is_visible: false
        - Icon G  (apagar e-mail)
        - Input C  content: Parent group's Tbl.InfoCliente's emailcliente | bind_field: email_text | auto_binding: true
            ? cond: Parent group is not empty -> is_visible: true
      - Group Q > Text V "Email" + Icon E  (abrir popup de e-mail)
    - Group S
      - Group P  [is_visible: false]
          ? cond: Current User's _id = "1724347578001x492302103806268900" -> is_visible: true
        - ipt.quemvisualiza [plugin select2-MultiDropdown]
            default: Parent group's cliente's quem visualiza
            data_source: Do a search for user | dynamic_type: user
            option_display_expression: This user's Nome
        - Text C "Quem visualiza:"
      - Group O > ipt.quemindicou [Input] content: ...quem indicou + Text G "Quem indicou "
  - Group T > Icon D  (fechar)
- header A [reusable header]
- Popup Deletar [Popup] [type: cliente]
  - grupo PopupDeletar Cabecalho > Text F "Deletar Cliente" + Icon B
  - grupo PUDeletar Corpo > Text F: "Tem certeza que deseja deletar o cliente [b]<Parent group's cliente's nome/razão>[/b]?\n\nEssa ação é permanente e não pode ser revertida."
  - grupo PUDeletar Botões > Text F "Cancelar" | Text F "[fa]trash[/fa]  Deletar"
- Popup Adiconar/Editar Email [Popup] [type: cliente]
  - grupo PUeditar Cabecalho > Text A "Adicionar Email" + Icon F
  - grupo PUeditar Corpo > ipt.emailcliente [Input]
  - grupo PUeditar Rodape > Text A "Fechar" | Text A "[fa]pencil[/fa]  Salvar"
- Group D  [type of content: cliente]
  - Group B (vazio)
  - Group C
    - RepeatingGroup A  [type: cliente]
        data_source: Do a search for cliente where arquivado = false
                     :filtered( nome/razão:to_uppercase contains Input D's value:to_uppercase
                                AND quem visualiza contains Current User )
        ? cond: This Element:is_hovered -> (sem mudança)
        ? cond: Input D's value is not empty -> (sem mudança)
      - Group E [data: Parent group's cliente]
          ? cond: is_hovered -> bgcolor rgba(var(--color_primary_default_rgb),0.04)
        - Text E = Parent group's cliente's nome/razão
        - Group G > Icon C (lixeira) | Icon A (lápis) | Icon I (arquivar)
    - Group R > Button A "Novo Cliente" | Input D [placeholder "Buscar clientes", unique_id: inputclientes]
    - Group N   ← bloco "Arquivados"
        ? cond: Current User's NivelDeAcesso = "indicante" -> is_visible: false
      - rpg.arquivados [RepeatingGroup, 2 linhas, type: cliente]
          data_source: Do a search for cliente where arquivado = true
          ? cond: Page Loaded (Entire) -> is_visible: false
          ? cond: This Element's list:count = 0 -> is_visible: false
          ? cond: Current User's NivelDeAcesso = "indicante" ->
              data_source: Do a search for cliente where arquivado = true AND Created By = Current User
                           :filtered( nome/razão:to_uppercase contains Input D's value:to_uppercase )
        - Group qualoperação [data: Parent group's cliente]
          - Group N > icn.deletararquivado | icn.editararquivado | Icon H (desarquivar)
          - Group N > txt.qual cliente arquivados = Parent group's cliente's nome/razão
      - Group N > icn.reduzir [is_visible: false] | icn.expandir | Text B "Arquivados " | Icon H
- MenuNavegação A [reusable MenuNavegação]
```

---

## Workflows (22)

```
WF bTIKB: bttn cria cliente is clicked            (evento marcado em verde)
   only when: Parent group's cliente's nome/razão is not empty      ← modo EDIÇÃO
   1. Make changes to a thing (to_change: Parent group's cliente)
        ativiade da CIA ← ipt.atividadecia's value
        ativos ← ipt.ativos's value
        cidade ← ipt.cidade's value
        CNPJ ← ipt.cnpj's value
        demanda ← ipt.demanda's value
        diretor/gerente ← ipt.diretor's value
        estimativa de faturamento ← ipt.estfaturamento's value
        faturamento anual ← ipt.faturamento anual's value
        margem líquida ← ipt.margemliquida's value
        nome/razão ← ipt.nome/razão social's value
        parecer.cliente ← ipt.parecer's value
        passivo oneroso ← ipt.passivo-oneroso's value
        status cliente ← dd.sttscliente's value
        telefone ← ipt.telefone's value
        quem indicou ← ipt.quemindicou's value
        quem visualiza [add list] ipt.quemvisualiza's value
   2. Hide Popup cliente
   3. Make changes to a thing (to_change: Result of step 1)
        quem visualiza [add] Do a search for user where _id = "1724347578001x492302103806268900":first item
   4. Make changes to a thing (to_change: Result of step 1)
        quem visualiza [add] Current User

WF bTILr: bttn cria cliente is clicked            (evento marcado em verde)
   only when: Parent group's cliente's nome/razão is empty          ← modo CRIAÇÃO
   1. Create a new thing (thing_type: cliente) — mesmos campos do WF acima, sem "quem visualiza"
   2. Hide Popup cliente
   3. Make changes to Result of step 1: quem visualiza [add] usuário fixo "1724347578001x492302103806268900"
   4. Make changes to Result of step 1: quem visualiza [add] Current User

WF bTILB: Button A ("Novo Cliente") is clicked    1. Show Popup cliente
WF bTIKk: Icon A (lápis) is clicked               1. Show Popup cliente  2. Display Parent group's cliente in Popup cliente
WF bTJib: Text E (nome do cliente) is clicked     1. Show Popup cliente  2. Display Parent group's cliente in Popup cliente
WF bTIPW: Popup cliente is closed                 1. Reset group Popup cliente
WF bTOGD: Icon D is clicked                       1. Hide Popup cliente

WF bTIaD: Icon C (lixeira) is clicked             1. Show Popup Deletar  2. Display Parent group's cliente in Popup Deletar
WF bTIYX: Text F ("Deletar") is clicked           1. Hide Popup Deletar  2. Delete Parent group's cliente
WF bTIYQ: Text F ("Cancelar") is clicked          1. Hide Popup Deletar
WF bTIYJ: Icon B is clicked                       1. Hide Popup Deletar

WF bTKDa: Icon E is clicked                       1. Show Popup Adiconar/Editar Email  2. Display Parent group's cliente nele
WF bTKDT: Text A ("Salvar") is clicked
   1. Create a new thing (thing_type: Tbl.InfoCliente)
        emailcliente ← ipt.emailcliente's value
        qualcliente  ← Parent group's cliente
   2. Reset relevant inputs
   3. Hide Popup Adiconar/Editar Email
WF bTKGB: Text A ("Fechar") is clicked            1. Hide Popup Adiconar/Editar Email
WF bTKFr: Icon F is clicked                       1. Hide Popup Adiconar/Editar Email
WF bTKEp: Icon G is clicked                       1. Delete Parent group's Tbl.InfoCliente

WF bTKNQ: Icon I (arquivar) is clicked            1. Make changes: arquivado ← yes (Parent group's cliente)
WF bTKNX: Icon H (desarquivar) is clicked         1. Make changes: arquivado ← no (Parent group's cliente)
WF bTKMz: icn.expandir is clicked                 1. Show rpg.arquivados  2. Show icn.reduzir  3. Hide icn.expandir
WF bTKNJ: icn.reduzir is clicked                  1. Hide rpg.arquivados
WF bTKNp: icn.reduzir is clicked                  1. Hide rpg.arquivados  2. Hide icn.reduzir  3. Show icn.expandir
WF bTNPf0: Input D's value is changed             (sem ações)
```

---

## Observações da tela

- Os ícones do bloco "Arquivados" (`icn.deletararquivado`, `icn.editararquivado`) não têm workflow: só o desarquivar (Icon H) funciona.
- `icn.reduzir` tem dois workflows para o mesmo clique (bTKNJ e bTKNp), com a primeira ação repetida.
- O ID de usuário `1724347578001x492302103806268900` aparece cravado em três lugares (WF bTIKB, WF bTILr e no conditional do Group P), funcionando como "usuário master" fixo.
- O RepeatingGroup principal faz `Do a search for` com dois `:filtered` de busca avançada, que rodam no cliente e não usam índice.
# FASE 3 — Parte 4: página `funilclientes`

**Propósito:** funil comercial (kanban) de prospecção. O quadro inteiro é um componente HTML/JS próprio embutido na página; o resto da tela são os mesmos pop-ups de cliente da página `clientes`.

**Configurações:** título `Bubble | No-code apps`; fundo `var(--color_bTNLv_default)`; sem type of content e sem parâmetros de URL; sem custom states.

---

## Árvore de elementos

```
- Group D [type of content: cliente]
  - Group C
    - HTML A [HTML]   ← 74.744 caracteres de HTML/CSS/JS: o funil comercial completo
  - Group B (vazio)
- Popup cliente [Popup] [type: cliente]        — idêntico ao da página `clientes`
    (ipt.cnpj, ipt.nome/razão social, ipt.atividadecia, ipt.passivo-oneroso, ipt.ativos,
     ipt.margemliquida, ipt.faturamento anual, ipt.parecer, ipt.estfaturamento, ipt.demanda,
     dd.sttscliente, ipt.diretor, ipt.telefone, ipt.cidade, RepeatingGroup B de e-mails,
     ipt.quemvisualiza, ipt.quemindicou, bttn cria cliente)
    Diferença: o botão usa o texto "[fa]mouse-pointer[/fa]  Cadastrar" / "Salvar".
- header A [reusable header]
- Popup Deletar [Popup] [type: cliente]
- Popup Adiconar/Editar Email [Popup] [type: cliente]
- MenuNavegação A [reusable MenuNavegação]
```

---

## O componente HTML do funil

Não é um kanban feito com elementos Bubble: é uma aplicação JavaScript dentro de um elemento HTML, que fala direto com a **Data API do próprio app** (`/api/1.1/obj/...`), usando a sessão do navegador (`credentials: 'include'`) — por isso as privacy rules de `funilcartao`, `funiletapa` e `funiltag` exigem usuário logado.

**Base da URL:** calculada em tempo de execução — lê `location.pathname`, detecta o prefixo `/version-xxx/` e monta `location.origin + prefixo`; há uma constante `RAIZ` de fallback apontando para `https://planilha-lurecapital.bubbleapps.io/version-test`.

**Contexto vindo do Bubble:** o código lê dois elementos de texto da página (`ctxUid` e `ctxEmail`) para saber quem é o usuário logado; os placeholders no código são `INSIRA DYNAMIC TEXT AQUI (UNIQUE ID)` e `INSIRA DYNAMIC TEXT AQUI (EMAIL)`.

**Data types usados:** `funilcartao`, `funiletapa`, `funiltag` e `user`. `FunilTarefa` **não** é usado por este componente.

**Campos manipulados:** Empresa, Contato, Segmento, Faturamento, Indicante, Parecer, Historico, Quadro, Ordem, DataKB, DataCall, DataAtualizacao, Arquivado, Usuarios, QualEtapa, QuaisTags (cartão); NomeEtapa, Quadro, Ordem, NoFluxo (etapa); NomeTag, CorTag, Quadro, Ativo (tag).

**Métodos HTTP usados:** POST (criar), PATCH (atualizar) e DELETE (excluir), além de GET com paginação por `cursor` e `constraints`.

**Funções principais do script** (nomes originais):

| Bloco | Funções |
|---|---|
| Acesso a dados | `carregar`, `gravar`, `commit`, `flush`, `set`, `salvarCampos`, `carregarUsuarios` |
| Permissão e filtro | `podeVer`, `cartoesDa`, `renderFiltros`, `etapasVisiveis` |
| Renderização | `render`, `renderBoard`, `cardHTML`, `pinta`, `tint`, `paleta`, `atualizarRotulo`, `rotuloUser` |
| Arrastar e soltar | `iniciarArraste`, `posicionarSlot`, `aplicarMovimento`, `soltar`, `mover`, `moverEtapa`, `salvarOrdemEtapas`, `acharScroller`, `medidas`, `sincronizar` |
| Cartões e colunas | `novoCartao`, `abrirCartao`, `arquivarCartao`, `novaColuna`, `abrirTags`, `abrirFluxo`, `criar` |
| Interface auxiliar | `modal`, `confirmar`, `aviso`, `sinal`, `avisarEmBranco`, `fechar`, `fecharFora`, `aoSair`, `explodir`, `ligarEventosBoard`, `ligarTexto`, `fmtData`, `agora` |

O cartão tem um pop-up próprio (feito em HTML) com os campos Empresa, Contato, Segmento, Faturamento, Indicante, Parecer e Histórico, além de tags e datas; há barra horizontal fixa no rodapé e reordenação de colunas por arraste.

[NÃO VERIFICADO] Não transcrevi as 74 mil letras do script linha a linha nesta documentação. Se você quiser, exporto o arquivo completo do HTML como anexo — o conteúdo está acessível no editor.

---

## Workflows (11)

São os mesmos da página `clientes`, sem os de arquivamento e busca:

```
WF bTIKB: bttn cria cliente is clicked  (only when Parent group's cliente's nome/razão is not empty)
   1. Make changes to Parent group's cliente — mesmos 16 campos da página clientes
      (inclui quem visualiza [add list] ipt.quemvisualiza's value)
   2. Hide Popup cliente
   3. Make changes to Result of step 1: quem visualiza [add] usuário "1724347578001x492302103806268900"
   4. Make changes to Result of step 1: quem visualiza [add] Current User

WF bTILr: bttn cria cliente is clicked  (only when Parent group's cliente's nome/razão is empty)
   1. Create a new cliente (mesmos campos)
   2. Hide Popup cliente
   3. + 4. mesmas duas ações de "quem visualiza"

WF bTIPW: Popup cliente is closed               1. Reset group Popup cliente
WF bTIYJ: Icon B is clicked                     1. Hide Popup Deletar
WF bTIYQ: Text F ("Cancelar") is clicked        1. Hide Popup Deletar
WF bTIYX: Text F ("Deletar") is clicked         1. Hide Popup Deletar  2. Delete Parent group's cliente
WF bTKDa: Icon E is clicked                     1. Show Popup Adiconar/Editar Email  2. Display data nele
WF bTKDT: Text A ("Salvar") is clicked          1. Create Tbl.InfoCliente (emailcliente ← ipt.emailcliente's value; qualcliente ← Parent group)  2. Reset inputs  3. Hide popup
WF bTKEp: Icon G is clicked                     1. Delete Parent group's Tbl.InfoCliente
WF bTKFr: Icon F is clicked                     1. Hide Popup Adiconar/Editar Email
WF bTKGB: Text A ("Fechar") is clicked          1. Hide Popup Adiconar/Editar Email
```

Nenhum workflow Bubble conversa com o funil: a integração é toda pela Data API dentro do HTML.
# FASE 3 — Parte 5: página `fornecedor`

**Propósito:** cadastro e consulta de fornecedores (fundos/instituições). Tem duas visões alternadas — "Fornecedores" (tabela de fundos com busca) e "Tipo Operações" (matriz de tipo de operação × fundos que atendem em 1ª e 2ª linha) — além do bloco de arquivados e do pop-up de cadastro/edição.

**Configurações:** título `Bubble | No-code apps`; fundo branco; sem type of content; sem parâmetros de URL; sem custom states.

---

## Árvore de elementos

```
- Group D
  - Group C [type of content: fornecedor]
    ? cond: (condição vazia) -> (sem mudança)
    - Table A [Table]  [type: fornecedor]
        data_source: Do a search for fornecedor where arquivado = false
                     :filtered( nome do fundo:to_uppercase contains Input B's value:to_uppercase )
      - TableCrossAxis A (cabeçalho): "Nome" | "Tipos de operação" | "Faturamento minimo" | "Operação minima" | "Segmento foco" | (vazia)
      - TableCrossAxis A (linha):
          ? cond: is_hovered -> bgcolor rgba(var(--color_primary_default_rgb),0.04)
        - Text Z  = Parent group's fornecedor's nome do fundo   (cond is_empty -> "-"; hover -> azul, fonte 20)
        - Text AZ = ...tipos de operações:display               (cond count ≤ 0 -> "-")
        - Text BZ = ...faturamento minimo                        (cond is_empty -> "-")
        - Text CZ = ...operação mínima                           (cond is_empty -> "-")
        - Text DZ = ...segmento foco                             (cond is_empty -> "-")
        - Group I [data: Parent group's fornecedor]
            - Icon D (lixeira) | Icon D (lápis) | Icon C (arquivar)
    - Group A [data: Parent group | type: fornecedor]
      - Button A "Novo Fundo"
      - Group X
        - Multidropdown B [select2-MultiDropdown]  [is_visible: false]
            data_source: All tipo operação op | placeholder "Buscar Operações"
        - Input B  [placeholder "Buscar fornecedores"]
    - Group M  ← bloco "Arquivados"
      - Group M > icn.reduzir [is_visible: false] | icn.expandir | Text A "Arquivados " | Icon E
      - tbl.arquivados [Table]  [is_visible: false]
          data_source: Do a search for fornecedor where arquivado = true
                       :filtered( nome do fundo:to_uppercase contains Input B's value:to_uppercase )
          ? cond: tbl.arquivados's list of things:count = 0 -> is_visible: false
        - cabeçalho e colunas iguais aos da Table A
        - ações da linha: Icon F (lixeira) | Icon F (lápis) | Icon F (desarquivar)
    - Group R  ← abas
      - Button C "Tipo Operações "   ? cond: is_hovered or Table C is visible -> borda inferior azul, 5px
      - Button B "Fornecedores "     ? cond: is_hovered or Table A is visible -> borda inferior azul, 5px
    - Table C [Table]  [type: option.tipo_opera__o]  [is_visible: false]
        data_source: All tipo operação op:filtered( This option is in Multidropdown B's value )
        ? cond: Multidropdown B's value:count = 0 -> data_source: All tipo operação op
      - TableCrossAxis C (cabeçalho): "Nome" | "1° Linha" | "2° Linha" | "Habilitados"
      - TableCrossAxis C (linha):
        - Text D = Parent group's option:display
        - Text D = Table A's list of things:filtered( 1°Linha contains Parent group's option )'s nome do fundo
        - Text D = Table A's list of things:filtered( 2°Linha contains Parent group's option )'s nome do fundo
        - Cell K:
          - Text I [is_visible: false] = Table A's list:filtered( tipos de operações contains Parent group's option )'s nome do fundo
          - RepeatingGroup A  [4 colunas × 6 linhas fixas, type: fornecedor]
              data_source: Table A's list of things:filtered( tipos de operações contains Parent group's option )
            - Text N = Parent group's fornecedor's nome do fundo   (hover -> sublinhado azul)
  - Group B > Group G (vazios)
- Popup A [Popup] [type: fornecedor]   ← cadastro/edição de fornecedor
  - dd.tiposoperaçõesnao [select2-MultiDropdown]
      default: Parent group's fornecedor's tipos de operações
      data_source: All tipo operação op:sorted(display, ascendente)
      bind_field: tipos de operações não atendidas | auto_binding: true | tags em vermelho
  - ipt segmento que não atua [Input] content: ...segmento foco | bind_field: segmento que não atua | auto_binding: true
  - ipt.segmento foco [Input]  content: ...segmento foco
  - ipt.faturamentominimo [select2-MultiDropdown]  (2° Linha)
      data_source: All tipo operação op:filtered( This option is not in dd.tiposoperaçõesnao's value )
      bind_field: 2°Linha | auto_binding: true
  - ipt.faturamentominimo [select2-MultiDropdown]  (1° Linha)  — mesmo nome, bind_field: 1°Linha | auto_binding: true
  - ipt.pf ou pj [Input] content: ...PF ou PJ
  - ipt.contato [Input] content: ...contato
  - dd.tiposoperações [select2-MultiDropdown] default: ...tipos de operações | data_source: All tipo operação op:sorted(display)
  - ipt.numero [Input] content: ...numero
  - ipt.email [Input] content: ...email fornecedor
  - ipt.cidade [Input] content: ...cidade fornecedor
  - ipt.parecer [MultiLineInput] content: ...parecer fornecedor
  - ipt.fee [Input] content: ...Fee
  - ipt.faturamentominimo [Input] content: ...faturamento minimo
  - ipt.operação mínima [Input] content: ...operação mínima
  - ipt.link [Input] bind_field: link de indicação | auto_binding: true
  - dd.status [Dropdown] default: ...status
      choices: contato inicial / contrato-nda em negociação / contrato-nda assinado com fee / nda assinado sem fee
  - ipt.nomefundo [Input] content: ...nome do fundo
  - Text Q "[fa]mouse-pointer[/fa]  Cadastrar"
      ? cond: Parent group's fornecedor's nome do fundo is not empty -> text "Salvar", bgcolor var(--color_bTJft1_default)
  - Group BZ > Icon A  (fechar)
- header A [reusable header]
- Popup Deletar [Popup] [type: fornecedor]
  - Text F "Deletar Fornecedor" | Icon B
  - Text F: "Tem certeza que deseja deletar o fornecedor [b]<Parent group's fornecedor's nome do fundo>[/b]?\n\nEssa ação é permanente e não pode ser revertida."
  - Text F "Cancelar" | Text F "[fa]trash[/fa]  Deletar"
- MenuNavegação A [reusable MenuNavegação]
```

---

## Workflows (20)

```
WF bTIOI: Button A ("Novo Fundo") is clicked     1. Show Popup A
WF bTIPK: Popup A is closed                      1. Reset group Popup A
WF bTNrc: Icon A is clicked                      1. Hide Popup A

WF bTNjk: Text Q is clicked   (evento marcado em vermelho)
   only when: Parent group's fornecedor's nome do fundo is empty       ← CRIAÇÃO
   1. Create a new thing (thing_type: fornecedor)
        contato ← ipt.contato's value
        email fornecedor ← ipt.email's value
        faturamento minimo ← ipt.faturamentominimo's value
        Fee ← ipt.fee's value
        nome do fundo ← ipt.nomefundo's value
        numero ← ipt.numero's value
        operação mínima ← ipt.operação mínima's value
        parecer fornecedor ← ipt.parecer's value
        segmento foco ← ipt.segmento foco's value
        status ← dd.status's value
        tipos de operações [set list] dd.tiposoperações's value
        cidade fornecedor ← ipt.cidade 's value
        PF ou PJ ← ipt.pf ou pj's value
        link de indicação ← ipt.link's value
   2. Hide Popup A
   3. Reset relevant inputs

WF bTNjl: Text Q is clicked
   only when: Parent group's fornecedor's nome do fundo is not empty    ← EDIÇÃO
   1. Make changes to Parent group's fornecedor — exatamente os mesmos campos acima
   2. Hide Popup A
   3. Reset relevant inputs

WF bTIjn: Icon D (lápis) is clicked              1. Show Popup A   2. Display Parent group's fornecedor em Popup A
WF bTJoD: Text Z (nome) is clicked               1. Show Popup A   2. Display Parent group's fornecedor (linha da tabela) em Popup A
WF bTNrD: Text N is clicked                      1. Show Popup A   2. Display Parent group's fornecedor em Popup A
WF bTNqb: Text I is clicked
   1. Show Popup A
   2. Display data em Popup A:
        Table A's list of things:filtered( tipos de operações contains Parent group's option ):first item

WF bTIjf: Icon D (lixeira) is clicked            1. Show Popup Deletar  2. Display Parent group's fornecedor
WF bTIZS: Text F ("Deletar") is clicked          1. Hide Popup Deletar  2. Delete Parent group's fornecedor
WF bTIZL: Text F ("Cancelar") is clicked         1. Hide Popup Deletar
WF bTIZB: Icon B is clicked                      1. Hide Popup Deletar

WF bTKRA: Icon C is clicked                      1. Make changes: arquivado ← yes (linha da Table A)
WF bTKRH: Icon F is clicked                      1. Make changes: arquivado ← no  (linha da tbl.arquivados)
WF bTKPZ: icn.expandir is clicked                1. Show icn.reduzir  2. Hide icn.expandir  3. Show tbl.arquivados
WF bTKPN: icn.reduzir is clicked                 1. Hide icn.reduzir  2. Show icn.expandir  3. Hide tbl.arquivados

WF bTNfi: Button C ("Tipo Operações") is clicked
   1. Toggle Table A  2. Toggle Table C  3. Toggle Input B  4. Toggle Multidropdown B
WF bTNgA: Button B ("Fornecedores") is clicked   — exatamente as mesmas 4 ações do WF acima
WF bTNgl: Text D is clicked                      (sem ações)
```

---

## Observações da tela

- Os botões das abas ("Fornecedores" e "Tipo Operações") executam a mesma sequência de toggles, então qualquer um dos dois alterna as visões; não existe estado "aba ativa" de verdade.
- No pop-up, o campo `ipt segmento que não atua` mostra como conteúdo inicial o **segmento foco**, embora grave em "segmento que não atua".
- Três elementos diferentes se chamam `ipt.faturamentominimo` (dois multidropdowns de linha e um input de faturamento), o que confunde a leitura dos workflows.
- Os ícones de lixeira e lápis do bloco de arquivados (`Icon F`) só têm workflow para desarquivar; o delete e o editar de arquivados não fazem nada.
- A Table C monta a matriz com vários `:filtered` sobre a lista da Table A — processamento no navegador, que cresce com o número de fundos.
# FASE 3 — Parte 6: página `respforms1`

**Propósito:** tela de consulta das respostas do formulário `fms`. Mostra uma tabela com uma coluna por pergunta e uma linha por resposta.

**Configurações:** título `Planilha LureCapital`; fundo branco; sem type of content; sem parâmetros de URL; sem custom states; nenhum workflow; sem header nem menu (a tela não tem proteção de login).

## Árvore de elementos

```
- Group Q > Image A (logo)
- Table tbl.Historico [Table]
    type of content: RespostasForms1
    unique_id: tabel | table_direction: vertical | is_visible: true
    data_source: NÃO DEFINIDO        ← a tabela não tem fonte de dados
  - TableCrossAxis A (cabeçalho, textos h6):
      "1 - Qual o segmento da sua Empresa e/Ou Grupo Econômico?"
      "2 – Faturamento da empresa ou Grupo em 2024"
      "3 – Cargo do respondente"
      "4 - O tema ESG está na pauta de discussões mensais da alta administração (Conselho, CEO, CFO e demais executivos)?"
      "5 – Na sua visão esse tema (ESG) para os negócios da empresa ou Grupo empresarial"
      "6 – Na sua avaliação qual o estágio das práticas de governança corporativa na empresa ou Grupo que trabalha?"
      "7 – Classifique a importância da governança corporativa para a empresa ou Grupo Empresarial que trabalha"
      "8 – Na sua avaliação você acredita que uma adequada Governança contribui para redução do custo de capital?"
      "9 - As demonstrações contábeis da empresa e/ou Grupo Econômico onde trabalha são auditadas anualmente?"
      "10 - Em relação aos itens a seguir, classifique por ordem de importância..."
      "11 - A Empresa onde trabalha é dependente de recursos de terceiros onerosos (empréstimos)?"
      "12 - A Empresa ou Grupo Econômico onde trabalha pretende acessar o mercado de capitais em busca de crédito em 2025?"
      "13 - A Empresa onde trabalha, quando toma crédito, usualmente busca em:"
      "14 - Quando sua empresa buscou crédito, o que dificultou ou onerou a aprovação dos empréstimos? (marque até 3 opções)"
      "15 - O que impede que a empresa onde você trabalha tome crédito em Mercado de Capitais? (marque até 2 opções)"
      "16 - A empresa onde trabalha já estruturou uma operação dedicada (exclusiva para a companhia)? Se sim, qual?"
  - TableCrossAxis A (linha de dados)
      ? cond: This Element:is_hovered -> bgcolor rgba(231,231,231,0.6)
      células, na ordem em que aparecem: p1_text, p3_text, p4_text, p5_text, p6_text, p7_text,
      p8_text, p9_text, p101_text, p10_text, p12_text, p13_text, p14_text, p15_text, p16_text, p2_text
      (cada uma = Parent group's RespostasForms1's <campo>)
  - 15 colunas (TableMainAxis) de layout
```

## Pontos de atenção

- A tabela **não tem data_source**: a tela nunca mostra resposta nenhuma.
- Uma das células aponta para `p15_text`, campo que não existe no data type (as respostas da pergunta 15 ficam em `p15 - lista`).
- Os números das perguntas estão deslocados em relação à tela `fms`: o que lá é "1 a 13" aqui aparece como "1 a 16".
- A página não tem o reusable `header`, então não há verificação de login: quem tiver a URL abre a tela.
# FASE 3 — Parte 7: página `esteira_de_estrutura__o`

**Propósito:** acompanhamento da estruturação das operações já contratadas. Lista as operações "em estruturação" e, no pop-up, mostra a esteira de etapas com barras de progresso por documento/marco, campos do instrumento (FIDC/CRA/Debênture…) e observações.

**Configurações:** título `Bubble | No-code apps`; fundo branco; sem type of content na página; sem parâmetros de URL.

## Custom states

| Dono | State | Tipo | Padrão |
|---|---|---|---|
| Página | etapas | lista de tbl.etapas operação | — |
| Página | Edita item | text | — |
| Página | tab op/for | boolean | — |
| Página | arquivado visivel | boolean | — |
| Página | fundotemoperações | boolean | `false` |
| Página | fornecedores sugeridos | lista de fornecedor | — |
| pop.Esteira | modo edição | boolean | — |
| gp obs | editing_observation | text | — |

---

## Expressões recorrentes

O pop-up inteiro pendura seus grupos numa mesma busca aninhada, repetida dezenas de vezes (chamo de **EXPR-ETAPA**):

```
Do a search for tbl.etapas operação
   where qual operação etapa = pop.Esteira's operação
     AND fundo etapa = ( Do a search for tbl.etapas operação
                           where qual operação etapa = pop.Esteira's operação
                             AND fundo etapa = ( Do a search for tbl.etapas operação
                                                   where qual operação etapa = pop.Esteira's operação
                                                     AND status etapa = Option status.tbl "contrato assinado"
                                               ):first item's fundo etapa
                       ):first item's fundo etapa
:first item
```

Ou seja: a etapa exibida é a do fundo cuja etapa está com status "contrato assinado" — resolvido por três buscas encaixadas, uma dentro da outra. Algumas variações usam `Parent group` no lugar de `pop.Esteira's operação` e uma delas filtra por `fornecedor nome`.

Duas outras expressões longas:

```
(A) data_source do Rpg Operações:
Do a search for operação where arquivado = false AND Estruturação em Andamento = true
  :filtered( nome cliente txt is in
             Do a search for tbl.etapas operação
               where status etapa = Option status.tbl "contrato assinado" 's qual cliente txt )

    ? cond Input Buscar's value is not empty -> mesma busca + :filtered( busca avançada pelo texto digitado )

(B) data_source do dd instrumentos:
All tipo operação op:filtered( This option's display contains "CRA":display
   or contains "CRI" or "CR" or "FIDC Proprietário" or "FIAGRO" or "FII" or "SLB" or "Debêntures" )

(C) Text F "Instituição Líder":
Do a search for tbl.etapas operação
   where qual operação etapa = Parent group's operação
     AND status etapa = Option status.tbl "contrato assinado"
   :first item's fundo etapa's nome do fundo
```

---

## Árvore de elementos (resumida por blocos, com as ligações de dados)

```
- Group D [type: operação]
  - Group Mainmenu > Group ClientesMain
    - Rpg Operações [RepeatingGroup, 2 linhas, type: operação]   data_source: (A)
      - Group qualoperação [data: Parent group's operação]
        - Group M > Icon D (lápis)
        - Group BZ
          - txt.qual cliente copy = Parent group's operação's identificador   (cond is_empty -> invisível)
          - txt.qual cliente = " - " + ...qual cliente's nome/razão
              ? cond identificador is empty -> text: ...nome cliente txt
    - Group Q > Icon O + Input Buscar [placeholder "Buscar"]
    - HTML B  [is_visible: false]  (bloco de HTML de 334 caracteres)
  - Group Sidemenu > Group A (vazio)

- pop.Esteira [Popup] [type: operação]     ← esteira de etapas
  - gp.operação [data: Parent group]
    - Bloco de checklist — o padrão abaixo se repete para cada item:
        Group (data_source: EXPR-ETAPA)
          Text "<rótulo do item>:"
          Group (EXPR-ETAPA)
            Text "%<BetterSliderInput X's value>"
            BetterSliderInput X [plugin Better Slider Input]
                AAE 100 (máximo) | AAU 2 | AAV/AAW 25 | AAX 200 | cores da marca
                ACK (valor): Parent group's <campo>Value
            Shape [is_visible: false]
          MultiLineInput  bind_field: <campo>Desc | auto_binding: true | alert_element: Alert A

      | Item | Rótulo na tela | Slider | Campo Value | Campo Desc | Campo de nome |
      |---|---|---|---|---|---|
      | 1 | Integralização de cota sub: | C | IntegralizaçãoSubValue | IntegralizaçãoSubDesc | — |
      | 2 | Integralização de cotas senior e mezo: | D | IntSeniorValue | IntSeniorDesc | — |
      | 3 | Inclusão de DC: | E | IncDCValue | INcDCDesc | — |
      | 4 | (campo livre 1) | F | Cmp1Value | Cmp1Desc | nomeCmp1 (Input J) |
      | 5 | (campo livre 2) | G | Cmp2Value | Cmp2Desc | nomeCmp2 (Input K) |
      | 6 | (campo livre 3) | H | Cmp3Value | Cmp3Desc | nomeCmp3 (Input L) |
      | 7 | (campo livre 4) | I | Cmp4Value | Cmp4Desc | nomeCmp4 (Input M) |
      | 8 | Regulamento: | A | RegulamentoValue | RegulamentoDesc | — |
      | 9 | Arquivos de Remessa e Retorno: | B | ArquivosValue | ArquivosDesc | — |
      | 10 | Contrato de Cessão | J | ContratoDeCessãoValue | CnrtdeCessãoDesc | — |
      | 11 | Contrato de Cobrança | K | ContratoCobrançaValue | ContratoCobrançaDesc | — |

    - Group XZ > Text EZ "OBSERVAÇÕES"
    - group Instrumento (EXPR-ETAPA)
      - Text C "Instrumento: "
      - dd instrumentos [select2-MultiDropdown]
          default: Parent group's etapa's instrumento | data_source: (B)
          bind_field: instrumento | auto_binding: true
    - Group G [data: Parent group]
      - txt.qual cliente copy = ...identificador | txt.qual cliente = " - " + ...qual cliente's nome/razão | Text B "Operação: "
    - Group H (EXPR-ETAPA) > Text D "Volume: " + ipt volume [bind_field: volume | auto_binding: true | símbolo R$]
    - Group I > Text E "Instituição Líder:" + Text F = expressão (C)
    - Group FIDC FIAGRO [is_visible: false]
        ? cond: dd instrumentos's value contains "FIDC Proprietário" or "FIAGRO" or "FII" or "SLB" -> is_visible: true
      - Text G "FIDC, FIAGRO, FII, SLB"
      - Gestor → Input B (bind: Gesto) | Admnistrador → Input C (bind: Admnistrador)
      - DTVM → Input E (bind: DTVM) | Assessoria Legal → Input G (bind: AssessoriaLegal)
      - Demais → MultilineInput B (bind: Demais)
    - Group CRA, CRI, CR [is_visible: false]
        ? cond: dd instrumentos's value contains "CRA" or "CRI" or "CR" -> is_visible: true
      - Securitizadora → ipt securitizadora | DTVM → ipt dtvm | Agente Fiduciário → ipt agente fiduciario
      - Custodiante → Input H | Demais → MultilineInput C
    - Group Debenture [is_visible: false]
        ? cond: dd instrumentos's value contains "Debêntures" -> is_visible: true
      - Emissor → Input I | Estruturador → Input I | Agente Fiduciário → Input I | DTVM → Input I | Demais → MultilineInput D
    - Group U (EXPR-ETAPA) > Text P "Inicio: " + Date/TimePicker A [bind_field: DtInicio | auto_binding: true]
    - Group W (EXPR-ETAPA) > Text S "Ts Assinado: " + tgg.fee [plugin Switch] bind_field: TsAssinado | auto_binding: true
    - Group BZZZ (EXPR-ETAPA) > "Operação de pé:" + tgg.fee bind_field: Opdepe | auto_binding: true
    - Group CZZZ (EXPR-ETAPA) > "Fee Recebido:" + tgg.fee bind_field: FeeRecebido | auto_binding: true
    - gp obs (EXPR-ETAPA)   * state: editing_observation (text)
        ? cond: Parent group's nome cliente txt is empty -> is_visible: false
      - Icon A (adicionar observação) | Icon A [is_visible: false]
      - tbl.observações [Table] [unique_id: obs | vertical]
          data_source: Do a search for Tbl.Etapas da operação (observações)
                       where cpo.QualOperaçãoEtapa = Parent group's etapa
          ? cond: Page Loaded (Entire) -> is_visible: true
        - cabeçalho: "Lista de Etapas"
        - linha: Icon A + Group Y
            - Text T "Modificado em: <linha's Modified Date>"
            - ipt.observação aa [MultiLineInput] content: linha's cpo.observação | bind_field: cpo.observação | auto_binding: true
    - 8 elementos órfãos sem tipo (bTLre, bTLrx, bTLsT, bTLsm, bTLsx, bTLtF, bTLtL, bTLtR)
    - Text T "Adicionar etapa:"
    - Button A "Salvar" | Shape A
  - Group PZ > Icon C (fechar)

- Popup Adiconar/Editar Observação [Popup] [type: tbl.etapas operação]
  - Icon E (fechar) | Text Q "Adicionar Obervação "
  - Text Q "Descrição da observação:" + ipt.observações [MultiLineInput, placeholder "Escreva aqui"]
  - Text Q "Fechar" | Text Q "[fa]pencil[/fa]  Salvar"
- Alert A [Alert] "Informações Salvas!"
- header A [reusable header]
- Popup Deletar Operação [Popup] [type: operação]
  - Text Y "Deletar Operação" | Icon G
  - Text Y: "Tem certeza que deseja deletar a operação associada a [b]<Parent group's operação's nome cliente txt>[/b]?\n\nEssa ação é permanente e não pode ser revertida."
  - Text Y "Cancelar" | Text Y "[fa]trash[/fa]  Deletar"
- Popup Deletar Observação [Popup] [type: operação]
  - Text Deletar Observação | Icon K
  - Text CZ: "Tem certeza que deseja deletar essa observação?\n\nEssa ação é permanente e não pode ser revertida."
  - Text CZ "Cancelar" | Text CZ "[fa]trash[/fa]  Deletar"
- MenuNavegação A [reusable MenuNavegação]
```

---

## Workflows (34)

```
WF bTMVp: Page is loaded                    1. Set focus to Input Buscar
WF bTMVj: Input Buscar's value is changed   (sem ações)

WF bTJgR: txt.qual cliente is clicked       1. Show pop.Esteira  2. Display Parent group's operação em pop.Esteira
WF bTJrZ: Icon D is clicked                 1. Show pop.Esteira  2. Display Parent group's operação em pop.Esteira
WF bTNRX: Icon C is clicked                 1. Hide pop.Esteira
WF bTIPd: pop.Esteira is closed
   1. Reset group pop.Esteira
   2. Set state "etapas" da página (sem valor — limpa a lista)
   3. Set state "modo edição" de pop.Esteira ← false

WF bTMNx: Button A ("Salvar") is clicked
   1. Make changes to Parent group's operação   (nenhum campo alterado)
   2. Hide pop.Esteira
   3. [plugin toast] "Informações salvas!"

— Sliders (plugin Better Slider Input), evento "valor alterado":
WF bTMRK: BetterSliderInput A → Make changes: RegulamentoValue ← This Element's value
WF bTMUK: BetterSliderInput B → ArquivosValue ← This Element's value
WF bTMUR: BetterSliderInput C → IntegralizaçãoSubValue ← This Element's value
WF bTMUb: BetterSliderInput D → IntSeniorValue ← This Element's value
WF bTMUi: BetterSliderInput E → IncDCValue ← This Element's value
WF bTMUp: BetterSliderInput F → Cmp1Value ← This Element's value
WF bTMUz: BetterSliderInput G → Cmp2Value ← This Element's value
WF bTMVG: BetterSliderInput H → Cmp3Value ← This Element's value
WF bTMVN: BetterSliderInput I → Cmp4Value ← This Element's value
WF bTNRA: BetterSliderInput J → ContratoDeCessãoValue ← This Element's value
WF bTNZz: BetterSliderInput K → ContratoCobrançaValue ← This Element's value
   (todos com to_change: Parent group's tbl.etapas operação)

— Sliders antigos (plugin Slider And Multislider), TODOS DESATIVADOS (workflow_disabled: true):
WF bTMOK, bTMOc, bTMPG, bTMPZ, bTMPk, bTMPv, bTMQD, bTMQZ
   1. Make changes: IntSeniorValue ← This Element's value   (os oito gravam o MESMO campo)
   2. Show Alert A  (nos seis últimos)
WF bTMQt (desativado)
   1. Make changes: RegulamentoValue ← This Element's value

— Observações:
WF bTMVT: Icon A is clicked
   1. Show Popup Adiconar/Editar Observação
   2. Display Parent group's tbl.etapas operação nele
WF bTHaL: Text Q ("Salvar") is clicked   (evento marcado em azul)
   1. Create a new thing (thing_type: Tbl.Etapas da operação (observações))
        cpo.QualOperaçãoEtapa ← Parent group's etapa
        cpo.observação ← ipt.observações's value
   2. Reset relevant inputs
   3. Hide Popup Adiconar/Editar Observação
WF bTHaB: Text Q ("Fechar") is clicked      1. Hide Popup Adiconar/Editar Observação
WF bTNRx: Icon E is clicked                 1. Hide Popup Adiconar/Editar Observação

— Exclusão de operação:
WF bTIWd: Text Y ("Deletar") is clicked
   1. Hide Popup Deletar Operação
   2. Delete a list of things: Parent group's operação's quais etapas  (type: tbl.etapas operação)
   3. Delete thing: Parent group's operação
WF bTIWT: Text Y ("Cancelar") is clicked    1. Hide Popup Deletar Operação
WF bTIWM: Icon G is clicked                 1. Hide Popup Deletar Operação
```

---

## Pontos de atenção

- **Salvar não salva:** o Button A executa um "Make changes" sem nenhum campo. Os dados são gravados por auto-binding nos inputs e pelos workflows dos sliders.
- **Buscas aninhadas em três níveis** (EXPR-ETAPA) repetidas em dezenas de grupos: cada abertura do pop-up dispara muitas buscas equivalentes. É o maior gargalo de performance do app.
- **Nove workflows desativados** apontam para os sliders antigos e oito deles gravam no mesmo campo (`IntSeniorValue`), resquício de copiar e colar.
- O `Popup Deletar Operação` e o `Popup Deletar Observação` não têm workflow que os abra nesta página — só os de fechar e confirmar.
- Existem 8 elementos órfãos sem tipo dentro de `gp.operação`.
- O `Popup Deletar Observação` tem type of content `operação`, e não a tabela de observações.
# FASE 3 — Parte 8: página `operacao`

**Propósito:** tela central do sistema. Lista as operações do usuário, cadastra/edita operação com suas etapas por fundo, acompanha o painel de status (Inicial / Em andamento / Operação Aprovada / Excluído ou Paralisado), mostra a visão por fundo parceiro e dispara o e-mail de status para o cliente com as tabelas anexadas como imagem.

**Configurações:** título `Bubble | No-code apps`; fundo `rgba(249,250,251,1)`; pasta de workflow `bTNnP = "Email"`; sem type of content na página; sem parâmetros de URL.

## Custom states

| Dono | State | Tipo | Padrão |
|---|---|---|---|
| Página | etapas | lista de tbl.etapas operação | — |
| Página | Edita item | text | — |
| Página | tab op/for | boolean | — |
| Página | arquivado visivel | boolean | — |
| Página | fundotemoperações | boolean | `false` |
| Página | fornecedores sugeridos | lista de fornecedor | — |
| pop.Cadastro/Edição | modo edição | boolean | — |
| gp obs | editing_observation | text | — |

---

## Expressões longas (transcrição literal)

```
rpg operaçõesAll's data_source:
Do a search for operação where arquivado = false
  :filtered( qual cliente's quem visualiza contains Current User )

Table C's data_source (visão por fundo parceiro):
Do a search for tbl.etapas operação where fundo etapa = dd.fundoparceiro's value
  :filtered( qual operação etapa is in Do a search for operação where arquivado = false )

tbl.etapas / tbl.etapasEmail data_source:
Parent group's operação's quais etapas
  :filtered( status etapa ≠ "já cliente do fundo"(opera__o_declinada)
         AND status etapa ≠ "declinado pelo fundo"(declinado)
         AND status etapa ≠ "declinado pelo cliente" )

tbl.etapas copy 2 data_source (tabela dos declinados):
Parent group's operação's quais etapas
  :filtered( status etapa = "já cliente do fundo"(opera__o_declinada)
          or status etapa = "declinado pelo fundo"(declinado)
          or status etapa = "declinado pelo cliente" )

dd.qualcliente's data_source:
Do a search for cliente where arquivado = false
  :filtered( quem visualiza contains Current User )
  ? cond Current User's NivelDeAcesso = "indicante" ->
      Do a search for cliente where arquivado = false AND Created By = Current User
        :filtered( nome/razão:to_uppercase contains "" )

ipt.emailparacliente's conteúdo inicial:
"Olá, segue atualizações de status de suas
operações:

Cliente: <Parent group's operação's nome cliente txt>
Identificador: <Parent group's operação's identificador>

Status: <ipt.statusp/cliente's value>

att. Lure Capital"

   ? cond tgg.weekupdate's value is yes -> conteúdo:
"WEEK UPDATE

Olá, segue atualizações de status de suas
operações:

Cliente: <...nome cliente txt>
Identificador: <...identificador>

Status: <ipt.statusp/cliente's value>

att. Lure Capital"
```

---

## Árvore de elementos

```
- Group D [type: operação]
  - Group Mainmenu
    - Group Z [type: fornecedor] [is_visible: false]        ← aba "Fornecedor"
      - Text Z "Fundo parceiro:" + dd.fundoparceiro [Dropdown, data: Do a search for fornecedor]
      - Table C [type: tbl.etapas operação]  (data_source acima)
          ? cond: Page Loaded (Entire) -> is_visible: false
          ? cond: dd.fundoparceiro's value is not empty -> is_visible: true
        - cabeçalho: Cliente | Demanda inicial | Tipo de operação | Status | Demanda final
        - linha:
          - Text R = linha's qual cliente txt + "\n" + (Do a search for operação where _id = linha's _id:first item's nome cliente txt)
          - Text S = linha's qual operação etapa's demanda inicial
          - Text T = linha's tipo operação etapa:display
          - Text U = linha's status etapa:display
              ? cond display = "declinado pelo fundo" ou "declinado pelo cliente" ou "Já cliente do fundo" ou "já cliente do fundo" -> vermelho
              ? cond display = "contrato assinado" -> azul da marca
              ? cond display = "aguardando interesse" ou "teaser enviado" -> cor bTKIM
              ? cond display = "paralisado" -> rgba(255,208,0,1)
          - Text X = linha's qual operação etapa's demanda final
    - Group Butões
      - Button B "Fornecedor"   ? cond Current User's NivelDeAcesso = "indicante" -> is_visible: false
      - Button A "Cliente"
      - Button G "Status "      ? cond NivelDeAcesso = "indicante" -> is_visible: false
      - bttn.Nova Operação [Button]
    - ConverttoPNG A / B [plugin Convert To PNG] [is_visible: false]
    - Text D "Detalhes da operação"
    - Group Status [is_visible: false]         ← aba "Status", 4 colunas
      - Group YZ "Inicial"
        - RepeatingGroup C  data: Do a search for operação where Status Atual da Operação = "Inicial" AND arquivado = false
          - Text FZZ = demanda inicial + " a " + demanda final   (3 conditionals para "-" quando vazio)
          - Text FZZ = comissão
          - Text FZZ = nome cliente txt:truncated(15)   | Text JZZ = identificador
      - Group BZZ "Em andamento" → RepeatingGroup D (mesma estrutura, status "Em andamento")
        - Group NZZ [type: user] > Text MZZ "Soma: " + Input Digite a soma
            content: Current User's Soma Stts em Andamento | bind_field: soma_stts_em_andamento_text | auto_binding: false
      - Group AZZ "Operação Aprovada" → RepeatingGroup E (status "Operação Aprovada")
        - Group OZZ [type: user] > Text NZZ "Soma: " + Input G
            content: Current User's Soma Stts em Operação Aprovada | auto_binding: false
      - Group ZZ "Excluído ou Paralisado" → RepeatingGroup F (status "Excluído ou Paralisado")
    - Group ClientesMain
      - RpgOperações [RepeatingGroup, 2 linhas]  data_source: rpg operaçõesAll's list of things
        - Group qualoperação [data: Parent group's operação]
          - Group M > Icon F (lixeira) | Icon D (lápis) | Icon R (arquivar)
          - Group BZ
            - Text L = Parent group's operação's qual cliente's quem visualiza's Nome
                ? cond NivelDeAcesso = "indicante" -> is_visible: false
            - Group A > txt.qual cliente = ...qual cliente's nome/razão
                       + txt.qual cliente copy = " - " + identificador (oculto se vazio)
      - Group Arquivados   ? cond NivelDeAcesso = "indicante" -> is_visible: false
        - rpg.arquivados  data: Do a search for operação where arquivado = true
            ? cond Page Loaded (Entire) -> is_visible: false
            ? cond page's state "arquivado visivel" is yes -> is_visible: true
            ? cond page's state "arquivado visivel" is no -> is_visible: false
          - Group qualoperação > Group AZ > icn.deletararquivado | icn.editararquivado | Icon T (desarquivar)
                                 Group DZ > txt.qual cliente copy (identificador) + txt.qual cliente arquivados (nome/razão)
        - Group Y > Icon S (recolher) | Icon O (expandir) | Text C "Arquivados " | Icon U
    - Input Focus [is_visible: false]
    - rpg operaçõesAll [RepeatingGroup]  (repetidor invisível que alimenta o RpgOperações)
    - HTML B [is_visible: false]  — CSS que reposiciona o logo do Bubble
        ? cond NivelDeAcesso = "indicante" -> html vazio
  - Group Sidemenu

- pop.Cadastro/Edição [Popup] [type: operação]   * state: modo edição (boolean)
  - gp.operação [data: Parent group]
    - ipt.garantias      content: ...garantias sugeridas
    - ipt.limites/fundos content: ...limites/fundos assinados
    - ipt.declinios [select2-MultiDropdown] default: ...declínios | data: Do a search for fornecedor
        ? cond NivelDeAcesso = "indicante" -> disabled: true
        (grupo pai some quando indicante e Parent group vazio)
    - ipt.pmts / ipt.prazo / ipt.carência    contents: PMTS / prazo / carência
    - ipt.demandainicial  content: ...demanda inicial   ("Demanda em R$")
    - ipt.faturamento anual content: ...qual cliente's faturamento anual
    - ipt.pareceroperação [MultiLineInput] content: ...parecer operação
    - gp obs  * state: editing_observation
        ? cond Parent group's nome cliente txt is empty -> is_visible: false
      - Icon A (adicionar) | Icon H [oculto] | Icon J (fechar lista)
      - tbl.observações [Table] data: Do a search for Tbl.observações where cpo.qualoperação = Parent group's operação
        - linha: Icon L (excluir) + Text FZ "Modificado em: <linha's Modified Date>"
                 + ipt.observação aa [MultiLineInput] content: linha's cpo.observação | auto_binding: false
    - Group K  ? cond Parent group is empty -> visível; is not empty -> oculto
      - Text E "Escolher cliente:" + dd.qualcliente [Dropdown] (data_source acima)
    - Icon I (abrir Group etapas)
    - tbl.etapas [Table, unique_id: ops-table] (data_source acima)
        ? cond quais etapas:count < 1 AND page's state etapas:count < 1 -> is_visible: false
        ? cond Parent group is empty -> data_source: page's state "etapas"
      - cabeçalho: Fundo | Tipo de operação | Na mão de | Status | (ações) | Alterado em:
      - linha (cada célula tem versão "texto" e versão "campo", alternadas pelo state modo edição):
        - txt.fundo = linha's fundo etapa's nome do fundo     ⟷ dd.qualforncedoretapa [Dropdown, bind_field: fundo etapa, auto_binding]
        - txt.tipoperação = linha's tipo operação etapa:display ⟷ dd.operaçãoetapa [Dropdown, bind_field: tipo operação etapa, auto_binding]
        - txt.maoinput = linha's na mão de etapa               ⟷ ipt.namaodeetapa [MultiLineInput, bind_field: na mão de etapa, auto_binding]
        - txt.status = linha's status etapa:display            ⟷ dd.statusetapa [Dropdown, bind_field: status etapa, auto_binding: false]
              (mesmos conditionals de cor por status descritos na Table C)
        - Group edição na tabela > bttn.salvar (Icon C) | bttn.editar | bttn.deletar
              ? cond NivelDeAcesso = "indicante" -> Group invisível
        - Text IZZ = linha's Modified Date:formatado "dd/mm"
    - Group etapas [data: gp.operação's operação] [is_visible: false]
        ? cond NivelDeAcesso = "indicante" -> oculto ; = "master" -> visível
      - dd.tipoperaçãosugeridoetapa [Dropdown, All tipo operação op]
      - dd. fundossugeridosetapa [Dropdown, Do a search for fornecedor where arquivado = false]
      - dd.statusetapa [Dropdown, All status.tbl]
      - bttn.cadastraretapa [Icon] + ipt.namaodeetapa [Input] "Na mão de"
    - Group L  ? cond Parent group's nome cliente txt is empty -> oculto
      - Text A "Parecer Cliente" + ipt.parecercliente [MultiLineInput] content: ...qual cliente's parecer.cliente
    - Group EZ > Text BZ = ...nome cliente txt
      - Group W > Text B "Identificador de Operação" + ipt.identificador [bind_field: identificador | auto_binding: true]
    - Group GZ > Button E "Enviar Email"   ? cond NivelDeAcesso = "indicante" -> oculto
    - Group VZ > ipt.comissão (Comissão) | ipt.destinorecurso (Destino do recurso)
    - tbl.etapas copy 2 [Table, unique_id: focus-group] (data_source dos declinados)
        ? cond mesma regra de contagem -> oculto ; ? cond lista vazia -> oculto
        (mesma estrutura de linha da tbl.etapas, com Icon W no lugar do Icon C no bttn.salvar)
    - Text OZZ "[i]Status referentes à: "Já cliente do fundo, Recusado pelo Cliente, Recusado pelo Fundo".[/i]"
        ? cond tbl.etapas copy 2's list:count > 0 -> visível
    - Group RZZ
      - Group X > tgg. estruturada "Estruturação em Andamento" + tgg.fee [plugin Switch]
           AAD (valor exibido): Parent group's fee (yes/no)   |   bind_field: Estruturação em Andamento | auto_binding: true
      - bttn.cadastrar [Text] "[fa]mouse-pointer[/fa]  Cadastrar"
           ? cond Parent group's nome cliente txt is not empty -> text "Salvar", cor bTJft1
      - Button H [is_visible: false]
    - tbl.etapasEmail [Table, unique_id: ops-table2] [is_visible: false]  (mesma fonte da tbl.etapas; usada para gerar a imagem do e-mail)
    - ConverttoPNG C [plugin Convert To PNG]
    - Group WZ > Text UZ "Status Atual da Operação" + dd stts atual da operação [Dropdown]
           choices: Inicial / Em andamento / Operação Aprovada / Excluído ou Paralisado
           default: Parent group's Status Atual da Operação
    - Group S > Group JZZ
      - Group P > tgg. fee "Com fee " + tgg.fee [Switch] bind_field: fee (yes/no) | auto_binding: true
      - Group E > "Mandato assinado pelo cliente " + tgg.mandatoassinadocli [Switch] bind_field: mandato assinado | auto_binding: true
      - bTNsA [elemento órfão sem tipo] > bTHXr "Mandato assinado pelo fornecedor (sim/não)" + tgg.mandatoassinadofor (órfão)
      - Group TZZ > "Mandato assinado com o fundo " + tgg.mandatoassinado [Switch] bind_field: mandatoassinadofor | auto_binding: true
      - Group VZZ > "NDA assinado com o Cliente " + tgg.nda [Switch] bind_field: nda assinado | auto_binding: true
  - Group UZZ > Icon P (fechar)

- Popup Adiconar/Editar Observação [Popup] [type: operação]
  - Text Q "Adicionar Obervação " | Icon B
  - Text Q "Descrição da observação:" + ipt.observações [MultiLineInput, placeholder "Escreva aqui"]
  - Text Q "Fechar" | Text Q "[fa]pencil[/fa]  Salvar"
- Alert A [Alert] "Informações Salvas!"
- header A [reusable header]
- Popup Deletar Operação [Popup] [type: operação]
  - Text Y: "Tem certeza que deseja deletar a operação associada a [b]<Parent group's operação's nome cliente txt>[/b]? ..."
- Popup Deletar Observação [Popup] [type: operação]   (sem workflow que o abra)
- Pop.email [Popup] [type: operação]
  - Group NZ > Text PZ "Status:" + ipt.statusp/cliente [MultiLineInput]
    - Group PZZ > tgg.weekupdate [Switch] (bind_field: mandato assinado, auto_binding: false) + Text AZ "Week Update"
  - Group OZ
    - Group KZ > tgg.observação [Switch] (bind_field: mandato assinado, auto_binding: false) + Text NZ "Observação"
    - Group JZ > Text OZ "Fundos" + tgg.fundos [Switch] (bind_field: mandato assinado, auto_binding: false)
    - Text LZ "Dados a serem incluídos:"
    - Group SZZ > Text Fundos3Colunas "Fundos (Resumido)" + tgg.resumo [Switch] (bind_field: mandato assinado, auto_binding: false)
  - Group MZ > Text JZ "Envio de Email" | Text MZ "Destinatários:"
    - Multidropdown B [select2-MultiDropdown]
        data: Do a search for Tbl.InfoCliente where qualcliente = Parent group's operação's qual cliente
        option_display_expression: This Tbl.InfoCliente's emailcliente
    - Text SZ "Destinatário Adicional" + ipt.destinatárioextra [Input, email]
    - Group IZ > "Identificador: <...identificador>" | "Cliente: <...nome cliente txt>"
  - Group QZ > ipt.emailparacliente [MultiLineInput] (conteúdo acima) + Text RZ "Email: "
  - Group RZ > Button C "Enviar" | Button F "Cancelar"
- MenuNavegação A [reusable MenuNavegação]
```

---

## Workflows (61)

### Navegação entre abas e listas

```
WF bTHTc: Button B ("Fornecedor") clicado     1. Show Group Z  2. Hide Group ClientesMain  3. Hide Group Status
WF bTHWn: Button A ("Cliente") clicado        1. Show Group ClientesMain  2. Hide Group Z  3. Hide Group Status  4. Reset Group Z
WF bTKyL: Button G ("Status") clicado         1. Show Group Status  2. Hide Group Z  3. Hide Group ClientesMain
WF bTNTR: Page is loaded                      1. Set focus to Input Focus
WF bTNTi: pop.Cadastro/Edição is closed       1. Set focus to Input Focus
WF bTJRX: dd.fundoparceiro's value is changed
   1. Set state "fundotemoperações" da página ←
      Do a search for tbl.etapas operação where fundo etapa = This Element's value:count > 0
```

### Cadastro e edição da operação

```
WF bTHzb: bttn.Nova Operação clicado          1. Show pop.Cadastro/Edição
WF bTJgR: txt.qual cliente clicado            1. Show pop.Cadastro/Edição  2. Display Parent group's operação
WF bTJrZ: Icon D (lápis) clicado              1. Show pop.Cadastro/Edição  2. Display Parent group's operação  3. Hide Group etapas
WF bTJsQ: txt.qual cliente arquivados clicado 1. Show pop.Cadastro/Edição  2. Display Parent group's operação
WF bTIWq: icn.editararquivado clicado         1. Show pop.Cadastro/Edição  2. Display data  3. Hide Group etapas
WF bTJRv: Text R (linha da Table C) clicado   1. Show pop.Cadastro/Edição  2. Display linha's qual operação etapa
WF bTKwC / bTKyf / bTKyq / bTKzB: textos de cliente nos painéis de status
                                              1. Show pop.Cadastro/Edição  2. Display Parent group's operação
WF bTOFD: Icon P clicado                      1. Hide pop.Cadastro/Edição
WF bTIPd: pop.Cadastro/Edição fechado
   1. Reset group pop.Cadastro/Edição
   2. Set state "etapas" da página (limpa)
   3. Set state "modo edição" de pop.Cadastro/Edição ← false

WF bTICf: bttn.cadastrar clicado   (evento azul)
   1. Create a new thing (thing_type: operação)      only when: Parent group's nome cliente txt is empty
        carência ← ipt.carência's value
        nome cliente txt ← dd.qualcliente's value's nome/razão
        declínios [set list] ipt.declinios's value
        demanda inicial ← ipt.demandainicial's value
        destino do recurso ← ipt.destinorecurso's value
        faturamento anual ← ipt.faturamento anual's value
        garantias sugeridas ← ipt.garantias's value
        limites/fundos assinados ← ipt.limites/fundos's value
        mandato assinado ← tgg.mandatoassinadocli's value
        parecer operação ← ipt.pareceroperação's value
        PMTS ← ipt.pmts's value
        prazo ← ipt.prazo's value
        qual cliente ← dd.qualcliente's value
        quais etapas [set list] page's state "etapas"
        fee (yes/no) ← tgg.fee's value
        identificador ← ipt.identificador's value
        arquivado ← false
        comissão ← ipt.comissão's value
        Status Atual da Operação ← dd stts atual da operação's value
        mandatoassinadofor ← tgg.mandatoassinado's value
        nda assinado ← tgg.nda's value
   2. Hide pop.Cadastro/Edição
   3. Make changes to a list of things       only when: Parent group's nome cliente txt is empty
        to_change: page's state "etapas" (type tbl.etapas operação)
        qual operação etapa ← Result of step 1
   4. Set state "etapas" da página (limpa)
   5. Make changes to a thing (to_change: Parent group's operação)   only when: nome cliente txt is not empty
        carência, declínios [set list], demanda inicial, destino do recurso, garantias sugeridas,
        limites/fundos assinados, mandato assinado, parecer operação, PMTS, prazo, fee (yes/no),
        identificador, comissão, Status Atual da Operação, mandatoassinadofor  ← mesmos inputs
   6. Make changes to a thing (to_change: Parent group's operação's qual cliente)   only when: nome cliente txt is not empty
        faturamento anual ← ipt.faturamento anual's value
        parecer.cliente ← ipt.parecercliente's value
   7. Show Alert A
```

### Etapas (linhas da tbl.etapas)

```
WF bTISu: bttn.cadastraretapa clicado   (evento azul)
   1. Create a new thing (thing_type: tbl.etapas operação)
        fundo etapa ← dd. fundossugeridosetapa's value
        na mão de etapa ← ipt.namaodeetapa's value
        status etapa ← dd.statusetapa's value
        tipo operação etapa ← dd.tipoperaçãosugeridoetapa's value
        qual cliente ← dd.qualcliente's value
        qual cliente txt ← dd.qualcliente's value's nome/razão
        qual operação etapa ← gp.operação's operação
        fornecedor nome ← dd. fundossugeridosetapa's value's nome do fundo
   2. Make changes to Parent group's operação: quais etapas [add] Result of step 1
   3. Set state "etapas" da página ← page's state "etapas" :plus item (Result of step 1)
   4. Reset group Group etapas
   5. Show Alert A

WF bTJSS (tbl.etapas) e bTLJQ (tbl.etapas copy 2): bttn.editar clicado   (evento verde)
   1-4. Hide txt.maoinput, txt.status, txt.tipoperação, txt.fundo
   5-8. Show dd.statusetapa, dd.qualforncedoretapa, ipt.namaodeetapa, dd.operaçãoetapa
   9. Hide bttn.editar   10. Show bttn.salvar   11. Hide bttn.deletar
   12. Set state "modo edição" de pop.Cadastro/Edição ← true

WF bTJSR (Icon C) e bTLIg (Icon W): bttn.salvar clicado   (evento verde)
   1. Set state "modo edição" ← false
   2-6. Hide bttn.salvar, ipt.namaodeetapa, dd.qualforncedoretapa, dd.statusetapa, dd.operaçãoetapa
   7-11. Show txt.fundo, txt.maoinput, txt.status, txt.tipoperação, bttn.editar
   12. Make changes to a thing (to_change: linha da tabela)
         fundo etapa ← dd.qualforncedoretapa's value
         na mão de etapa ← ipt.namaodeetapa's value
         status etapa ← dd.statusetapa's value
         tipo operação etapa ← dd.operaçãoetapa's value
         fornecedor nome ← This etapa's fundo etapa's nome do fundo
   13. Show bttn.deletar
   14. Show Alert A

WF bTJST / bTLJb: bttn.deletar clicado
   1. Set state "etapas" ← page's state "etapas" :minus item (linha da tabela)
   2. Delete thing: linha da tabela
WF bTLIm: Icon W clicado        (sem ações)
WF bTJkS: Icon C clicado        (sem ações)
WF bTJAS: Icon I clicado        1. Show Group etapas  2. Hide Icon I  3. Show Icon M
WF bTJAk: Icon M clicado        1. Hide Group etapas  2. Hide Icon M  3. Show Icon I
```

### Observações

```
WF bTIlF: Icon A clicado        1. Show Popup Adiconar/Editar Observação  2. Display Parent group's operação
WF bTHaL: Text Q ("Salvar") clicado   (evento azul)
   1. Create a new thing (thing_type: Tbl.observações)
        cpo.qualoperação ← Parent group's operação
        cpo.observação ← ipt.observações's value
   2. Reset relevant inputs
   3. Hide Popup Adiconar/Editar Observação
WF bTHaB / bTHZu: Text Q ("Fechar") / Icon B      1. Hide Popup Adiconar/Editar Observação
WF bTJiH: Icon L clicado        1. Delete thing: linha da tbl.observações
WF bTJAB0: ipt.observação aa's value is changed   (evento vermelho)
   1. Make changes to linha da tbl.observações: cpo.observação ← This Element's value
WF bTIma: Icon H clicado (only when This Element is visible)   1. Show tbl.observações  2. Hide Icon H  3. Show Icon J
WF bTInP: Icon J clicado        1. Hide tbl.observações  2. Hide Icon J  3. Show Icon H
```

### Arquivar e excluir operação

```
WF bTJpc: Icon R clicado        1. Make changes: arquivado ← yes (Parent group's operação)
WF bTJqv: Icon T clicado        1. Make changes: arquivado ← no
WF bTJqZ: Icon O clicado        1. Set state "arquivado visivel" ← true
WF bTJqR: Icon S clicado        1. Set state "arquivado visivel" ← false
WF bTIWp: Icon F clicado        1. Show Popup Deletar Operação  2. Display Parent group's operação
WF bTJrN: icn.deletararquivado  1. Show Popup Deletar Operação  2. Display Parent group's operação
WF bTIWd: Text Y ("Deletar")
   1. Hide Popup Deletar Operação
   2. Delete a list of things: Parent group's operação's quais etapas  (type tbl.etapas operação)
   3. Delete thing: Parent group's operação
WF bTIWT / bTIWM: Text Y ("Cancelar") / Icon G    1. Hide Popup Deletar Operação
```

### Somas do painel de status

```
WF bTLEY: Input Digite a soma's value is changed   (evento marrom)
   1. Make changes to Current User: Soma Stts em Andamento ← This Element's value
   2. [plugin toast] "Salvo com sucesso!" (cor de sucesso)
WF bTLEf: Input G's value is changed
   1. Make changes to Current User: Soma Stts em Operação Aprovada ← This Element's value
   2. [plugin toast] "Salvo com sucesso!"
```

### E-mail de status (pasta de workflows "Email")

```
WF bTJzw: Button E ("Enviar Email") clicado
   1. Show Pop.email
   2. Display Parent group's operação em Pop.email
   3. Show tbl.etapasEmail
   4. [plugin Convert To PNG] ConverttoPNG A  (AAK: obs     | AAL: obs)
   5. [plugin Convert To PNG] ConverttoPNG B  (AAK: fundos  | AAL: ops-table)
   6. [plugin Convert To PNG] ConverttoPNG C  (AAK: fundos  | AAL: ops-table2)
   7. Pause (client-side)
   8. Hide tbl.etapasEmail

WF bTKHd: Button F ("Cancelar") clicado      1. Hide Pop.email
```

O botão "Enviar" (Button C) tem **oito workflows**, um para cada combinação dos três toggles (`tgg.fundos`, `tgg.observação`, `tgg.resumo`). Todos seguem o mesmo esqueleto, mudando só quais imagens vão anexadas:

| WF | tgg.fundos | tgg.observação | tgg.resumo | Anexos |
|---|---|---|---|---|
| bTKAJ | sim | sim | sim | imagem das observações + tabelas (ConverttoPNG A e B) |
| bTNnb | sim | sim | não | ConverttoPNG A + B |
| bTNnn | sim | não | sim | ConverttoPNG C (bTNmw) + B |
| bTNpT | sim | não | sim | ConverttoPNG (bTNmw) + (bTKAa) |
| bTNpH | sim | não | não | ConverttoPNG (bTKAa) |
| bTNoL | não | sim | sim | ConverttoPNG A (bTJzR) |
| bTNpf | não | sim | sim | ConverttoPNG (bTJzR) |
| bTNov | não | sim | não | ConverttoPNG (bTJzR) |
| bTNoj | não | não | sim | ConverttoPNG (bTNmw) |
| bTNoX | não | não | não | nenhum anexo |

Esqueleto de cada um:

```
WF <id>: Button C is clicked   {pasta: Email}
   only when: tgg.fundos's value is <yes/no>
          and tgg.observação's value is <yes/no>
          and tgg.resumo's value is <yes/no>
   1. Send email
        to       = Multidropdown B's value's emailcliente
        subject  = "Status atual de suas operações."
        body     = ipt.emailparacliente's value
        bcc      = maicon.farina@lureconsultoria.com.br
        sender_name = "Lure Capital"
        anexos   = URL(s) da(s) imagem(ns) gerada(s) pelo Convert To PNG
   2. Send email
        to       = ipt.destinatárioextra's value
        subject  = "Status atual de suas operações."
        body     = ipt.emailparacliente's value
        replyTo  = maicon.farina@lureconsultoria.com.br  (different_reply_to: true)
        sender_name = "Lure Capital"
        anexos   = mesma(s) imagem(ns)
        only when: ipt.destinatárioextra's value is not empty
   3. Hide Pop.email
```

---

## Pontos de atenção

- **Toggles do e-mail gravam no campo errado:** `tgg.weekupdate`, `tgg.observação`, `tgg.fundos` e `tgg.resumo` estão todos com `bind_field: mandato assinado` (auto_binding desligado, então não gravam — mas o valor exibido vem desse campo).
- **`tgg.fee` do bloco "Estruturação em Andamento"** mostra o valor de `fee (yes/no)` e grava em `Estruturação em Andamento`.
- **Oito workflows quase idênticos** no botão Enviar: qualquer mudança no texto ou no assunto precisa ser repetida oito vezes.
- **Dois pares de workflows duplicados** para salvar/editar etapa (bTJSR/bTLIg e bTJSS/bTLJQ), porque a mesma linha existe em duas tabelas.
- **E-mail com cópia oculta fixa** para `maicon.farina@lureconsultoria.com.br` em todos os envios.
- O `Popup Deletar Observação` existe mas nenhum workflow o abre.
- Elementos órfãos sem tipo: `bTNsA`, `bTHXr` e `tgg.mandatoassinadofor` (bloco "Mandato assinado pelo fornecedor").
- Os dropdowns `dd.operaçãoetapa` e `dd.statusetapa` têm listas estáticas antigas (`cri/cra`, e uma lista de status desatualizada) além do data_source dinâmico.
- O `RpgOperações` usa a lista de outro repeating group invisível (`rpg operaçõesAll`), padrão que evita refazer a busca, mas dificulta a leitura.
# FASE 4 — Backend workflows / API workflows

**Não há nenhum backend workflow neste app.** A área de API workflows do app está vazia na estrutura, e o App Manager do editor lista apenas páginas e reusables.

Ainda assim, as duas APIs do Bubble estão ligadas nas configurações:

| Configuração | Estado | Consequência |
|---|---|---|
| Workflow API (POST /api/1.1/wf/...) | habilitada | Sem workflows publicados, não há endpoint de workflow exposto hoje |
| Data API (GET/POST /api/1.1/obj/...) | habilitada | Os data types marcados como expostos ficam acessíveis pela Data API |

Data types expostos na Data API: **User, fornecedor, funilcartao, funiletapa, funiltag, FunilTarefa**. Quem de fato consome essa API é o componente HTML do funil na página `funilclientes` (ver Fase 3, parte 4), que chama `/api/1.1/obj/...` com a sessão do navegador.

Existem chaves de API cadastradas em Settings → API ([PRIVADO], não copiadas).

[NÃO VERIFICADO] Não encontrei no editor novo uma tela dedicada de "Backend workflows" para este app; a conclusão acima vem da estrutura do app e do App Manager.

---

# FASE 5 — Integrações

## 5.1 API Connector

### API: **OpenAI - ChatGPT**

| Item | Valor |
|---|---|
| Autenticação | do tipo "Private key in header" — o valor da chave é **[PRIVADO]** e não foi copiado |
| Cabeçalhos compartilhados | 1 cabeçalho marcado como **private** ([PRIVADO]) |

**Chamada: `Chatgpt - Request`**

| Item | Valor |
|---|---|
| Use as | Action |
| Método | POST |
| URL | `https://api.openai.com/v1/chat/completions` |
| Headers | 2 cabeçalhos marcados como private ([PRIVADO] — tipicamente `Authorization` e `Content-Type`) |
| Body | ver abaixo |
| Campos dinâmicos no body | **nenhum** — o body está com texto fixo |
| Inicializada | **não** (`initialized: false`) |
| Captura de erro | `wrap_error: true` |
| Formato de retorno | não definido, já que a chamada nunca foi inicializada |

```json
{
     "model": "gpt-3.5-turbo",
     "messages": [{"role": "user", "content": "Dizer que isso é um teste!"}],
     "temperature": 0.7
   }
```

**Esta chamada não é usada em nenhum workflow do app.** É uma configuração de teste que ficou para trás.

## 5.2 Plugins e onde são usados

| Plugin | Onde aparece |
|---|---|
| **Multiselect Dropdown** (`select2-MultiDropdown`) | `clientes` (ipt.quemvisualiza), `funilclientes` (ipt.quemvisualiza), `fornecedor` (dd.tiposoperações, dd.tiposoperaçõesnao, 1ª e 2ª linha), `operacao` (ipt.declinios, Multidropdown B do e-mail), `esteira_de_estrutura__o` (dd instrumentos), `header` (Multidropdown A e B do painel admin) |
| **Better Slider Input** | `esteira_de_estrutura__o`: 11 sliders (BetterSliderInput A a K), com o evento "valor alterado" gravando os campos `*Value` |
| **Switch (Toggle) And Checkbox** | `operacao`: tgg.fee, tgg.mandatoassinadocli, tgg.mandatoassinado, tgg.nda, tgg.weekupdate, tgg.observação, tgg.fundos, tgg.resumo; `esteira_de_estrutura__o`: tgg.fee (TsAssinado, Opdepe, FeeRecebido) |
| **Convert To PNG / Element To PNG** | `operacao`: ConverttoPNG A, B e C, e a ação que gera as imagens das tabelas `obs`, `ops-table` e `ops-table2` para anexar no e-mail |
| **Better Toast Notifications/Alerts** | ações de aviso em `operacao` ("Salvo com sucesso!"), `fms` ("Formulário enviado com sucesso!"), `esteira_de_estrutura__o` ("Informações salvas!") e `header` ("Senha atualizada com sucesso!") |
| **Slider And Multislider Input** | `esteira_de_estrutura__o`: apenas nos 9 workflows **desativados** (sliders antigos) |
| **API Connector** | configurado com a API OpenAI, sem uso em workflow |
| Better Slider Input, Custom Progress Bar, Excel-Like HandsonTable, Free Toggle, Fuzzy Search & Autocomplete, List Popper And Friends, OneSignal Push Notifications, OpenAI ChatGPT Dall-E · BEP, Toolbox, Ultimate Toolkit | **nenhum elemento ou ação encontrado** no app — instalados e não usados (o Excel-Like HandsonTable ainda está marcado como descontinuado pelo Bubble) |

## 5.3 Integração por HTML (fora do API Connector)

A página `funilclientes` fala direto com a **Data API do próprio app** por JavaScript embutido:

| Item | Valor |
|---|---|
| Endpoint | `<origem do app>/api/1.1/obj/<data type>` |
| Base | calculada em tempo de execução a partir de `location.origin` + prefixo `/version-xxx/`; constante de fallback aponta para `.../version-test` |
| Autenticação | cookie de sessão do navegador (`credentials: 'include'`) — nenhuma chave no código |
| Data types | funilcartao, funiletapa, funiltag, user |
| Métodos | GET (com `constraints` e `cursor`), POST, PATCH, DELETE |

E-mails saem pela ação nativa do Bubble (SendGrid do próprio Bubble, com `use_sendgrid` nas configurações), não por API externa.
# FASE 6 — Resumo final

## 6.1 Mapa de navegação

```
                        ┌──────────────┐
                        │   index      │  (login / cadastro / esqueci senha)
                        │  old_index   │  (versão antiga, ainda publicada)
                        └──────┬───────┘
                 User is logged in │ Go to page clientes
                                   ▼
   ┌───────────────────────────────────────────────────────────────┐
   │  Telas internas — todas com header + MenuNavegação             │
   │                                                                │
   │   clientes ◄──► funilclientes ◄──► operacao ◄──► fornecedor    │
   │        ▲                                │                      │
   │        └────────► esteira_de_estruturação ◄───────┘            │
   └───────────────────────────────────────────────────────────────┘

   reset_pw      ← link do e-mail de troca de senha (fora do fluxo do menu)
   404           ← página de erro (template)
   fms           ← formulário público de pesquisa (sem login)
   respforms1    ← leitura das respostas (sem login, sem data source)
   fornecedor_api← tabela de fornecedores (tela de teste, sem workflow)
```

**Nenhuma navegação usa parâmetro de URL.** Todas as trocas de página são `Go to page <nome>` sem "send more parameters", e o contexto é passado por `Display data` em pop-ups dentro da mesma página.

| Origem | Gatilho | Destino |
|---|---|---|
| index / old_index | login, cadastro ou "User is logged in" | clientes |
| MenuNavegação (todas as telas internas) | clique no item | clientes, fornecedor, operacao, esteira_de_estrutura__o, funilclientes |
| navegação (reusable antigo) | clique | fornecedor, operacao |
| header | logout (Icon G) | index |
| header | "Page is loaded" com usuário deslogado | index |

O controle de quem vê o quê acontece por conditional de `NivelDeAcesso` (Master x Indicante), não por rota: o item "Funil de Clientes" aparece só para Indicante e "Esteira", "Fornecedor" e blocos administrativos somem para ele.

---

## 6.2 Fluxos de negócio de ponta a ponta

### 1. Acesso e usuários

```
index (Log in) → header (Page is loaded verifica login) → telas internas
header > Configurações > Painel Administrativo:
   • "Acesso às páginas": tabela do option set Páginas × NivelDeAcesso × Usuários  (Multidropdowns com auto-binding)
   • "Usuários": Button Criar → Create an account for someone else → Assign temp password
        → grava a senha em texto no campo `senha` → Send email "Nova Conta" com login e senha
   • Troca de senha (Popup B) → Update credentials + grava a nova senha em texto
```

### 2. Cliente

```
clientes > "Novo Cliente" → Popup cliente → bttn cria cliente
   modo criação  (nome/razão vazio) → Create cliente + adiciona usuário fixo e Current User em "quem visualiza"
   modo edição   (nome/razão preenchido) → Make changes no cliente
clientes > Icon E → Popup de e-mail → Create Tbl.InfoCliente (e-mails do cliente)
clientes > Icon I / Icon H → arquivado = yes / no
clientes > lixeira → Popup Deletar → Delete cliente
```

### 3. Funil comercial (prospecção)

```
funilclientes → componente HTML/JS
   cartões (funilcartao) em colunas (funiletapa) com etiquetas (funiltag)
   arrastar cartão → PATCH em funilcartao (QualEtapa, Ordem, DataAtualizacao)
   novo cartão / nova coluna / arquivar → POST, PATCH e DELETE na Data API
   (mesmo pop-up de cliente da tela `clientes` convive na página)
```

### 4. Operação (núcleo do sistema)

```
operacao > "Nova Operação" → pop.Cadastro/Edição
   escolhe cliente (dd.qualcliente, filtrado por "quem visualiza") + dados da operação
   adiciona etapas por fundo (Group etapas → bttn.cadastraretapa)
        cria tbl.etapas operação (fundo, tipo, na mão de, status) e liga à operação
   "Cadastrar/Salvar" (bttn.cadastrar)
        criação: Create operação + liga as etapas do state + zera o state
        edição : Make changes na operação + Make changes no cliente (faturamento e parecer)
   edição por linha na tabela de etapas: bttn.editar → campos → bttn.salvar → Make changes na etapa
   status da operação: dd stts atual da operação (Inicial / Em andamento / Operação Aprovada / Excluído ou Paralisado)
        → alimenta os quatro painéis da aba "Status"
   aba "Fornecedor": escolhe um fundo parceiro e vê todas as etapas dele
   "Enviar Email" → Pop.email
        monta o texto (ou Week Update), escolhe destinatários (Tbl.InfoCliente do cliente)
        gera imagens das tabelas com Convert To PNG
        "Enviar" → 1 dos 8 workflows conforme os toggles → Send email (+ cópia para o destinatário extra)
   arquivar (Icon R) / desarquivar (Icon T) / deletar (apaga as etapas e depois a operação)
```

### 5. Estruturação (pós-contrato)

```
Uma etapa com status "contrato assinado" faz a operação aparecer na esteira
   (Rpg Operações: operações com "Estruturação em Andamento" = yes e cliente com etapa contratada)
esteira > clique na operação → pop.Esteira
   escolhe o instrumento (dd instrumentos) → aparece o bloco FIDC/FIAGRO/FII/SLB, CRA/CRI/CR ou Debênture
   preenche volume, datas, participantes (gestor, administrador, custodiante, DTVM, etc.) — tudo por auto-binding
   move os 11 sliders de progresso (Regulamento, Arquivos, Contratos, Integralizações, Inclusão de DC, 4 campos livres)
        → cada slider grava o campo *Value da etapa
   descrições nos MultilineInputs → campos *Desc por auto-binding
   observações → Tbl.Etapas da operação (observações)
   toggles: Ts Assinado, Operação de pé, Fee Recebido
```

### 6. Pesquisa ESG/governança

```
fms (público) → 13 perguntas → Create RespostasForms1 → toast de confirmação
respforms1 → deveria listar as respostas, mas a tabela está sem data source
```

---

## 6.3 Itens marcados [NÃO VERIFICADO]

| Item | Motivo |
|---|---|
| Ausência de backend workflows | Confirmada pela estrutura do app e pelo App Manager, mas o editor novo não abriu uma tela dedicada de backend workflows para conferência visual |
| Domínio personalizado | Não abri Settings → Domain; na estrutura o campo de domínio veio vazio |
| Conteúdo completo do HTML do funil (74.744 caracteres) | Documentei arquitetura, funções, endpoints e campos, mas não transcrevi o script linha a linha. Posso exportar o arquivo inteiro se você quiser |
| Formato de retorno da chamada OpenAI | A chamada nunca foi inicializada no API Connector, então o Bubble não guardou o schema de resposta |
| Valores de chaves, tokens e cabeçalhos privados | Marcados como [PRIVADO] por regra do próprio trabalho |

---

## 6.4 Pontos de atenção

### Segurança e privacidade

1. **Senhas em texto puro.** O data type User tem o campo `senha`, preenchido no cadastro (header, WF bTNHu) e na troca de senha (WF bTNYO), exibido numa coluna da tabela de usuários e enviado por e-mail.
2. **Privacy rules abertas em `fornecedor`:** a regra `everyone` permite ver, criar, modificar e apagar via API, sem login.
3. **Privacy rules abertas em `FunilTarefa`:** `everyone` já permite criar, modificar e apagar via API.
4. **Auto-binding liberado para `everyone` em `operação`** (19 campos) e em `tbl.etapas operação` (7 campos): gravação sem login.
5. **`RespostasForms1` sem nenhuma privacy rule.**
6. **Telas sem proteção de login:** `fms`, `respforms1`, `fornecedor_api` e `old_index` não têm o reusable `header`, que é o único lugar onde existe a verificação "usuário deslogado → volta para index".
7. **ID de usuário cravado na lógica** (`1724347578001x492302103806268900`) em três pontos de `clientes`/`funilclientes` e no botão "Adicionar Maicon a todos os clientes" do header.
8. **E-mail com cópia oculta fixa** (`maicon.farina@lureconsultoria.com.br`) em todos os oito workflows de envio.
9. **Permissão por página não é aplicada:** a tabela `tbl.config` (User × Página × NivelDeAcesso) existe e é editável no painel admin, mas nenhuma tela lê esses dados; o controle real é só o `NivelDeAcesso` do User.

### Performance

10. **Buscas aninhadas em três níveis** na esteira (EXPR-ETAPA), repetidas em dezenas de grupos do mesmo pop-up.
11. **`Do a search for` com `:filtered` de busca avançada** dentro de repeating groups em `clientes`, `funilclientes`, `fornecedor`, `operacao` e `esteira`: o filtro roda no navegador, depois de baixar a lista.
12. **Matriz da aba "Tipo Operações"** (fornecedor) roda três `:filtered` por linha sobre a lista inteira da tabela de fundos.
13. Ponto positivo: `RpgOperações` reaproveita a lista de `rpg operaçõesAll` em vez de repetir a busca.

### Lógica duplicada e resíduos

14. **Oito workflows quase idênticos** no botão "Enviar" do e-mail, um por combinação de três toggles.
15. **Pares duplicados** de salvar/editar etapa em `operacao` (bTJSR/bTLIg, bTJSS/bTLJQ), por causa das duas tabelas de etapas.
16. **Nove workflows desativados** na esteira, oito deles gravando o mesmo campo (`IntSeniorValue`).
17. **Pop-ups de cliente replicados** em `clientes` e `funilclientes` — cópia integral, não reusable.
18. **Botões de aba que fazem toggle** em vez de estado: em `fornecedor` os dois botões executam a mesma sequência.
19. **Workflows vazios ou sem efeito:** `Button A ("Salvar")` na esteira, `Make changes` sem campos no reset_pw, `Icon C`/`Icon W`, `Text D`, `Text N`, `Input D changed`, entre outros.
20. **`fms`:** o WF do Checkbox A cria um registro vazio a cada clique; só o Checkbox A entra na lista da pergunta 15; o campo do "outro motivo" não é gravado; e o conditional de exibição aponta para o checkbox errado.
21. **Toggles com bind errado** em `operacao`: `tgg.weekupdate`, `tgg.observação`, `tgg.fundos` e `tgg.resumo` estão ligados ao campo `mandato assinado`; `tgg.fee` do bloco de estruturação exibe `fee (yes/no)` e grava `Estruturação em Andamento`.
22. **Campos com conteúdo inicial trocado:** `Input Telefone` (header) mostra o CPF; `ipt segmento que não atua` (fornecedor) mostra o segmento foco.
23. **Elementos órfãos sem tipo:** 8 em `esteira_de_estrutura__o` e 3 em `operacao`.
24. **Option set `status.tbl` com valores internos fora de sintonia** com os rótulos ("já cliente do fundo" guarda `opera__o_declinada`; "declinado pelo fundo" guarda `declinado`) — e há conditionals comparando o display por texto, inclusive com variação de maiúscula ("Já cliente do fundo" e "já cliente do fundo").
25. **Campos excluídos ainda referenciados:** a página `respforms1` mostra `p15_text`, que não existe; `operação` e `fornecedor` carregam dezenas de campos marcados como deleted.
26. **Telas legadas ainda publicadas:** `old_index`, `fornecedor_api`, `respforms1` e o reusable `navegação`.
27. **Chamada OpenAI configurada e nunca usada**, com body de teste; e 10 plugins instalados sem uso nenhum no app.

---

## 6.5 Se o objetivo for reconstruir em outra tecnologia

A ordem natural, pelo que o mapeamento mostra:

1. **Modelo de dados** — 14 tabelas, das quais 6 são o núcleo (User, cliente, fornecedor, operação, tbl.etapas operação, Tbl.observações) e 4 formam o funil (funilcartao, funiletapa, funiltag, FunilTarefa). Os option sets viram enums; vale corrigir os valores internos de `status.tbl` na migração.
2. **Autenticação e papéis** — dois níveis (Master, Indicante) e a tabela `tbl.config`, que hoje não é usada e pode virar a permissão de verdade. A senha em texto não deve ser migrada.
3. **CRUD de cliente, fornecedor e operação** — telas equivalentes a `clientes`, `fornecedor` e `operacao`, com a lista filtrada por "quem visualiza".
4. **Etapas por fundo** — o coração da operação: uma linha por fundo com status, tipo e responsável, editável na própria tabela.
5. **Esteira** — checklist de 11 itens com percentual e descrição por etapa, mais os blocos por instrumento.
6. **Funil** — já é um app JS independente; migra quase direto, trocando a Data API do Bubble pelo backend novo.
7. **E-mail de status** — gerar o HTML da tabela no servidor em vez de converter a tela em imagem.
