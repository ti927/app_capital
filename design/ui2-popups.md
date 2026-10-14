# UI 2 — pop-ups modernos de Cliente, Fornecedor e Operação

Status: **desenho** (14/10/2026). Implementação é outra etapa. Opcional por pessoa,
escolhido nas Configurações; a UI clássica continua sendo o padrão.

Pedido do usuário: "um novo pop up para todos (cliente, fornecedor e operação) com o
intuito de ficar moderno, eficiente para visualizar informações, podendo usar ícones e
usando as regras de design atuais para melhor experiência, com mais animações,
praticidade e rapidez de uso; os campos podem ficar um do lado do outro, mas seguindo
as mesmas ordens".

## 0. O que não muda (contrato com a UI clássica)

- **Mesma ordem de campos**, lida da esquerda para a direita e de cima para baixo. A
  ordem do DOM = ordem visual = ordem de Tab. Nenhum `order:`/`grid-area` que
  reordene.
- **Mesmos `name=`** que as actions leem (`gravarCliente`, `gravarFornecedor`,
  `gravarOperacao`). A UI 2 é só outra casca sobre o mesmo `<form>`.
- **Mesmas regras de salvar**: `useSalvarOtimista` (fecha na hora, "Tentar de novo" no
  erro, `validar` do nome), salvar sem mudança não vai ao servidor, destaque `lc-salvo`
  na linha da lista ao fechar.
- **Mesmos textos** de rótulo, botão e mensagem ("Cadastrar"/"Salvar", "Enviar Email",
  "Estruturação em Andamento", "Quem visualiza:" etc.).
- **Só tokens existentes** (`src/app/tokens.css`, `animacoes.css`). Nenhuma cor nova.
- Operação: **PMTS, Comissão e Demanda final não aparecem** (nas duas UIs). A coluna e o
  dado ficam; `gravarOperacao` só grava o que está no FormData (`dados.has`).

Recomendação de implementação: a ordem de cada pop-up mora num só lugar
(`campos.ts` por módulo, lista de `name` na ordem) e um teste confere que a UI clássica
e a UI 2 renderizam os `name=` na mesma sequência. É a garantia de "o usuário não pode
se confundir".

## 1. Conceito — "ficha"

A UI clássica é um formulário: todo campo é uma caixa, tudo pesa igual, o que importa
se acha lendo rótulo por rótulo. A UI 2 é uma **ficha**: abre já mostrando o registro,
e edita no lugar.

1. **Cabeçalho-resumo.** Ícone do módulo num ladrilho, nome do registro grande, chip de
   status com a cor que o status já tem no sistema e uma **faixa de números-chave**
   (três valores, os que a pessoa procura ao abrir). É o único elemento ousado do
   desenho; o resto é quieto.
2. **Seções com ícone e título.** Os campos se agrupam por assunto, na ordem de sempre.
   Cada seção tem um ladrilho de ícone de 24px e um título curto em caixa normal.
3. **Grade densa de 12 colunas.** Campos curtos dividem a linha (2, 3 ou 4 por linha),
   sempre respeitando a ordem. Texto longo ocupa a linha toda.
4. **Campo "valor primeiro".** Em repouso o campo mostra o valor em destaque (15px,
   peso 600) sobre um fio inferior; o rótulo fica pequeno, com ícone, acima. No hover
   aparece a caixa; no foco a caixa fica completa, com anel de foco. Continua sendo um
   `<input>`/`<textarea>` real o tempo todo — não existe modo "ver" e modo "editar".
5. **Rodapé fixo** com o estado ("Sem alterações" / "Alterações não salvas"), os
   interruptores que já moram ali e as ações. `Ctrl+Enter` (ou `⌘+Enter`) salva.
6. **Índice de seções** (só Operação, que é longa): fileira de pílulas sob o cabeçalho,
   fixa no topo do corpo; clicar rola até a seção; a seção visível fica marcada.

Revisão contra o padrão genérico: descartei "cartões arredondados com sombra por seção"
(o kit SaaS) — seções são separadas por espaço e por um fio `--border`, sem caixa nem
sombra, como a densidade do produto pede. Descartei rótulo em CAIXA ALTA acima de cada
seção. A cor continua pontual: amarelo só na ação primária, no foco-dentro da seção e
no destaque de salvo.

### Esqueleto (desktop)

