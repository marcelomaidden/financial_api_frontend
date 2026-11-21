# Design

## Context

Motivação em `proposal.md`, comportamento na spec delta de `combined-overview`. O formato de `expenses.accountDebits` é definido na change `add-summary-account-debits` da `financial_api`: mesma forma das entradas, com `amount` sempre positivo.

`OverviewPage` renderizava os quatro cards numa só `grid sm:grid-cols-2`. `IncomesByAccount` agrupava as entradas por conta com `groupByAccount` e `AccountGroup`.

## Goals / Non-Goals

**Goals:**
- Reaproveitar o agrupamento por conta das entradas.
- Não quebrar as consultas por `region` e nome dos testes existentes.

**Non-Goals:**
- Somar saídas e faturas num total único.
- Mudar o visual ou os totais dos cards existentes.

## Decisions

**1. Generalizar o detalhe por conta.** `IncomesByAccount` virou `TransactionsByAccount`, que recebe `income` e repassa para o `TransactionRow`. Entradas e saídas mostram ícone, cor e sinal pelo sentido. `groupByAccount` e `AccountGroup` não mudam. Alternativa descartada: copiar o componente.

**2. Grupos como seções com título.** `CardGroup` é uma `<section aria-labelledby>` com `h2` e a grade dentro. Os títulos dos cards passaram de `h2` para `h3`. Os cards mantêm o `aria-label`, então as consultas por `region` continuam válidas.

**3. Nota do card.** Usa o `note` já existente em `SummaryCard`.

**4. Nome da conta.** Usa o mesmo `nameOf` das entradas, com o `accountId` como reserva.

## Risks / Trade-offs

- **Leitura junto de "Faturas a pagar"** → pagamento de fatura aparece nas saídas. A nota do card avisa, e a tela não soma os dois.
- **Grade de Despesas com três cards em duas colunas** → o terceiro card fica sozinho na linha. Aceito. A conferência visual está nas tarefas.
- **Ordem de deploy** → sem `expenses.accountDebits` na resposta, a página falha ao ler o campo. A API deve ir antes.
