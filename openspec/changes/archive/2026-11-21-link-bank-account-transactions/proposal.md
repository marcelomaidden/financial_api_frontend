# Proposal

## Why

Na aba Contas, cada fatura de cartão leva ao detalhe dela, mas uma conta bancária não leva a lugar nenhum. Para ver as transações de uma conta, o usuário precisa abrir a tela de Transações e procurar a conta numa lista que mistura todas as contas e cartões dos dois donos. A `financial_api` já filtra `GET /transactions` por `owner` e `accountId`, e a SPA ainda não usa isso.

## What Changes

- Cada conta bancária da aba Contas ganha o link "Ver transações". O nome acessível inclui o nome da conta (por exemplo, "Ver transações de Nubank"), no padrão do botão "Ver faturas". O link leva a `/transactions?owner=<dono>&accountId=<id da conta>`.
- A tela de Transações lê `owner` e `accountId` da URL. Com os dois preenchidos, ela busca na API só essa conta e mostra no topo o aviso "Conta: <nome>", com o dono e um link "Ver todas" que volta para `/transactions` sem filtro.
- O período continua valendo com o filtro. A tela abre no mês corrente, e mudar as datas mantém a conta filtrada.
- Uma URL incompleta (só `owner` ou só `accountId`) mostra a lista completa, sem filtro e sem chamar a API com parâmetros que ela recusa.
- Uma conta inexistente ou de outro dono segue o tratamento de erro atual da tela, com a mensagem da API e "Tentar de novo". O aviso do filtro e o "Ver todas" continuam visíveis.
- Sem filtro na URL, a tela continua igual: todas as contas de todos os donos.

Fora de escopo:
- filtro por tipo de conta (bancária ou cartão), que fica para outra change;
- filtro só por dono;
- escolha de conta dentro da tela de Transações (lista de seleção);
- link de transações para os cartões, que continuam com "Ver faturas";
- mudanças na `financial_api`.

## Capabilities

### New Capabilities

### Modified Capabilities
- `combined-accounts`: cada conta bancária ganha o link para as transações dela.
- `combined-transactions`: o requisito "Lista única de transações" passa a aceitar o filtro por uma conta vindo da URL, com o aviso do filtro e o "Ver todas". Sem filtro, o comportamento atual não muda.

## Impact

- **Código:**
  - `src/pages/AccountsPage.tsx`: o link em cada conta bancária.
  - `src/pages/TransactionsPage.tsx`: leitura da URL, aviso do filtro, chave da consulta com dono e conta.
  - `src/api/transactions.ts`: `fetchCombinedTransactions` repassa `owner` e `accountId` a `fetchTransactions`, que já aceita os dois.
- **Testes:** `AccountsPage.test.tsx`, `TransactionsPage.test.tsx` e possivelmente `App.test.tsx` (a rota com query string).
- **API:** nenhuma mudança. `GET /transactions?owner=&accountId=&dateFrom=&dateTo=` já existe e já está documentado na `financial_api`.
- **Rotas:** nenhuma rota nova. O fallback para `index.html` já atende `/transactions?...` recarregada.
