# Fases

Estado em 17/09/2026. As estimativas vêm do tamanho medido de cada tela no Bubble
(`specs/bubble/documentacao-completa.md`, FASE 1), não de chute.

## O que já está pronto

| | |
|---|---|
| Repositório | `ti927/app_capital`, privado |
| Banco | Supabase, Postgres 17, 28 tabelas aplicadas |
| Dados | migrados do Bubble: 94 clientes, 73 fundos, 71 operações, 383 etapas, 18 cartões |
| Acessos | 5 contas em `auth.users`, 5 perfis, 107 vínculos de "quem visualiza" |
| Design | design system da Lure aplicado, com tokens gerados do `tokens.json` |
| Aplicação | Fases 0 a 5 feitas — as cinco telas de pé, rodando com dado real |
| QA | `npm run qa`: 28 passos em três formas (claro, escuro, celular 390px) |
| MCP | servidor de só leitura com 8 ferramentas sobre o banco |

**Falta a Fase 6.** E dentro dela, uma coisa bloqueia tudo: a RLS.

## Escopo

### Fora deste corte

**`respforms1` — respostas de pesquisa.** Decidido em 17/09/2026. A tabela tem
zero registros; a tela existe no Bubble e não está em uso. As tabelas
`formulario_resposta` e `formulario_resposta_item` ficam no banco, vazias e sem
custo — se a pesquisa voltar, a estrutura está lá.

### Em aberto

**Esteira de Estruturação.** De 388 etapas migradas, **uma** tem dado de esteira:
instrumento, checklist, volume, data de início, papéis. As outras 387 têm só
status, fundo e tipo.

É a segunda tela mais cara do sistema — 257 elementos, 34 workflows, o checklist
de 11 itens com slider, os três blocos condicionais por instrumento — para um
registro de uso real. Duas leituras possíveis, e só o negócio decide qual:

- a tela não pegou e pode sair do primeiro corte; ou
- ela é o futuro do processo e o uso baixo é justamente o problema a resolver.

Tirá-la do caminho crítico economiza cerca de 2 dias. **Decidir antes da Fase 4.**

---

## As fases

Uma branch por fase. `main` sempre publicável. Cada fase é vertical slice
completa: migration → API → tela → teste, com `npm run verify` passando.

### Fase 0 — Fundação · ~1 dia

Next.js App Router com TypeScript, Tailwind e shadcn/ui configurados com os
tokens da Lure. Cliente Supabase de servidor e de navegador, com o fluxo de
sessão. Login por e-mail e senha, **estruturado para o Google entrar depois sem
retrabalho** (ver "Autenticação"). O shell: header e menu lateral, com os itens
que somem para o indicante. `npm run verify` = typecheck + lint + teste.

Sem tela de domínio. A entrega é: aplicação que sobe, autentica e navega.

### Fase 1 — Clientes · ~1 dia
*116 elementos, 22 workflows*

Lista com busca, diálogo de cadastro e edição no mesmo componente, e-mails do
cliente, quem visualiza, arquivar, desarquivar, excluir. Bloco de arquivados.

Roda contra os 94 clientes que já estão no banco. É a fase que fixa o padrão que
as outras copiam.

### Fase 2 — Fornecedor · ~1,5 dia
*192 elementos, 20 workflows*

Duas abas — tabela de fundos e a matriz tipo de operação × fundos. Diálogo com os
quatro seletores múltiplos sobre os 31 tipos. Arquivados.

### Fase 3 — Operação · ~4 dias
*420 elementos, 61 workflows — a maior do sistema*

Três abas (Cliente, Fornecedor, Status), o painel de quatro colunas com soma, e o
diálogo pesado: campos da operação, observações, declínios, e a tabela de etapas
com célula de dupla forma e edição por linha.

Sozinha tem mais workflows que as Fases 1 e 2 somadas. Vale quebrar em duas
entregas: primeiro a lista e as abas, depois o diálogo.

### Fase 4 — Funil · ~2 dias
*90 elementos, 11 workflows*

Kanban com arraste de cartão e de coluna, tags, diálogo do cartão. No Bubble era
um componente HTML de 74 mil caracteres falando direto com a Data API; aqui é
React contra o Postgres.

As tarefas do funil (`funil_tarefa`) existem no banco e o Bubble não usa. Ficam
fora, como estão hoje.

### Fase 5 — Esteira · ~2 dias · **condicional**
*257 elementos, 34 workflows*

Só se a decisão em aberto acima resolver por incluir.

### Fase 6 — Fechamento · ~1,5 dia

RLS ligada (`db/003_rls.sql` já está escrito), Google Auth, deploy na Vercel,
testes de ponta a ponta, e a re-extração final do Bubble antes do corte.

---

## Total

| Escopo | Prazo |
|---|---|
| Com Esteira | ~13 dias úteis |
| Sem Esteira | ~11 dias úteis |

São dias de trabalho focado, com IA ajudando o tempo todo. Não é uma tarde: a
migração dos dados foi uma tarde, e está feita. O aplicativo é outra ordem de
grandeza — a tela de Operação sozinha tem 61 workflows.

---

## Autenticação

**Agora:** e-mail e senha. As 5 contas existem, com senha provisória em
`dados/credenciais-provisorias.txt` (fora do git). Cada pessoa troca no primeiro
acesso.

**Depois:** Google. Os cinco e-mails são Gmail ou do domínio
`lureconsultoria.com.br` (Workspace), e todas as contas foram criadas com
`email_confirm`. Ligar o provedor Google no Supabase faz o login cair nessas
mesmas contas — o vínculo é por e-mail confirmado. Nenhuma conta precisa ser
recriada, nenhum vínculo se perde.

Para não haver retrabalho, a Fase 0 já deve: usar `signInWithOAuth` ao lado do
`signInWithPassword` na mesma tela, e nunca tratar senha como parte da identidade
do usuário no código da aplicação.

---

## Risco aberto

**A RLS está desligada** por decisão do projeto, e agora existe dado real de
cliente no banco — 94 clientes, 71 operações, com CNPJ, faturamento e parecer.

Enquanto a aplicação não estiver publicada o risco é contido, porque a `anon key`
ainda não saiu para a internet. **Ela sai no primeiro deploy da Vercel**, que é a
Fase 6. Ligar a RLS antes disso, não depois. Ver `docs/seguranca.md`.
