# Fluxo de trabalho

## Ciclo por fase

1. Abrir a sessão em modo `plan` e pedir o plano da fase.
2. Revisar e corrigir o plano. É aqui que você gasta atenção, não depois.
3. Sair do plan mode e mandar executar.
4. `npm run verify` tem que passar antes do commit.
5. PR por fase, não por arquivo.

## Commits

Português, formato convencional:

```
feat: cadastro de cliente com carteira
fix: filtro de fornecedor ignorava arquivados
chore: migration inicial do esquema
docs: decisão sobre o de-para de status
```

Um commit por passo lógico. Nada de "wip" nem commit de 40 arquivos.

## Branches

`main` sempre publicável. Uma branch por fase: `fase-0-fundacao`, `fase-1-acessos`.

## Onde colocar decisão nova

Toda decisão que você tomar durante a implementação vai para `specs/`, não fica só
na conversa. Sessão do Claude Code não persiste; `specs/` persiste.

Quando uma decisão de `specs/06-decisoes-pendentes.md` for resolvida, tire do 06 e
coloque no arquivo de especificação que ela afeta.

## Economia de contexto

O que funciona:

- `CLAUDE.md` enxuto. Ele entra em toda sessão; se crescer, todo prompt fica mais caro.
- `specs/` fatiado por assunto, para ele ler só o que precisa.
- Não pedir para "ler o repositório inteiro". Aponte o arquivo.
- A documentação do Bubble tem 2.500 linhas. Peça a seção, nunca o arquivo.
- `/compact` quando a sessão ficar longa; sessão nova a cada fase.

## Sobre os plugins de economia de token

Você perguntou sobre `ponytail`, `caveman` e `polygraph`. O resumo honesto:

**caveman** — anunciava 65% de redução e mediu 8,5% em benchmark pareado. Pule.

**ponytail** — anunciado como −54% de código e −22% de tokens; medido em 80 tarefas
pareadas: −15% de código e cerca de −10% de custo e tempo, sem diferença de qualidade
detectável. A economia só aparece onde havia espaço para superengenharia. O problema
é de encaixe: ele empurra YAGNI, e boa parte deste projeto é reproduzir fielmente
uma estrutura que já existe. Use no modo `lite` em refatoração e revisão;
desligue nas fases de construção de módulo.

```
/plugin marketplace add DietrichGebert/ponytail
/plugin install ponytail@ponytail
```

**polygraph** — não é economia, é verificação: deriva uma função de transição a
partir do código e reexecuta traces reais para achar divergências. O próprio autor
descreve como experimental e não revisado por pares, e avisa que é checagem de
consistência, não prova. Faz sentido na Fase 3, nas transições de status de etapa,
que são de fato uma máquina de estados. Não antes.

```
/plugin marketplace add jdubray/polygraph
/plugin install polygraph@polygraph
```

Os ganhos maiores de contexto vêm do `CLAUDE.md` enxuto e das specs fatiadas,
não dos plugins.

## Segurança no dia a dia

- `.env` e `dados/` estão no `.gitignore` e no `deny` do `.claude/settings.json`.
- As regras de `deny` do Bash casam com o texto do comando, não são barreira de
  sistema: `Bash(curl *)` negado não impede `/usr/bin/curl`. Serve para evitar o
  caminho acidental, não um ataque.
- Nunca cole chave de API no chat. Ponha no `.env` e cite o nome da variável.
- A chave do Bubble usada na migração deve ser rotacionada depois do corte.