```
┌────────────────────────────────────────────────────────────────────┐
│ [▣]  3E · Cap Giro                         (● Em análise)      [×] │  cabeçalho fixo
│      Editar operação                                               │
│  Demanda        Prazo          Faturamento anual    3 fundos  1 decl.│ faixa-chave
├────────────────────────────────────────────────────────────────────┤
│ (Operação)(Crédito)(Pareceres)(Contratos)(Acompanhamento)(Fundos)   │  índice (sticky)
├────────────────────────────────────────────────────────────────────┤
│ [▤] Operação                                                       │
│  Cliente ....................... │ Identificador .................  │
│  Faturamento anual ............. │ Status atual da operação ▾ ....  │
│ [$] Crédito                                                        │
│  Demanda ....................... │ Prazo .........................  │
│  Garantias sugeridas ........... │ Carência ......................  │
│  Destino do recurso ..............................................  │
│ ...                                                                │  corpo rola
├────────────────────────────────────────────────────────────────────┤
│ ○ Alterações não salvas   [◻ Estruturação em Andamento] [Enviar Email] [Salvar] │
└────────────────────────────────────────────────────────────────────┘
```

## 2. Especificação por pop-up

Notação: `campo (span)` na grade de 12 colunas; `|` separa campos da mesma linha. Os
rótulos são os literais da UI clássica.

### 2.1 Cliente (`largura="md"`, 880px)

Cabeçalho: ladrilho `IconeCliente`; título = `nome_razao` (ou "Novo cliente"); linha de
contexto = CNPJ (quando houver); chip de `status` (neutro `st-etapa-inicio` até haver
de-para de cor para status de cliente — não inventar cor). Faixa-chave: **Faturamento
anual · Demanda · Estimativa de faturamento** (espelho ao vivo dos campos; vazio = "—").

Cliente novo: acima da primeira seção, a faixa "Puxar do funil" (seletor + texto de
apoio atual), com ícone `IconeFunil`.

| Seção (ícone) | Linhas |
|---|---|
| Identificação (`IconeCliente`) | Nome/razão social (8) \| CNPJ (4) |
| Contato (`IconeEmail`*, `IconeTelefone`*) | Email (12) — e-mails como chips removíveis + "Adicionar" ao fim da fileira · Diretor/gerente (6) \| Cidade (3) \| Telefone (3) |
| Empresa (`IconeFornecedor`) | Atividade da CIA (12) · Faturamento anual (3) \| Margem líquida (3) \| Ativos (3) \| Passivo oneroso (3) |
| Relacionamento (`IconeOlho`*) | Quem indicou (5) \| Quem visualiza: (7) · Demanda (6) \| Estimativa de faturamento (6) |
| Parecer (`IconeNota`*) | Parecer (12, 10 linhas, cresce até 60vh) · Status cliente (12, seletor em pílulas segmentadas — mesmas 4 opções, mesmo `name="status"`) |

Rodapé: estado · "Cadastrar"/"Salvar".

### 2.2 Fornecedor (`largura="md"`)

Cabeçalho: ladrilho `IconeFornecedor`; o **nome do fundo é o título editável** (já é
assim hoje — `input name="nome_fundo"` vira o título do cabeçalho, 22px/800, com fio
inferior no foco); contexto "Novo fundo"/"Editar fundo"; chip de `status`. Faixa-chave:
**Fee · Operação mínima · Faturamento mínimo**.

| Seção (ícone) | Linhas |
|---|---|
| Cadastro (`IconeFornecedor`) | Cidade (4) \| Número (4) \| Email (4) · Contato (6) \| PF ou PJ (3) \| Fee (3) |
| Parecer (`IconeNota`*) | Parecer (12) · Status (6) \| Link de Indicação (6, com botão de abrir em nova aba ao lado quando preenchido) |
| Tipos de operação (`IconeTag`*) — substitui a régua | Tipos de operações (12) · 1º Linha (6) \| 2º Linha (6) · Tipos de operações não atendidas (12, fichas em vermelho como hoje, ícone `IconeProibido`*) |
| Critérios (`IconeAlvo`*) | Faturamento mínimo (3) \| Operação mínima (3) \| Segmento foco (3) \| Segmento que não atua (3) |

Regra preservada: 1º/2º Linha só oferecem tipos fora de "não atendidas".

### 2.3 Operação (`largura="lg"`, 1120px)

Cabeçalho: ladrilho `IconeOperacao`; título = "Nova Operação"/"Editar operação";
contexto = `Cliente · Identificador`; chip do status com `tokenDoStatus` (a mesma cor da
lista). Faixa-chave: **Demanda · Prazo · Faturamento anual**, e dois contadores à
direita: "N fundos" (etapas) e "N declínios".

