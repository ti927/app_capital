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
