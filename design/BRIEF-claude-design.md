# Lure CRM — brief de design

Documento único para desenhar as telas do Lure CRM. Traz a marca, o modelo de
dados que já está no banco, e o que cada tela precisa mostrar.

O produto é a reconstrução de um app Bubble (`planilha-lurecapital`) usado pela
Lure Consultoria para estruturar operações de crédito. Ferramenta **interna**:
usuários diários, alta densidade de informação, telas de trabalho — não é
marketing. Quem usa hoje precisa reconhecer o fluxo.

---

## 1. Marca

Tudo em `design/`. Os SVGs de `assets/` são finais; os HTMLs de `components/`
são protótipos de referência para recriar no React.

| | |
|---|---|
| Tinta | `#171717` |
| Fundo | `#f5f5f5` · superfície `#ffffff` · rebaixada `#ebebeb` |
| Borda | `#dcdcdc` · forte `#c4c4c4` |
| Ação | amarelo `#ffdd00`, texto sobre ele `#000` |
| Foco | ciano `#0abaee` |
| Sucesso / erro | `#118937` / `#c0104f` |
| Tipografia | **Archivo** 400–900 · mono **IBM Plex Mono** |
| Raio | 2 / 4 / 6px · borda 1px, foco 2px |

Paleta completa em `lure-crm-tokens.css` — usar os tokens, não os hex soltos.

O símbolo é o "+" em 5 blocos, miolo amarelo. Nunca recolorir os braços, nunca
girar. Amarelo é **só** cor de ação: botão primário, miolo do símbolo. Não usar
amarelo como fundo de área grande.

---

## 2. Telas

Doze páginas no Bubble. Quatro são o produto; o resto é login, 404 e legado.

| Tela | O que é | Densidade |
|---|---|---|
| **login** | split: painel escuro com marca e tagline "Organize potencial em resultados." / formulário à direita | baixa |
| **clientes** | lista de clientes + cadastro/edição em diálogo | média |
| **fornecedor** | lista de fundos/fornecedores + cadastro em diálogo | média |
| **operacao** | a tela pesada: 420 elementos, 7 listas, 61 workflows no original | **alta** |
| **esteira_de_estruturacao** | acompanhamento por etapa, com checklist de documentos | **alta** |
| **funilclientes** | funil CRM em colunas (kanban), cartões arrastáveis | média |
| **respforms1** | respostas de um formulário de pesquisa | baixa |

Header: app bar 56px, fundo branco, borda inferior 1px `#dcdcdc`. Logo à
esquerda, navegação, busca, botão amarelo de ação primária, avatar à direita.

---

## 3. Modelo de dados

Já aplicado no Postgres. 27 tabelas. O que importa para a tela:

### cliente
`nome_razao` (obrigatório), `cnpj`, `cidade`, `telefone`, `email`, e-mails
adicionais (lista), `atividade_cia`, `diretor_gerente`, `faturamento_anual`,
`estimativa_faturamento`, `margem_liquida`, `passivo_oneroso`, `ativos`,
`demanda`, `info_adicionais`, `parecer`, `status`, `quem_indicou`, `arquivado`.

Os cinco campos financeiros são texto livre hoje — o desenho não deve assumir
formatação numérica garantida.

### fornecedor
`nome_fundo` (obrigatório), `contato`, `email`, `numero`, `cidade`, `pf_ou_pj`,
`status`, `na_mao_de`, `segmento_foco`, `segmento_nao_atua`, `operacao_minima`,
`faturamento_minimo`, `fee`, `parecer`, `link_indicacao`, `arquivado`.

Mais os tipos de operação que ele atende, em cinco papéis: **1ª linha, 2ª linha,
3ª linha, atende, não atende**. Isso é um seletor múltiplo de 31 opções repetido
cinco vezes — precisa de um componente que não vire uma parede.

