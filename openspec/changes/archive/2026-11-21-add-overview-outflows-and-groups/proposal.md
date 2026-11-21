# Proposal

## Why

A Visão geral mostra o total de "Entradas no período", mas não o que saiu das contas no mesmo período. Os cards de despesa atuais cobrem só o cartão: "Faturas a pagar" é dívida por vencimento e "Compras do cartão sem fatura" é estado atual. Os quatro cards também ficam numa grade única, sem separar receita de despesa.

## What Changes

- Novo card "Saídas no período", alimentado por `expenses.accountDebits` do resumo (change `add-summary-account-debits` da `financial_api`). Mostra o total e o detalhe agrupado por conta, como "Entradas no período", com as linhas no padrão visual de saída.
- O card tem uma nota avisando que pagamentos de fatura e transferências entre contas próprias estão incluídos.
- A página passa a ter dois grupos com título: **Entradas** (Saldo disponível, Entradas no período) e **Despesas** (Saídas no período, Faturas a pagar, Compras do cartão sem fatura).
- Os títulos dos cards passam a ser subtítulos dos grupos. Nome, total e detalhe dos cards existentes não mudam.

## Capabilities

### New Capabilities
<!-- Nenhuma. -->

### Modified Capabilities
- `combined-overview`: o resumo combinado passa a exibir as saídas do período, e a tela ganha os grupos Entradas e Despesas.

## Impact

- `src/api/types.ts` (`AccountDebit`, `expenses.accountDebits`), `src/api/fixtures.ts`, `src/pages/OverviewPage.tsx` e `src/pages/OverviewPage.test.tsx`.
- Depende da API devolver `expenses.accountDebits`. Sem o campo, a página quebra, então a API precisa ir para produção antes ou junto.
