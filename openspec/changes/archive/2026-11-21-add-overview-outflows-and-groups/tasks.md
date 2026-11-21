# Tasks

## 1. Card Saídas no período

- [x] 1.1 Adicionar `AccountDebit` e `accountDebits` em `SummaryResponse.expenses` (`src/api/types.ts`) e no `summaryFixture`. Verificar com `npx tsc -b` sem erros.
- [x] 1.2 Generalizar `IncomesByAccount` em `TransactionsByAccount`, recebendo o sentido para o `TransactionRow`. Verificar que os testes de "Entradas no período por conta" continuam passando.
- [x] 1.3 Adicionar o card "Saídas no período" com a nota sobre pagamentos de fatura e transferências próprias. Verificar em `OverviewPage.test.tsx`: total, grupos por conta com subtotal e ordem, linha de saída com "−", "Nenhum item." sem saídas, nota visível e atualização ao mudar "De" e "Até".

## 2. Grupos Entradas e Despesas

- [x] 2.1 Reorganizar a página em duas seções com `h2` "Entradas" e "Despesas", com grade por grupo, e passar os títulos dos cards para `h3`. Verificar em teste que os títulos existem, que cada card está no grupo certo e que os `h3` seguem a ordem dos cards.
- [x] 2.2 Conferir que os totais e o detalhe dos quatro cards antigos não mudaram. Verificar que os testes existentes da visão geral passam sem ajuste.
- [x] 2.3 Rodar `npm test`, `npm run build` e `npx oxlint`, e confirmar que passam.
- [ ] 2.4 Conferir a visão geral no navegador com o resumo real, nos temas claro e escuro. Verificar que os dois grupos, o novo card e a nota aparecem corretamente e que o total de saídas bate com o esperado.
