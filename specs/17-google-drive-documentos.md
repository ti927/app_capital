# 17 — Google Drive: documentos do cliente e a página Conexões

Pedido de 22/10/2026. Decisões tomadas com o Fabio no mesmo dia.

## O que é

- Uma aba **Documentos** no cliente lista os arquivos do Drive da Lure que são
  daquele cliente, organizados por pasta, e abre PDFs, imagens e documentos
  sem sair do app.
- A página **Agenda** (`/conta/agenda`) vira **Conexões** (`/conta/conexoes`),
  com dois cards: Google Agenda e Google Drive.

## Decisões

| Pergunta | Decisão |
|---|---|
| De qual Drive? | **Drive compartilhado da Lure.** Uma conexão só, da empresa, feita por um master. O app lê de lá para todos. |
| Como achar os documentos "pelo nome"? | **Pasta com o nome do cliente.** A aba mostra o conteúdo dessa pasta, com as subpastas navegáveis. |
| Quem vê a aba? | **Quem já vê o cliente** — a mesma regra do cadastro (RLS de `cliente`). Master vê todos; indicante, os clientes dele. |

## Como funciona

- **Conexão** (`google_drive_conexao`, db/016): uma linha só (`id = 1`), com o
  refresh token cifrado (AES-256-GCM, `GOOGLE_TOKEN_CHAVE`, igual à agenda) e,
  opcionalmente, a **pasta raiz** dos clientes. Fechada para a sessão do
  usuário (GRANT revogado + RLS sem policy); só o servidor lê, com a
  `service_role`. Escopo pedido: `drive.readonly` — o app nunca grava no Drive.
- **Achar a pasta**: busca pasta (não arquivo) cujo nome contém o
  nome/razão social do cliente, em todos os drives a que a conta conectada tem
  acesso (`corpora=allDrives`). Com pasta raiz definida, só dentro dela.
  Preferência: nome idêntico (sem caixa e sem acento) > o que contém. Mais de
  uma candidata: usa a primeira e mostra quantas outras existem.
- **Abrir arquivo**: o indicante não tem acesso ao Drive da Lure, então o
  arquivo passa pelo app (`/api/drive/[clienteId]/[arquivoId]`), que confere
  (1) que a pessoa enxerga o cliente — pela RLS — e (2) que o arquivo está
  dentro da pasta do cliente, subindo os pais. Documentos do Google (Docs,
  Planilhas, Apresentações) saem exportados em PDF.
- **Sem conexão**: a aba diz que o Drive não está conectado; para master, com
  link para Conexões.

## Fora do escopo (por ora)

- Enviar arquivo para o Drive pelo app.
- Criar a pasta do cliente automaticamente.

## Depende de fora do código

- No Google Cloud do OAuth (o mesmo da agenda): **ativar a Google Drive API** e
  incluir o escopo `https://www.googleapis.com/auth/drive.readonly` na tela de
  consentimento.
