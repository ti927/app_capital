# 14 · Pop-ups de cliente, fornecedor e operação — UI 1 e UI 2

Decidido em 14/10/2026.

## UI 1 — Clássico (padrão de todos)

- Nos três pop-ups o **nome do campo vem antes do campo**, na mesma linha
  (rótulo à esquerda). Pareceres e textos longos mantêm o rótulo em cima. No
  celular o rótulo volta para cima.
- Ordem da operação, aos pares:
  - Cliente | Identificador
  - Faturamento anual | Status atual da operação
  - Demanda | Prazo
  - Destino do recurso (linha inteira; antes de Garantias desde 15/10/2026)
  - Garantias sugeridas | Carência
  - depois: pareceres, interruptores, observações, limites/fundos assinados,
    tabela de fundos e, por último, **Declínios** (abaixo das tabelas, pedido de
    14/10/2026; fica fora da <form> e viaja no salvar pelo `form=`).
- **Faturamento anual vem do cliente**: ao escolher o cliente numa operação nova
  e ao abrir uma operação com o faturamento vazio.
- **PMTS, Comissão e Demanda final saem da tela**, não do banco. A action da
  operação só grava as colunas que vieram no formulário, para não apagar o que já
  existe. "Linha" (tipo de operação) fica para depois.
- Cliente e fornecedor mantêm a ordem de campos que já tinham.

## UI 2 — Moderno (opcional)

Desenho em `design/ui2-popups.md`. Mesmos campos, mesma ordem, mesmas actions,
mesmo salvar otimista: ficha com resumo no topo, seções com ícone, campos lado a
lado, índice de seções.

- **Só master escolhe** (Configurações → Preferências → Pop-ups de cadastro).
  Indicante não vê Configurações e fica sempre no Clássico, mesmo que haja outro
  valor gravado.
- A escolha fica em `perfil.ui_popups` (`classica` | `moderna`, padrão
  `classica`), db/014. Grava pela função `definir_ui_popups`, security definer
  que só mexe nessa coluna e só na linha de quem está logado.

## QA

O bloco da UI 2 em `scripts/qa.mjs` liga o Moderno, confere os três pop-ups e
volta para o Clássico. A preferência é da conta, e as três formas do `qa:tudo`
usam a mesma conta: o bloco espera as três chegarem (barreira) e roda uma forma
por vez (trava). Pelo mesmo motivo o passo do interruptor "Estruturação em
Andamento", que mexe numa operação real e volta, roda sob trava. Travas de
corrida morta expiram em 8 minutos.
