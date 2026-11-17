# Tasks

## 1. Componente de linha compartilhado

- [x] 1.1 Criar `src/components/TransactionRow.tsx` (decisão 1) com o ícone de entrada ou saída, a descrição, `detail`, `aside`, o valor com "− " nas saídas e `amountNote`, mantendo `role="img"`, `aria-label` e as classes de cor e de modo escuro da linha atual. Verificar com `npx tsc -b` sem erros.
- [x] 1.2 Usar o componente na `TransactionsPage` (decisão 2), com o avatar e o nome da conta em `aside`, sem mudar o que a tela mostra. Verificar com `npm test` passando, sem alterar os testes de `TransactionsPage.test.tsx`.
- [x] 1.3 Cobrir o componente em `src/components/components.test.tsx`: variante de entrada, variante de saída com "−", `detail`, `aside` e `amountNote`. Verificar com `npm test` passando.

## 2. Linha da compra na visão geral

- [x] 2.1 Em `PurchasesByCard`, trocar o texto corrido pela `TransactionRow` (decisões 3 e 4): saída, descrição com a parcela apagada, data em `detail`, valor em BRL como principal e o original em `amountNote`, e só o valor original quando não há valor em BRL. Remover `ExpenseTransactionItem`. Verificar com `npx tsc -b` sem erros.
- [x] 2.2 Atualizar em `OverviewPage.test.tsx` os testes que procuram o texto corrido e acrescentar os casos da decisão 6: ícone "Saída", "−" no valor, data e parcela na linha, compra estrangeira, estrangeira sem valor em BRL e dono e cartão fora das linhas. Verificar com `npm test` passando, com o subtotal e o total do card inalterados nos testes de grupo.

## 3. Verificação final

- [x] 3.1 Rodar `npm run lint`, `npm test` e `npm run build` e verificar que os três passam.
- [ ] 3.2 Com `npm run dev` e a `financial_api` rodando, abrir a visão geral e a tela de transações e conferir que a linha da compra tem o mesmo visual da transação, no modo claro e no escuro e em largura estreita, e que a tela de transações não mudou.

## Workflow follow-up

- Arquivar a change na mesma branch do PR, antes do merge.