Índice fixo: Operação · Crédito · Pareceres · Contratos · Acompanhamento · Fundos.

| Seção (ícone) | Linhas — **pares na mesma linha** |
|---|---|
| Operação (`IconeOperacao`) | Cliente (6) \| Identificador (6) · Faturamento anual (6) \| Status atual da operação (6) |
| Crédito (`IconeMoeda`*) | Demanda (6, `demanda_inicial`) \| Prazo (6) · Garantias sugeridas (6) \| Carência (6) · Destino do recurso (12) |
| Pareceres (`IconeNota`*) | Parecer do cliente (6) \| Parecer da operação (6) — sem cliente, o da operação ocupa 12 |
| Contratos (`IconeAssinatura`*) | Com fee · NDA assinado com o Cliente · Mandato assinado pelo cliente · Mandato assinado com o fundo — como **pílulas-interruptor** (checkbox real com aparência de chip; marcado = `--success-bg` + check `--success-ink`) |
| Acompanhamento (`IconeLista`*) | Observações (12) · Declínios (12) · Limites/fundos assinados (12) |
| Fundos (`IconeFornecedor`) | tabela de etapas como hoje (fica fora do `<form>`, como hoje) |

- **Cliente**: operação nova = seletor; ao escolher, o faturamento do cliente entra em
  "Faturamento anual" com um pulso amarelo de 600ms no campo (mostra o que mudou
  sozinho). Edição = valor somente leitura (`--surface-sunken`, sem caixa no hover) e o
  `hidden name="cliente_id"`. Abrir uma operação com faturamento vazio também puxa o do
  cliente (mesma regra da UI 1), com o mesmo pulso.
- **Faturamento anual** mostra, quando veio do cliente, uma nota de apoio "Do cadastro
  do cliente" (12px, `--text-muted`) — segue editável.
- Rodapé: estado · interruptor "Estruturação em Andamento" (`form="forma-operacao"`) ·
  "Enviar Email" (só com cliente) · "Cadastrar"/"Salvar".

**Pendência de ordem a confirmar com a Equipe 1 (UI clássica):** o pedido lista
"Parecer do cliente | Parecer da operação, Declínios, Limites/fundos assinados,
observações" e diz "como hoje". Hoje (pedido de 05/10/2026) a ordem é interruptores →
Observações → Declínios → Limites. Este desenho segue **a de hoje**; se a Equipe 1
adotar a outra, a UI 2 troca junto (a lista única de `campos.ts` resolve).

## 3. Ícones

Do conjunto atual (`src/components/ui/icones.tsx`): `IconeCliente`, `IconeFornecedor`,
`IconeOperacao`, `IconeFunil`, `IconeMais`, `IconeFechar`, `IconeDeletar`,
`IconeEditar`, `IconeSalvar` (check), `IconeChevronBaixo`/`Cima`.

Novos (*), no mesmo estilo — 24×24, traço 1.75, `round`, `currentColor`,
`aria-hidden`; entram em `icones.tsx` usando a `Base` de lá:

| Nome | Uso | Desenho (paths) |
|---|---|---|
| `IconeEmail` | Contato/Email | `rect x3 y5 w18 h14 rx2` + `m3.5 6.5 8.5 6 8.5-6` |
| `IconeTelefone` | Telefone, Número | `M5 4h3l1.5 4-2 1.5a11 11 0 0 0 5 5l1.5-2 4 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z` |
| `IconeLocal` | Cidade | `M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z` + `circle 12,10 r2` |
| `IconeMoeda` | Crédito, valores | `circle 12,12 r9` + `M14.5 9a2.5 2 0 0 0-2.5-1.5c-1.4 0-2.5.8-2.5 2s1.1 1.7 2.5 2 2.5.8 2.5 2-1.1 2-2.5 2A2.5 2 0 0 1 9.5 15M12 6v1.5M12 16.5V18` |
| `IconeRelogio` | Prazo, Carência | `circle 12,12 r9` + `M12 7v5l3 2` |
| `IconeEscudo` | Garantias | `M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6z` |
| `IconeAlvo` | Destino do recurso, Critérios | `circle r9` + `circle r5` + `circle r1` (centro 12,12) |
| `IconeNota` | Pareceres | `M5 4h14v12l-4 4H5z` + `M15 20v-4h4` + `M9 9h6M9 13h4` |
| `IconeOlho` | Quem visualiza | `M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z` + `circle 12,12 r3` |
| `IconeTag` | Tipos de operação | `M3 12V4h8l10 10-8 8z` + `circle 7.5,7.5 r1.5` |
| `IconeProibido` | Não atendidas | `circle 12,12 r9` + `M5.6 5.6l12.8 12.8` |
| `IconeAssinatura` | Contratos | `M4 18c3-6 5-6 6-3s3 1 4-1 2-1 3 1` + `M3 21h18` |
| `IconeLista` | Acompanhamento | igual ao miolo de `IconeEsteira` sem os checks: `M8 7h12M8 12h12M8 17h12` + pontos `M4 7h.01M4 12h.01M4 17h.01` |
| `IconeLink` | Link de Indicação | `M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1` + `M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1` |

