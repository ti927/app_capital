# specs — estado

## O que já está aqui

| Arquivo | Conteúdo |
|---|---|
| `bubble/documentacao-completa.md` | mapeamento do app Bubble atual, 2.540 linhas |
| `bubble/fase1-inventario.md` | inventário de páginas, data types, option sets e plugins |

A documentação do Bubble é a fonte de verdade do comportamento atual. Tem 2.540
linhas: consulte a seção do módulo que estiver implementando, nunca o arquivo
inteiro.

Mapa rápido das seções:

| Linhas | Conteúdo |
|---|---|
| 22–154 | FASE 1 — inventário geral |
| 155–580 | FASE 2 — banco de dados (data types, campos, privacy rules, option sets) |
| 582–868 | FASE 3 — index, reset_pw, 404, fms, old_index, fornecedor_api |
| 869–1104 | FASE 3 — reusables: header, MenuNavegação, navegação |
| 1105–1270 | FASE 3 — página `clientes` |
| 1271–1359 | FASE 3 — página `funilclientes` |
| 1360–1521 | FASE 3 — página `fornecedor` |
| 1522–1566 | FASE 3 — página `respforms1` |
| 1567–1807 | FASE 3 — página `esteira_de_estruturacao` |
| 1808+ | FASE 3 — página `operacao` |

## O que ainda falta

Os arquivos abaixo são referenciados por `docs/handoff-claude-code.md` e por
`docs/primeiro-prompt.md` e ainda não foram escritos. Nada foi inventado no lugar
deles de propósito.

| Arquivo | Conteúdo esperado |
|---|---|
| `00-visao-geral.md` | escopo, objetivo do corte |
| `01-estado-atual-bubble.md` | como o app funciona hoje |
| `02-modelo-de-dados.md` | entidades, relações, de-para com o Bubble |
| `03-acessos.md` | o que master e indicante veem em cada página |
| `04-fases.md` | Fase 0 a N, escopo de cada uma |
| `05-migracao.md` | extração, transformação, carga, corte |
| `06-decisoes-pendentes.md` | o que ainda está em aberto |
| `07-divida-herdada.md` | o que do Bubble **não** reproduzir |

O modelo de dados (`02`) está parcialmente resolvido: foi derivado direto da
FASE 2 da documentação e já virou `db/001_fundacao.sql` e `db/002_dominio.sql`,
com as decisões registradas em comentário dentro do próprio SQL. Falta transpor
para spec.

## Decisões em aberto que já apareceram

1. **Campos financeiros como texto.** `faturamento_anual`, `estimativa_faturamento`,
   `margem_liquida`, `passivo_oneroso` e `ativos` são `text` no Bubble e guardam
   valor monetário em formato livre. Virar `numeric` depende de decidir o de-para
   na carga. Mantidos `text` por ora.
2. **Recorte de acesso do indicante.** `db/003_rls.sql` implementa: indicante vê
   só os clientes em que está em `cliente_visualizador`, as operações e etapas
   desses clientes, e os cartões de funil em que está. É o recorte mínimo
   defensável, não o levantado com o negócio — no Bubble a autorização estava em
   `tbl.config` (página × nível) e nas privacy rules, que eram amplas demais para
   copiar.
3. **RLS desligada.** Decisão de 17/09/2026. Ver `docs/seguranca.md`.
4. **"Quatro níveis de acesso".** `docs/primeiro-prompt.md` fala em quatro. O
   option set `NivelDeAcesso` do Bubble tem **dois**: Master e Indicante. O que
   tem quatro opções é `Páginas`. O esquema seguiu o app real.
