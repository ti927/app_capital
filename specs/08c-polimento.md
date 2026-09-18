# Frente C — Desempenho, dropdown inline, animação e polimento

> Roteiro para um terminal. Contexto completo em `specs/08-melhorias-qol.md`.
> Leia antes: `CLAUDE.md`, `design/design-system/`, `src/components/ui/*`,
> `src/app/interface.css`.
> **Não abra** `src/app/(app)/funil/**`, `operacoes/**`, `esteira/**`,
> `clientes/**` (exceto criar o `loading.tsx` de cada uma) nem `db/**` — são de
> outra frente. Você é o dono dos componentes compartilhados: **não mude a
> assinatura** de `Campo`, `Dialogo`, `SeletorPopup` e `SeletorMultiploPopup`,
> porque duas outras frentes estão usando esses componentes agora.

Branch: `qol-polimento`. Merge por último; rode o QA de novo depois do merge.

---

## C1 · Por que parece lento (e é só ida e volta de rede)

Cada navegação hoje faz, **em série e antes da primeira pintura**:

1. middleware renova a sessão;
2. `LayoutApp` chama `perfilAtual()` → `auth.getUser()` + consulta `perfil`;
3. a `page.tsx` chama `perfilAtual()` **de novo** — mais duas idas;
4. só então as consultas da tela (o funil faz sete em paralelo).

Não existe **nenhum** `loading.tsx` no projeto: até tudo isso terminar, a tela
anterior fica parada na frente do usuário.

Conserto, nesta ordem:

1. `src/lib/perfil.ts`: embrulhe `perfilAtual` em `cache()` do React
   (`import { cache } from 'react'`) — uma vez por requisição em vez de duas.
   `ehMaster()` passa a custar zero.
2. `loading.tsx` em `/funil`, `/clientes`, `/fornecedores`, `/operacoes`,
   `/esteira` — cada um imitando a **forma** da tela (topo + lista, topo +
   tabela, topo + colunas do quadro), com o `Esqueleto` de
   `@/components/ui/base` e animação de brilho. Não é um spinner centralizado:
   é o esqueleto do conteúdo que vai aparecer.
3. Navegação instantânea: `<Link prefetch>` nos itens de `NavLateral` (hoje é
   `<a>` em `casca.tsx`/`navlateral.tsx` — `<a>` recarrega a aplicação inteira,
   `Link` não). Confira também o "Sair"/"Senha" da barra.
4. Onde a consulta é grande e independente, envolva em `<Suspense>` para a
   casca pintar antes dos dados.

Meça antes e depois com o painel de rede (navegação entre duas telas) e anote o
número no commit.

## C2 · Dropdown inline, sem pop-up

`src/components/ui/seletor-popup.tsx` abre um `Dialogo` inteiro para escolher um
valor — inclusive dentro de célula de tabela que já está dentro de um diálogo. O
usuário não pode precisar entrar em outra tela para preencher um campo.

Vira **popover ancorado no gatilho**:

- posição calculada do `getBoundingClientRect()` do gatilho, em `position:
  fixed`, para escapar do `overflow` da tabela e do diálogo; abre para cima
  quando não cabe embaixo; largura mínima = largura do gatilho.
- mantém a busca embutida quando há 8 opções ou mais (o motivo original
  continua: 31 tipos, 73 fundos) — agora dentro do próprio popover.
- teclado: `↑ ↓` navegam, `Enter` escolhe, `Esc` fecha, `Tab` fecha e segue.
  `role="listbox"` / `role="option"`, `aria-expanded` no gatilho.
- fecha por clique fora e por rolagem do contêiner.
- o múltiplo (`SeletorMultiploPopup`) segue o mesmo desenho, sem fechar a cada
  clique, com "Limpar" e "Pronto" no rodapé do popover.
- **props idênticas**. Só o interior muda.

O nome do arquivo pode continuar; se renomear, atualize todos os importadores —
e avise, porque duas frentes estão mexendo nos importadores.

## C3 · Texto longo com respiro

`.lc-field__input` é `padding: 0 var(--space-5)` com `height` fixo: num
`<textarea>` o padding vertical fica zero e o texto cola na borda. Em
`interface.css` (o `design-system.css` é regravado por `npm run tokens`, não
edite lá):

```css
textarea.lc-field__input {
  height: auto;
  padding: var(--space-4) var(--space-5);
  line-height: 20px;
}
```

Confira também `.campo-alto` / `.campo-medio`, o `min-height`, e o espaçamento
entre rótulo e campo nos textos longos (Parecer, Histórico, Observação). Olhe
lado a lado com `design/design-system/` — é isso que o pedido chama de
"polimento do design system".

## C4 · Animação

Padrão: **150–180ms**, `ease-out`, e tudo dentro de
`@media (prefers-reduced-motion: reduce) { animation: none; transition: none }`.
CSS novo em `src/app/animacoes.css`, importado pelo layout raiz.

- **Diálogo**: overlay com `fade` do preto; caixa com `fade` + `translateY(8px)
  → 0` e `scale(.98) → 1`. Na saída também — hoje `Dialogo` faz `return null`
  direto; guarde um estado de "fechando" por ~150ms antes de desmontar,
  **sem mudar a API** (`aberto` / `aoFechar` continuam iguais).
- **Troca de página**: um client component fino em `(app)/layout.tsx` que usa
  `usePathname()` como `key` e aplica `fade` + `translateY(6px)` no
  `main.casca__conteudo`. Não segure a navegação esperando animação.
- **Popover** (C2): `fade` + `translateY(-4px)`, 120ms.
- Micro: `transition` no hover dos botões e dos cartões já existe em parte —
  uniformize com os tokens.

## C5 · Fechamento

- `npm run verify` antes de cada commit.
- `npm run qa` nas três formas (`padrão`, `-- --escuro`, `-- --celular`) e
  **abra as capturas** — regra 5. Você é quem mexe no que todas as telas usam:
  confira dropdown dentro de tabela dentro de diálogo, no escuro e no celular.
- Depois do merge de A e B, rode o QA outra vez: as telas novas passam a usar o
  seu dropdown e o seu esqueleto.
- Se acrescentar passo de QA, acrescente onde fizer sentido — `scripts/qa.mjs`
  é seu; A e B só acrescentam no fim do arquivo.

Commits sugeridos: `perf: perfil em cache e esqueleto de carregamento por rota` ·
`feat: dropdown inline no lugar do pop-up` ·
`fix: padding do campo de texto longo` · `feat: animacao de dialogo e de troca de pagina`.