Ícone nunca substitui rótulo: todo campo mantém o rótulo escrito.

## 4. Tokens e cor (só os existentes)

| Elemento | Claro / escuro (o token troca sozinho) |
|---|---|
| Fundo do diálogo | `--surface`; cabeçalho e rodapé `--surface`, fio `--border` |
| Faixa-chave | fundo `--surface-sunken`, valor `--text` 18px/800, rótulo `--text-muted` 12px |
| Ladrilho de ícone (seção) | 28×28, `--radius-md`, fundo `--surface-sunken`, ícone `--text-secondary` |
| Seção com foco dentro | ladrilho fundo `--accent`, ícone `--accent-on`; título `--text` |
| Ladrilho do cabeçalho | 40×40, `--radius-lg`, fundo `--text`, ícone `--surface` (preto/branco da marca; inverte no escuro) |
| Título de seção | 13px/700 `--text`, caixa normal |
| Rótulo de campo | 12px/600 `--text-secondary`, ícone 14px `--text-muted` |
| Valor em repouso | 15px/600 `--text`; vazio mostra placeholder "Digite aqui" em `--text-muted`/400 |
| Fio do campo | `--border` 1px; hover: caixa `--border-strong`; foco: caixa `--border-strong` + anel 2px `--focus-ring` |
| Campo somente leitura | fundo `--surface-sunken`, texto `--text-secondary` |
| Chip de status | `ChipStatus` existente (`--st-etapa-*` / `-ink`) — texto sempre presente |
| Pílula-interruptor | desligada `--surface` + `--border`; ligada `--success-bg` + `--success-ink` |
| Não atendidas | fichas `--danger-bg` / `--danger-ink` (já é o `negativo` do seletor) |
| Estado "Alterações não salvas" | ponto 6px `--warning`, texto `--text-secondary` |
| Ação primária | `Botao variante="primary"` (amarelo `--accent` + `--accent-on`) |
| Erro de validação | `--danger` na caixa, mensagem `--danger-ink` sob o campo (`lc-field__msg`) |

Texto amarelo sobre branco é proibido; quando o amarelo precisa ser texto, é
`--accent-ink`. Espaços: `--space-5` entre campos, `--space-8` entre seções; altura do
campo `--control-h-md`. Raio: `--radius-md` nos campos, `--radius-pill` em chips.

## 5. Animações

Regras do `animacoes.css` valem: curto, só no que aparece/some ou responde a uma ação,
`--mov-curva`, e `prefers-reduced-motion: reduce` zera tudo (exceto o spinner, que
desacelera).

| Momento | Movimento |
|---|---|
| Entrada do diálogo | o `lc-caixa` atual (8px + 0.98, `--mov-padrao`); saída idem ao contrário |
| Faixa-chave | entra junto com o cabeçalho, sem animação própria |
| Seções em cascata | `ui2-secao-entra`: opacidade 0→1 e `translateY(6px)`→0, 200ms, atraso 30ms por seção, teto 150ms (6ª em diante sem atraso extra) — só na abertura, nunca ao rolar |
| Foco no campo | fio inferior vira caixa: `box-shadow`/`border-color` em `--mov-rapido`; o ladrilho da seção acende em amarelo (`:focus-within`) em `--mov-rapido` |
| Escolha em seletor/status | chip troca com `lc-menu` (4px, `--mov-rapido`) |
| Valor preenchido sozinho (faturamento do cliente, puxar do funil) | `ui2-pulso`: fundo `color-mix(--accent 14%)` → transparente, 600ms, uma vez |
| Pílula-interruptor | cor e check: 120ms; check entra com `scale(.6)`→1 |
| Índice de seções | pílula ativa troca fundo em `--mov-rapido`; rolagem `scroll-behavior: smooth` (auto em reduced-motion) |
| Salvar | fecha na hora (otimista) com a saída do diálogo; a linha da lista recebe o `lc-salvo` existente. Em erro, reabre com o aviso "Tentar de novo" atual — sem tremor |
| Celular | folha sobe de baixo: `translateY(24px)`→0, 200ms |

