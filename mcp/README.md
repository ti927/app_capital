# Camada MCP — app_capital

Um servidor MCP que abre o banco da Lure Capital como ferramentas para um
agente. Serve para perguntar em português o que hoje exige SQL:

> *"Quais operações estão paradas no Banco ABC?"*
> *"Que fundos atendem CRI e aceitam faturamento abaixo de 20MM?"*
> *"Quantas etapas foram declinadas pelo fundo neste ano?"*

Não é parte do aplicativo. É ferramenta de quem toca o projeto.

---

## Só leitura, e a trava é do banco

Nenhuma das oito ferramentas escreve, e a sessão abre com:

```sql
set session characteristics as transaction read only
```

Com isso `UPDATE`, `DELETE` e DDL falham **no servidor**, não numa checagem
do JavaScript. Testado: as três recusam com *"cannot execute … in a read-only
transaction"*.

A razão de tanto zelo: este servidor conecta com a **senha do Postgres**, que
ignora qualquer permissão, e a RLS do projeto está desligada. Dar escrita aqui
seria dar escrita irrestrita a quem rodasse o agente.

> **Armadilha, para quem for mexer:** `options: '-c
> default_transaction_read_only=on'` na conexão **não funciona** — o pooler do
> Supabase descarta opções de startup. A trava parece existir e não existe.
> Foi assim que eu escrevi primeiro, e só descobri porque testei um `update`.

---

## Configurar

O servidor lê `DIRECT_URL` do ambiente e, se não achar, do `.env` da raiz.
Como o `.env` já está preenchido, não é preciso configurar nada.

### No Claude Code

O `.mcp.json` na raiz já declara o servidor. Ao abrir o projeto, o Claude Code
pergunta se você confia nele; aceite uma vez.

Conferir: `/mcp` na sessão.

### No Claude Desktop

Em `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "app-capital": {
      "command": "node",
      "args": ["C:/Users/fabio/Downloads/files/mcp/servidor.mjs"]
    }
  }
}
```

### Conferir por fora

```bash
node mcp/servidor.mjs
```

Fica esperando na entrada padrão — é o esperado, o protocolo é por stdio.
`Ctrl+C` encerra.

---

## As ferramentas

| Ferramenta | Para quê |
|---|---|
| `panorama` | contagens e distribuições da base. Bom primeiro passo |
| `listar_tabelas_de_apoio` | os 14 status de etapa, 31 tipos de operação e 4 status de operação — os valores válidos para filtrar |
| `buscar_clientes` | por nome, razão social ou CNPJ; traz quantas operações cada um tem |
| `detalhar_cliente` | ficha completa, com e-mails, quem enxerga e as operações |
| `buscar_fornecedores` | por nome, segmento foco, ou tipo de operação que atendem |
| `buscar_operacoes` | por cliente, status, ou fundo envolvido em alguma etapa |
| `detalhar_operacao` | a operação com etapas, observações e declínios |
| `listar_funil` | o quadro por coluna, com cartões e tags |

Todas devolvem JSON. As de busca aceitam `limite` (padrão 50, teto 200) e
`incluir_arquivados` (padrão `false`).

### Uma nota sobre os valores

Faturamento, demanda, volume e margem são **texto livre** no banco — vêm do
Bubble como `"40MM"`, `"40.000.000"`, `"quarenta milhões"`. O servidor devolve
como está. Não peça ao agente para somar esses campos sem antes combinar como
normalizá-los.

---

## Estender

Cada ferramenta é um `servidor.registerTool` com nome, descrição, esquema de
entrada em `zod` e a consulta. Duas regras:

1. **Consulta parametrizada, sempre.** `$1`, `$2`, nunca concatenação — valor
   que vem do agente é entrada não confiável como qualquer outra.
2. **Descrição que diga quando usar**, não só o que faz. É por ela que o
   agente escolhe a ferramenta certa.

Se algum dia precisar de escrita, não afrouxe este servidor: faça outro, com
um papel do Postgres criado só para isso e com `GRANT` nas tabelas que ele
pode tocar.
