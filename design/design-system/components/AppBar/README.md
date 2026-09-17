Barra superior de 56px com a assinatura centrada e os controles de conta à direita.

**Ela não carrega navegação.** No app_capital a navegação mora na barra lateral (`SideNav`); a barra
superior só tem marca e conta. Fundo `surface-sunken`, borda inferior de 1px em `border`, padding
lateral `space-7`.

## O que o consumidor fornece
`chip` (o subtítulo da assinatura — "CAPITAL"), `href` e `settings={false}` para o nível indicante.
As ações em si — sair, trocar senha, abrir Configurações — são do consumidor.

## Arranjo, da esquerda para a direita
1. Nada. A assinatura fica **centrada na largura da janela**, não encostada à esquerda — é o
   arranjo do original e ele não muda.
2. À direita, nesta ordem: **sair** (ícone) · **trocar senha** (ícone de cadeado) ·
   **Configurações** (botão secundário com ícone de engrenagem e texto).

Para o nível **indicante** o botão Configurações some; os dois ícones ficam.

## Regras
- A assinatura é centrada por posicionamento absoluto, então o grupo da direita pode crescer sem
  empurrá-la. Se algum dia o grupo da direita passar de metade da barra, a marca encosta à
  esquerda — não deixe a marca deslocar.
- Os dois ícones sem texto levam `aria-label` **e** `title`.
- Altura fixa de `app-bar-h`. A barra do Bubble é mais alta que 56px; o design system reduz para
  56px junto com o resto da densidade, e isso é troca de aparência, não de arranjo.
- **Pendência:** os ícones são marcadores temporários até o conjunto de ícones ser decidido, e a
  assinatura usa o símbolo do Lure CRM até o vetor policromático "LURE ✛ CAPITAL" chegar.
