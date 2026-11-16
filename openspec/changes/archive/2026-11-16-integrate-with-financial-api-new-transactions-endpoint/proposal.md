# Proposal

## Why

A tela de transações chamava `/accounts` e, para cada conta, a rota de transações com paginação por `after`. A `financial_api` ganhou `GET /transactions`, que devolve tudo em uma chamada, ordenado, com as falhas parciais em `errors`. Usar o endpoint novo reduz o número de chamadas e tira do FE a lógica de paginação, de concorrência e de ordenação.

## What Changes

- A busca passa a ser uma chamada a `GET /transactions` com `dateFrom` e `dateTo`, no lugar de uma chamada por conta e por página.
- A ordem da lista vem da API (data decrescente). O FE não reordena.
- Os avisos de dados incompletos saem de `errors`. Um erro com `accountId` nulo indica falha ao listar as contas do dono.
- O nome da conta ou do cartão vem de `GET /accounts`, que já traz as contas bancárias e os cartões. A chamada a `/credit-cards`, que repetia os cartões, deixa de existir.
- A tela agrupa as transações por data, com um cabeçalho por dia, e mostra ícone e cor diferentes para entrada (`CREDIT`) e saída.
- **BREAKING** (interno): o contador "n/m contas" do carregamento sai, porque não há mais chamadas por conta.

## Capabilities

### New Capabilities

### Modified Capabilities
- `combined-transactions`: a lista vem de uma chamada única, a paginação por cursor sai, a falha parcial lê `errors`, e a lista passa a ser agrupada por data com entrada e saída distintas.

## Impact

- Código: `src/api/endpoints.ts` (`fetchTransactions` no lugar de `fetchTransactionsPage`), `src/api/transactions.ts`, `src/api/types.ts`, `src/pages/TransactionsPage.tsx` e seus testes, `src/api/endpoints.test.ts` e `src/App.test.tsx`.
- API: depende de `GET /transactions` da `financial_api` (change `transactions-endpoint-just-one-call`, em andamento no repo da API). A rota por conta continua na API, mas o FE deixa de usá-la.
- Fora de escopo: os filtros `owner` e `accountId` do endpoint, e pedir `accountName` à API.