Nada se move depois de pronto; nenhum hover anima posição.

## 6. Celular (≤ 760px)

- Diálogo vira **folha de tela cheia** (`100dvh`, raio só em cima), cabeçalho e rodapé
  fixos, corpo rola.
- Grade cai para **1 coluna**, na mesma ordem (os pares viram empilhados). Entre 761 e
  1100px: spans de 3 viram 6 (duas por linha), pares continuam pares.
- Faixa-chave quebra em 2 colunas (sem rolagem horizontal); contadores vão para a
  segunda linha.
- Índice de seções da Operação vira um seletor compacto "Ir para…" no topo do corpo.
- Rodapé: interruptor em cima, botões embaixo; "Salvar" ocupa a largura;
  `padding-bottom: env(safe-area-inset-bottom)`.
- Alvos de toque ≥ 44px (`--control-h-lg` + respiro); chips de e-mail com X de 32px de
  área.
- Tabela de etapas: rolagem horizontal **dentro** do próprio contêiner, como hoje.

## 7. Acessibilidade

- `role="dialog"`, `aria-modal`, `aria-labelledby` no título (o `Dialogo` atual já faz);
  foco inicial no primeiro campo editável; Esc fecha (fecha só o menu se houver um
  aberto, como hoje); foco volta ao gatilho.
- Cada seção é `<section aria-labelledby>` com `<h3>`; o índice é `<nav aria-label="Seções">`
  com `aria-current` na ativa.
- Faixa-chave é `<dl>` (rótulo `dt`, valor `dd`); não é interativa.
- Rótulo visível em todo campo (`<label for>`), nunca só placeholder; ícones
  `aria-hidden`.
- Ordem de Tab = ordem dos campos. Pílulas-interruptor são `<input type="checkbox">`
  com `<label>`; status segmentado é `radiogroup` com setas.
- Contraste: valor e rótulo ≥ 4.5:1 nos dois temas (`--text`, `--text-secondary`);
  status nunca só por cor (o chip tem texto).
- Anel de foco 2px `--focus-ring`, nunca removido. `Ctrl/⌘+Enter` salva; anunciado no
  `title` do botão Salvar.
- Estado "Alterações não salvas" em `aria-live="polite"`.

## 8. Classes CSS novas (`.ui2-`)

Arquivo sugerido: `src/app/ui2.css`, importado depois de `interface.css`.

| Classe | Papel |
|---|---|
| `.ui2-dialogo` | modificador do `.lc-dialog` (aplicado via `className`) |
| `.ui2-cabeca` | cabeçalho-resumo (grid: ladrilho · título/contexto · chip · fechar) |
| `.ui2-cabeca__ladrilho` | ícone 40×40 do módulo |
| `.ui2-cabeca__titulo` / `.ui2-cabeca__contexto` | nome e linha de contexto |
| `.ui2-cabeca__titulo-editavel` | variante do fornecedor (input `nome_fundo`) |
| `.ui2-faixa` / `.ui2-faixa__item` / `.ui2-faixa__valor` / `.ui2-faixa__rotulo` | números-chave |
| `.ui2-faixa__contador` | "N fundos", "N declínios" |
| `.ui2-indice` / `.ui2-indice__item` / `.ui2-indice__item--ativo` | índice de seções |
| `.ui2-corpo` | corpo rolável (contém o `<form>`) |
| `.ui2-secao` / `.ui2-secao__cabeca` / `.ui2-secao__ladrilho` / `.ui2-secao__titulo` | seção |
| `.ui2-grade` | grade de 12 colunas |
| `.ui2-c3` `.ui2-c4` `.ui2-c5` `.ui2-c6` `.ui2-c7` `.ui2-c8` `.ui2-c12` | spans |
| `.ui2-campo` / `.ui2-campo__rotulo` / `.ui2-campo__icone` / `.ui2-campo__valor` | campo "valor primeiro" (envolve `Campo`) |
| `.ui2-campo--leitura` | somente leitura |
| `.ui2-campo--pulso` | animação de valor preenchido sozinho |
| `.ui2-campo__nota` | apoio sob o campo ("Do cadastro do cliente") |
| `.ui2-chips` / `.ui2-chip` / `.ui2-chip__remover` | e-mails do cliente |
| `.ui2-interruptor` | pílula-interruptor (Contratos) |
| `.ui2-segmentado` / `.ui2-segmentado__opcao` | status em pílulas (cliente) |
| `.ui2-puxar` | faixa "Puxar do funil" |
| `.ui2-rodape` / `.ui2-rodape__estado` / `.ui2-rodape__estado--sujo` | rodapé fixo |
| `.ui2-preferencia` / `.ui2-preferencia__opcao` / `.ui2-preferencia__miniatura` | escolha nas Configurações |

