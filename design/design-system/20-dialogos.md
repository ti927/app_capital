# Diálogos — inventário completo de campos

Um diálogo **mostra todos os seus campos, sempre, na mesma forma**. Nenhum campo esconde por
estar vazio, nenhum vira "avançado", nenhum muda de lugar entre criar e editar. O que muda entre
criar e editar é só o rótulo do botão de confirmação.

**A forma, igual em todos:** faixa superior colorida com o X à direita · corpo em grade de duas
colunas com gap `space-5`, campo de `control-h-md`, rótulo acima em `field-label` · um campo que
ocupa as duas colunas quando é multilinha ou lista longa · régua de 1px separando blocos de
assunto · botão de confirmação no rodapé. Componente: `Dialog` + `Field`.

Larguras: `dialog-w-sm` 620px (formulário curto) · `dialog-w-md` 880px (duas colunas) ·
`dialog-w-lg` 1120px (com tabela ou lista embutida).

A ordem abaixo é a de produção. `|` separa duas colunas na mesma linha; `——` é uma régua.

---

## Cliente — criar e editar

Sem título na faixa. Botão: **"Cadastrar"** quando é novo, **"Salvar"** quando o nome já está
preenchido.

| # | Campo | Forma |
|---|---|---|
| 1 | Nome/razão social \| CNPJ | texto \| texto |
| 2 | Email | rótulo + ícone que abre o pop-up de adicionar; a lista de e-mails aparece abaixo e **some quando vazia** |
| 3 | Diretor/gerente | texto, largura inteira |
| 4 | Cidade \| Telefone | texto \| texto |
| 5 | Atividade da CIA | texto, largura inteira |
| 6 | Faturamento anual \| Margem líquida | **texto livre** |
| 7 | Ativos \| Passivo oneroso | **texto livre** |
| 8 | Quem indicou \| Quem visualiza: | texto \| seletor múltiplo de usuários ("Escolha aqui") |
| 9 | Demanda \| Estimativa de faturamento | **texto livre** |
| 10 | Parecer | multilinha alta, largura inteira |
| 11 | Status cliente | seletor, largura inteira ("Escolha aqui") |

Opções de **Status cliente**: contato inicial · mandato-nda em negociação · mandato assinado com
fee · mandato assinado sem fee.

É o **mesmo diálogo** usado na tela Cliente e no Funil — um componente só.

## Fornecedor — criar e editar

O **nome do fundo é o título editável** no topo do corpo, em tipo grande, com o mesmo
"Digite aqui" de placeholder. Botão: **"Cadastrar"** / **"Salvar"**, com ícone de cursor antes do
texto.

| # | Campo | Forma |
|---|---|---|
| 1 | *(nome do fundo)* | título editável no topo |
| 2 | Cidade | texto, largura inteira |
| 3 | Número \| Email | texto \| texto |
| 4 | Contato \| PF ou PJ | texto \| texto |
| 5 | Fee | texto, largura inteira |
| 6 | Parecer | multilinha, largura inteira |
| 7 | Status \| Link de Indicação | seletor ("Escolha uma opção") \| texto ("Link") |
| —— | | |
| 8 | Tipos de operações | seletor múltiplo sobre os 31 tipos, largura inteira |
| 9 | 1º Linha \| 2º Linha | seletor múltiplo \| seletor múltiplo |
| 10 | Tipos de operações não atendidas | seletor múltiplo, **tags em vermelho**, largura inteira |
| 11 | Faturamento mínimo \| Operação mínima | **texto livre** |
| 12 | Segmento foco \| Segmento que não atua | texto \| texto |

Opções de **Status**: contato inicial · contrato-nda em negociação · contrato-nda assinado com fee ·
nda assinado sem fee. Os seletores de 1º e 2º Linha só oferecem tipos que **não** estão em "não
atendidas".

## Operação

Abre a partir do lápis de uma linha da aba Cliente, ou de "Nova Operação". Largura `dialog-w-lg`.

Blocos, na ordem: **"Escolher cliente:"** + seletor — *só aparece quando a operação é nova* ·
os campos (garantias sugeridas, limites/fundos assinados, declínios, PMTS, prazo, carência,
"Demanda em R$", faturamento anual vindo do cliente, parecer da operação) · o **bloco de
observações**, que some quando não há cliente · a **tabela de etapas** · a **linha de criação de
etapa** (só master) · **"Parecer Cliente"**, que some quando não há cliente.

**Tabela de etapas** — colunas nesta ordem:

| Fundo | Tipo de operação | Na mão de | Status | *(ações)* | Alterado em: |

Cada célula tem **duas formas**: texto em leitura, campo em edição. A edição é **por linha**,
acionada pelo lápis; as ações são salvar · editar · deletar e o grupo inteiro some para o
indicante. "Alterado em:" mostra `dd/mm`. A tabela some quando não há nenhuma etapa.

> **Ainda não capturado.** Este diálogo não veio nas capturas. O inventário acima vem do documento
> de design e **precisa de conferência contra a tela** antes de virar artboard.

## Esteira

Largura `dialog-w-lg`. Faixa superior colorida com X, sem título nela.

