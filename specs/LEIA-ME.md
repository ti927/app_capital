# specs — o que falta

Esta pasta é a fonte de verdade do projeto. Hoje ela está **vazia**: os arquivos
abaixo são referenciados por `docs/handoff-claude-code.md` e por
`docs/primeiro-prompt.md`, mas ainda não foram trazidos para o repositório.

Nada foi escrito no lugar deles de propósito — inventar especificação é pior que
não ter.

| Arquivo | Conteúdo esperado | Status |
|---|---|---|
| `00-visao-geral.md` | escopo, objetivo do corte | falta |
| `01-estado-atual-bubble.md` | como o app funciona hoje | falta |
| `02-modelo-de-dados.md` | entidades, relações, de-para com o Bubble | falta |
| `03-acessos.md` | os quatro níveis de acesso e o que cada um vê | falta |
| `04-fases.md` | Fase 0 a N, escopo de cada uma | falta |
| `05-migracao.md` | extração, transformação, carga, corte | falta |
| `06-decisoes-pendentes.md` | o que ainda está em aberto | falta |
| `07-divida-herdada.md` | o que do Bubble **não** reproduzir | falta |
| `bubble/documentacao-completa.md` | mapeamento do app atual (~2.500 linhas) | falta |

Também falta `db/001_schema.sql` — o esquema alvo em rascunho.

## Por que isso bloqueia

Sem `02-modelo-de-dados.md` e sem a documentação do Bubble não há como escrever as
migrations das tabelas de domínio: as entidades, seus campos, tipos e relações
estariam sendo adivinhados. O que dá para construir sem elas é só a fundação
(log de evento, níveis de acesso, RLS, helpers) — ver `db/`.
