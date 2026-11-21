# Tasks

## 1. Busca filtrada

- [x] 1.1 Em `src/api/transactions.ts`, mudar `fetchCombinedTransactions` para `(range, account?, signal?)`. Ela passa a repassar `owner` e `accountId` a `fetchTransactions` e a devolver `filteredAccountName`: o nome da conta filtrada, o id quando o nome não existe, ou `null` sem filtro (decisão 2). Ajustar a chamada atual em `TransactionsPage`. Verificar com testes em `src/api/` (MSW): sem filtro, a URL não leva `owner` nem `accountId`; com filtro, leva os dois e as datas; o nome vem de `/accounts`; com `/accounts` falhando, o nome é o id. `npx tsc -b` e `npm test` passando

## 2. Tela de Transações

- [x] 2.1 Em `src/pages/TransactionsPage.tsx`, ler `owner` e `accountId` com `useSearchParams` (decisão 1), incluir os dois na chave da consulta e mostrar o aviso "Conta: {nome}" com `OwnerAvatar` e o link "Ver todas" para `/transactions` sempre que o filtro estiver ativo (decisões 3 e 4). Verificar com os testes do item 2.2
- [x] 2.2 Em `src/pages/TransactionsPage.test.tsx`, cobrir:
  - `/transactions?owner=marcelo&accountId=a1` consulta com os dois e mostra "Conta: Nubank" e o dono;
  - mudar a data mantém `owner` e `accountId` na nova consulta;
  - "Ver todas" faz a próxima consulta sem filtro e com as mesmas datas, e some o aviso;
  - só `accountId` ou só `owner` consulta sem filtro e não mostra o aviso;
  - `/accounts` falhando mostra o id no aviso;
  - 404 da conta filtrada mostra a mensagem, "Tentar de novo" e o aviso com "Ver todas";
  - sem filtro, os testes atuais continuam passando.

  Verificar com `npm test` passando

## 3. Link na aba Contas

- [x] 3.1 Em `src/pages/AccountsPage.tsx`, acrescentar a cada conta bancária o link "Ver transações", com `sr-only` " de {nome}" e destino `/transactions?owner=...&accountId=...` (decisão 5). O saldo continua à direita. Em `src/pages/AccountsPage.test.tsx`, verificar:
  - "Ver transações de Nubank" com `href` `/transactions?owner=marcelo&accountId=a1`;
  - um `accountId` com caractere especial sai codificado;
  - cartões não têm o link;
  - os testes atuais continuam passando.

  `npm test` passando
- [x] 3.2 Em `src/App.test.tsx`, acrescentar um caso: acionar "Ver transações de Nubank" na aba Contas abre a tela de Transações com o aviso "Conta: Nubank". `npm test` passando

## 4. Verificação final

- [x] 4.1 Rodar `npm run lint`, `npm test` e `npm run build` e verificar que os três passam
- [ ] 4.2 Com `npm run dev` e a `financial_api` rodando, abrir Contas, acionar "Ver transações" de uma conta bancária e conferir que só as transações dela aparecem. Depois, mudar o período, recarregar a página, acionar "Ver todas" e conferir que a lista completa volta com o mesmo período