Keyframes novos: `ui2-secao-entra`, `ui2-pulso`, `ui2-folha` (celular). Todos dentro
do bloco `prefers-reduced-motion` com `animation: none`.

## 9. Onde a pessoa escolhe

**Hoje:** "Configurações" é um botão da casca (`src/app/(app)/layout.tsx:72`) que abre
um pop-up sem rota (`src/components/configuracoes.tsx`, "Acesso às páginas") e **só
aparece para master**. As páginas de conta são `/conta/senha` e `/conta/agenda`. O tema
claro/escuro é o botão "Tema" e fica em `localStorage` (`src/components/ui/tema.tsx`).

**Proposta:** o botão Configurações passa a aparecer para todos, e o pop-up ganha duas
abas: **"Preferências"** (todos) e **"Acesso às páginas"** (só master; para indicante a
aba não existe e a consulta não sai, como hoje).

Em Preferências, um bloco "Pop-ups de cadastro" com duas opções lado a lado (cartões de
rádio com miniatura): **Clássica** (padrão) e **Moderna**. A troca grava na hora
(otimista, aviso "Preferência salva"), vale a partir do próximo pop-up aberto, sem
recarregar.

Alternativa, se não quiserem abrir Configurações ao indicante: rota
`/conta/preferencias` ao lado de senha e agenda. **Decisão do usuário** (regra 9 —
mostrar Configurações ao indicante muda quem vê o quê).

## 10. Onde guardar

Em `perfil`, para valer em qualquer aparelho (o tema é por navegador; esta escolha é
da pessoa).

```sql
-- db/014_ui_popups.sql   (013 é a última hoje; confirmar o número livre ao aplicar)
alter table public.perfil
  add column if not exists ui_popups text not null default 'classica'
  check (ui_popups in ('classica', 'moderna'));
```

RLS: **nenhuma policy nova é necessária** — mesmo raciocínio da `013_notas_vistas.sql`.
`perfil_atualiza` (009) já deixa cada um atualizar só a própria linha (`id = auth.uid()`)
sem mudar `nivel_acesso`; `perfil_le` já permite ler. A migration leva esse comentário.
O update entra no log de `evento` pelo `perfil_log` existente.

Observação (não mexer agora): `perfil_atualiza` deixa a pessoa alterar qualquer coluna
da própria linha (nome, `ativo`…). Já era assim antes; se incomodar, é assunto de outra
migration (grant por coluna).

Leitura e uso:
- `layout.tsx` já consulta `perfil` (`notas_vistas`); acrescentar `ui_popups` ao mesmo
  `select` e passar a um `PreferenciasProvider` (contexto client). Os `DialogoCliente`,
  `DialogoFornecedor` e `DialogoOperacao` leem o contexto e renderizam o corpo clássico
  ou o moderno — sem piscar, porque o valor vem do servidor.
- Gravação: server action `gravarPreferenciaPopups(valor)` com o cliente Supabase da
  sessão (nunca `service_role`), validando o enum, `update perfil set ui_popups = $1
  where id = auth.uid()`; `revalidatePath('/', 'layout')`.
- Escrever a decisão em `specs/` (regra 8) quando aprovada.

## 11. QA

`scripts/qa.mjs`: repetir os passos de diálogo (cliente 04–16, fornecedor 23–32,
operação 39–52) com a preferência "moderna", nas três formas (`qa:tudo`). Esperar pelo
conteúdo (o título do registro na `.ui2-cabeca`), nunca pela classe. Olhar nas
capturas: rodapé visível sem rolar, faixa-chave sem corte no celular, ladrilho de foco
aceso, chip de status legível no escuro.