### operacao
`identificador`, cliente, tipo de operação, status, `demanda_inicial`,
`demanda_final`, `destino_recurso`, `faturamento_anual`, `garantias_sugeridas`,
`limites_fundos_assinados`, `prazo`, `carencia`, `pmts`, `comissao`, `parecer`,
e cinco booleanos: tem fee, NDA assinado, mandato assinado, mandato assinado
fornecedor, estruturação em andamento. Mais observações (lista) e declínios
(quais fornecedores recusaram).

### etapa_operacao — a esteira
Uma operação tem N etapas, uma por fundo. Cada etapa tem status, fundo,
`dt_inicio`, `volume`, e onze papéis de texto: emissor, estruturador,
custodiante, administrador, agente fiduciário, assessoria legal,
securitizadora, DTVM, gestor, demais. Três booleanos: op de pé, TS assinado,
fee recebido.

E o **checklist**: itens com rótulo, descrição e valor numérico — arquivos,
regulamento, contrato de cessão, contrato de cobrança, integralização sub,
integralização sênior, incorporação DC, mais até 4 itens livres. No Bubble eram
30 colunas fixas; agora é uma lista de tamanho variável.

### funil
`funil_quadro` → `funil_etapa` (colunas) → `funil_cartao`. Cartão tem empresa,
contato, segmento, faturamento, indicante, parecer, histórico, `data_kb`,
`data_call`, tags coloridas e usuários. Mais `funil_tarefa` com prazo,
conclusão e responsável.

---

## 4. Listas que definem componente

**Status (14)** — aguardando interesse · teaser enviado · documentação inicial
enviada · docs requeridos · operação em análise · proposta feita · em estudo ·
operação aprovada · contrato enviado · contrato assinado · já cliente do fundo ·
paralisado · declinado pelo fundo · declinado pelo cliente.

São 14 e têm progressão: os quatro últimos são estados terminais (dois deles
negativos). Merece tratamento visual distinto de "em andamento", não um badge
cinza para tudo.

**Tipo de operação (31)** — Antecipação de Contratos, Antecipação de Recebíveis,
Aquisição de Ativos, BNDES, Câmbio, Capital de Giro, CDA-WA, CR, CCB, CCI, CPR,
CRA, CRI, Custeio, Debêntures, FCO, FGI, FIAGRO, FIDC Proprietário, FII, FIP,
FINEP, Home Equity, Hot Money, Imobiliária/Incorporadora, M&A, Nota Comercial,
PRONAF, SLB, Venda, Vendor.

31 opções em select simples é ruim. Precisa de busca.

**Nível de acesso (2)** — master e indicante. Master vê tudo; indicante vê só o
que está vinculado a ele. Quatro páginas controladas por permissão: clientes,
fornecedores, operação, esteira de estruturação.

---

## 5. O que o Bubble fazia e vale manter

- Cadastro e edição no **mesmo diálogo**, alternando pelo campo nome preenchido.
- Arquivar em vez de excluir — `arquivado` é booleano em cliente, fornecedor,
  operação e cartão. A lista filtra por ele.
- A esteira mostra a operação por fundo, lado a lado: o usuário compara.

## 6. O que não reproduzir

- Filtro feito no navegador sobre a lista inteira (`Do a search for` +
  `:filtered`). Vira filtro no servidor.
- O mesmo pop-up duplicado em duas páginas — é um componente.
- Trinta colunas fixas de checklist na tela da esteira.
- Campo de senha em texto na tela de perfil.

---

## 7. Restrição de contexto

Nada é responsivo-first: é ferramenta de desktop, usada em tela larga o dia
todo. Densidade importa mais que respiro. Mas o funil e as listas são usados em
reunião, do celular — essas três telas (clientes, fornecedor, funil) precisam
funcionar em 390px.

Referência completa do comportamento atual, tela a tela, com árvore de elementos
e workflows: `specs/bubble/documentacao-completa.md` (2.540 linhas). Consultar a
seção da tela que estiver desenhando, não o arquivo inteiro.