| # | Campo | Forma |
|---|---|---|
| 1 | **Operação:** + tipo + " - " + cliente | cabeçalho de leitura, não editável |
| 2 | Instrumento: | seletor múltiplo ("Escolha os instrumentos"), largura inteira |
| 3 | Volume: | texto com prefixo "R$", largura inteira |
| 4 | **Instituição Líder:** | título de seção com régua; o valor é **calculado** |
| 5 | Inicio: | seletor de data |
| 6 | Ts Assinado: | interruptor |
| 7 | Adicionar etapa: | ícone que acrescenta uma etapa, ao lado do título **"Lista de Etapas"** |
| 8 | *(checklist)* | 11 itens, abaixo |
| 9 | Operação de pé: | interruptor |
| 10 | Fee Recebido: | interruptor |

**Checklist**, na ordem de produção. Cada item é **rótulo + slider de 0 a 100 + "%" + observação
multilinha**, e a coluna de observações tem um cabeçalho próprio: **OBSERVAÇÕES**.

1. Regulamento: · 2. Contrato de Cessão · 3. Contrato de Cobrança · 4. Arquivos de Remessa e
Retorno: · 5. Integralização de cota sub: · 6. Integralização de cotas senior e mezo: ·
7. Inclusão de DC: · 8–11. **quatro itens livres**, em que o rótulo é um campo de texto
("Digite aqui...") no lugar do nome fixo.

> **Divergência.** O documento de design lista o checklist começando por Integralização de cota
> sub e terminando em Contrato de Cobrança, com os livres no meio (posições 4 a 7). Produção usa a
> ordem acima, com os **quatro livres no fim**.

**Blocos condicionados pelo instrumento** — três, mutuamente exclusivos, que só aparecem depois de
escolher o instrumento (por isso não estão nas capturas):

| Instrumento contém | Campos, nesta ordem |
|---|---|
| FIDC Proprietário · FIAGRO · FII · SLB | Gestor · Admnistrador *(sic)* · DTVM · Assessoria Legal · Demais *(multilinha)* |
| CRA · CRI · CR | Securitizadora · DTVM · Agente Fiduciário · Custodiante · Demais *(multilinha)* |
| Debêntures | Emissor · Estruturador · Agente Fiduciário · DTVM · Demais *(multilinha)* |

O botão de gravar fica no rodapé, centrado.

## Cartão do funil — criar e editar

Título na faixa: **"Cartão criado"** quando é novo, **"Editar cartão"** quando é edição.

| # | Campo | Forma |
|---|---|---|
| 1 | Empresa \| Nome do contato | texto \| texto |
| 2 | Segmento / atividade \| Faturamento anual | texto \| **texto livre** ("Ex.: 20 milhões ou 20000000") |
| 3 | Parecer | multilinha, largura inteira, redimensionável |
| 4 | Histórico | multilinha, largura inteira, redimensionável |
| 5 | Etapa \| Indicante \| Usuário (quem enxerga o cartão) | seletor \| texto \| seletor múltiplo |
| 6 | Data inicial \| Última atualização | **somente leitura**, fundo rebaixado |
| 7 | Data do call realizado \| Data do envio do KB | data `dd/mm/aaaa` \| data `dd/mm/aaaa` |
| 8 | Tags | cinco pílulas alternáveis: Docs recebidos · Falta docs · Docs Solicit. · Congelado · Cancelado |

Rodapé, diferente dos demais: à esquerda **"● Salvo automaticamente"** e **"Excluir cartão"**; à
direita **"Arquivar"** e **"Fechar"**. Não há botão de salvar — a gravação é automática.

Num cartão novo ainda sem empresa nem contato, aparece um **aviso** acima do rodapé: "Este cartão
está salvo, mas ainda não tem empresa nem contato — ele aparece no quadro como 'Cartão em branco'."
Use `NoticeCard tone="neutral"` sobre `warning-bg`.

## Nova coluna do funil

O menor de todos, `dialog-w-sm`. Título na faixa: **"Nova coluna"**.

| # | Campo | Forma |
|---|---|---|
| 1 | Nome da coluna | texto ("Ex.: Negociação") |
| 2 | *(texto de apoio)* | "A coluna entra no fim do fluxo. Você pode reordenar em 'Colunas no fluxo'." |

Rodapé: **"Cancelar"** e **"Criar coluna"**.

## Adicionar e-mail

Título **"Adicionar Email"**, um campo, botões **"Fechar"** e **"Salvar"**.

## Exclusão

Título **"Deletar ‹entidade›"**. Texto: *"Tem certeza que deseja deletar o cliente **{nome}**? Essa
ação é permanente e não pode ser revertida."* Botões **"Cancelar"** e **"Deletar"**, o segundo em
`Button variant="danger"`.

## Troca de senha

Título **"Troca de Senha"**. Campos: Email (preenchido com o do usuário) · "Senha atual " · "Nova
senha". Botão **"Salvar"**.

## Usuário

Campos: Nome · Nível de Acesso *(obrigatório)* · CPF · Telefone · parceiro vinculado
*(placeholder "Escolha o parceiro")* · razão social · CNPJ · Região · e-mail. Botão **"Salvar"** em
edição, **"Criar"** em criação — nunca os dois.

## Painel administrativo

Abre em "Configurações". Na ordem: título "Painel Admnistrativo" *(sic)* · botão "Adicionar Maicon
a todos os clientes" · bloco recolhível **"Acesso às páginas"**, fechado, com tabela de 4 linhas
(**Página | Nível de Acesso | Usuários**) · bloco recolhível **"Usuários"**, fechado, com o botão
"Novo Usuário" e a tabela **Nome | Nível de Acesso | Email | Senha**.

> **Ainda não capturado.** Usuário, troca de senha, exclusão, adicionar e-mail e o painel
> administrativo não vieram nas capturas. O que está acima vem do documento de design e precisa de
> conferência contra a tela.
