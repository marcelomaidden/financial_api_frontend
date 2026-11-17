# Proposal

## Why

No detalhe do card "Compras do cartão sem fatura", cada compra aparece como uma linha de texto corrido (`Netflix · 05/11/2026 · US$ 58,00 → R$ 298,19`). A tela de transações mostra o mesmo tipo de dado com ícone de saída, descrição à esquerda e valor em vermelho numa coluna à direita, o que é mais fácil de ler e de comparar. As duas telas passam a parecer a mesma coisa.

## What Changes

- Cada compra dentro dos grupos por cartão passa a usar a mesma linha das transações: ícone redondo de saída (↑, vermelho), descrição com truncamento, e valor em vermelho, precedido de "−", em uma coluna à direita.
- O cabeçalho de cada grupo (avatar do dono, nome do cartão e subtotal), a ordem dos grupos e das compras, o aviso de compra fora da soma e o total do card ficam como estão.
- O dono e o nome do cartão não se repetem nas linhas, porque o cabeçalho do grupo já os mostra.
- A data da compra vai na linha, em tom apagado, já que o agrupamento não é por dia. A parcela (`3/10`) aparece ao lado da descrição, em tom apagado.
- Na compra em outra moeda, o valor em BRL é o valor principal, e o valor original (`US$ 58,00`) aparece apagado embaixo. Sem valor em BRL, a linha mostra só o valor original e continua fora do subtotal, como hoje.
- O ícone, a cor e o "−" da linha ficam num componente compartilhado, usado também pela tela de transações, para as duas não divergirem. O comportamento da tela de transações não muda.
- Fora de escopo:
  - o agrupamento por cartão, o subtotal e a ordem;
  - os outros três cards da visão geral;
  - mudanças na `financial_api` ou no `/summary`;
  - agrupar as compras por dia.

## Capabilities

### New Capabilities

### Modified Capabilities
- `combined-overview`: ganha um requisito de aparência para as compras sem fatura (saída com ícone, valor vermelho com "−", data, parcela e compra estrangeira). Os requisitos existentes continuam valendo.

## Impact

- Código: `src/pages/OverviewPage.tsx` (linha da compra no `PurchasesByCard`) e `src/pages/TransactionsPage.tsx` (passa a usar o componente compartilhado, sem mudar o que mostra). Um componente novo em `src/components`.
- Testes: os testes da visão geral que procuram `Netflix ... US$ 58,00 → ... 298,19` e `Notebook (3/10)` acompanham o novo layout. O teste da tela de transações que confere a classe `text-red-600` e o "−" continua valendo e protege o componente compartilhado.
- Documentação: o README não cita esse detalhe.
- Sem mudança de dependências, variáveis de ambiente nem API.
