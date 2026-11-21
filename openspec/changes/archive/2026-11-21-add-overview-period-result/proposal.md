# Proposal

## Why

A Visão geral mostra quanto entrou e quanto saiu das contas no período, mas não o resultado. Os dois totais são brutos: uma transferência entre contas dos donos aparece nas entradas e nas saídas e infla os dois. Na diferença entre eles, essa transferência se anula. O resultado do período responde "sobrou ou faltou dinheiro" sem precisar reconhecer transferências.

## What Changes

- Novo card "Resultado do período": "Entradas no período" menos "Saídas no período", numa faixa no topo da página, fora dos grupos Entradas e Despesas.
- O valor do resultado fica na cor de entrada quando positivo, na cor de saída com "−" quando negativo, e em cor neutra quando zero.
- O detalhe do card lista cada conta com movimento no período: quanto entrou, quanto saiu e o resultado da conta. A soma dos resultados das contas é igual ao total do card. As transferências internas aparecem como resultado positivo numa conta e negativo em outra.
- A nota de "Saídas no período" passa a dizer também que as transferências entre contas próprias se anulam no resultado do período.
- "Entradas no período" e "Saídas no período" mantêm os totais brutos. Nenhuma transação é excluída.

Fora de escopo: reconhecer ou marcar transferências e qualquer mudança na API.

## Capabilities

### New Capabilities
<!-- Nenhuma. -->

### Modified Capabilities
- `combined-overview`: a visão geral ganha o card "Resultado do período" com detalhe por conta, e muda a nota de "Saídas no período".

## Impact

- `src/pages/OverviewPage.tsx` e `src/pages/OverviewPage.test.tsx`. Possivelmente uma função de cálculo em `src/lib/`.
- Sem mudança na API: o resultado sai de `incomes.transactions` e `expenses.accountDebits`, que já vêm no resumo.
