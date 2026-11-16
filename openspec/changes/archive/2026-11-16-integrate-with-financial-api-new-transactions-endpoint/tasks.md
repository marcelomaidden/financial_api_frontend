# Tasks

## 1. Camada de API

- [x] 1.1 Trocar `fetchTransactionsPage` por `fetchTransactions({ owner?, accountId?, dateFrom?, dateTo? })` em `src/api/endpoints.ts` e atualizar os tipos em `src/api/types.ts`. Verificar com testes em `endpoints.test.ts` de que a URL leva os parâmetros informados e não leva os omitidos
- [x] 1.2 Reescrever `fetchCombinedTransactions` em `src/api/transactions.ts` para chamar `/transactions` e `/accounts` em paralelo, mapear os nomes, converter `errors` em avisos e manter a ordem recebida. Verificar com `TransactionsPage.test.tsx`: linhas na ordem recebida, nome da conta, id no lugar do nome quando `/accounts` falha, e uma única chamada a `/transactions`
- [x] 1.3 Remover a chamada a `/credit-cards` de `fetchAccountNames` em `src/api/transactions.ts`, usando só `/accounts`. Verificar com um teste em que `/accounts` traz uma conta de cartão e `/credit-cards` não é chamado, o nome do cartão aparece e `npm test` passa

## 2. Tela

- [x] 2.1 Agrupar as transações por data em `TransactionsPage`, com ícone e cor de entrada e saída, e remover o contador "n/m contas". Verificar com um teste que confere as seções por data, o ícone e a cor de `CREDIT` e de `DEBIT`, e o "−" na saída
- [x] 2.2 Tratar `errors` nos avisos, com e sem `accountId`. Verificar com testes dos dois avisos

## 3. Integração

- [ ] 3.1 Com a `financial_api` rodando com `GET /transactions`, abrir `/transactions` e conferir que a lista vem em uma chamada, em ordem decrescente de data, sem cabeçalhos de data repetidos, e que `npm run lint`, `npm test` e `npm run build` passam
