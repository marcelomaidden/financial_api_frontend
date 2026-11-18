# Tasks

## 1. Tipos e endpoint

- [x] 1.1 Em `src/api/types.ts`, acrescentar `BillFinanceCharge`, `BillPayment`, `BillDetail`, `BillTransaction` e `BillDetailResponse` conforme o contrato (decisão 3), reaproveitando `Installment`. Verificar com `npx tsc -b` sem erros.
- [x] 1.2 Em `src/api/endpoints.ts`, criar `fetchBillDetail(owner, accountId, id, signal)` chamando `/bill/${encodeURIComponent(id)}` com `owner` e `accountId` na query (decisão 2). Verificar com `npx tsc -b` sem erros.
- [x] 1.3 Em `src/api/endpoints.test.ts`, cobrir `fetchBillDetail`: caminho `/api/bill/<id>`, `owner` e `accountId` na query, `id` com caractere especial codificado no caminho, leitura do exemplo do contrato (incluindo `installment` e campos nulos) e propagação de um 404 com a `message` do `ApiErrorBody`. Verificar com `npm test` passando.

## 2. Página de detalhe

- [x] 2.1 Criar `src/pages/BillDetailPage.tsx` (decisões 4 e 5): lê `id`, `owner` e `accountId`; consulta com `useQuery` (chave `['bill-detail', owner, accountId, id]`, desabilitada sem `owner` ou `accountId`); mostra o link "Voltar para Contas", `Loading`, `ErrorMessage` com nova tentativa, o resumo (vencimento, fechamento, total, mínimo, parcelamento quando houver), encargos, pagamentos e compras com `TransactionRow` e parcela `número/total`, com as mensagens de lista vazia. Verificar abrindo a página nos testes do item 2.3.
- [x] 2.2 Em `src/App.tsx`, registrar `<Route path="bills/:id" element={<BillDetailPage />} />` dentro do `Layout`. Verificar com o teste de rota do item 2.4.
- [x] 2.3 Criar `src/pages/BillDetailPage.test.tsx` (MSW, rota montada com `/bills/b1?owner=marcelo&accountId=c1`): consulta com dono, conta e id; resumo com valores formatados; fechamento e mínimo nulos mostram "-"; encargos e pagamentos listados; compra parcelada mostra `3/10`; transação `CREDIT` como entrada; carregando; 404 e 502 mostram a `message` sem resumo nem compras e o botão "Tentar de novo" refaz a consulta; compras, encargos e pagamentos vazios; endereço sem `owner` ou sem `accountId` não chama a API; link de volta aponta para `/accounts`. Verificar com `npm test` passando.
- [x] 2.4 Em `src/App.test.tsx`, acrescentar um caso em que a rota `/bills/b1?owner=marcelo&accountId=c1` renderiza o detalhe dentro do layout (menu "Principal" presente). Verificar com `npm test` passando.

## 3. Link na aba Contas

- [x] 3.1 Em `src/pages/AccountsPage.tsx`, no `BillsPanel`, acrescentar a cada fatura um `<Link>` "Ver detalhe" com complemento `sr-only` " da fatura com vencimento dd/mm/aaaa" (ou " da fatura sem vencimento"), apontando para `/bills/<id codificado>?owner=...&accountId=...` (decisão 6), mantendo o texto `Vencimento ...` e o total. Verificar com o teste do item 3.2.
- [x] 3.2 Em `src/pages/AccountsPage.test.tsx`, acrescentar casos: cada fatura tem um link com o nome acessível "Ver detalhe da fatura com vencimento 20/11/2026"; o `href` leva `/bills/b1?owner=marcelo&accountId=c1`; `id` com caractere especial é codificado; fatura sem `dueDate` tem o link "da fatura sem vencimento". Os testes atuais de faturas e de paginação continuam passando. Verificar com `npm test` passando.

## 4. Verificação final

- [x] 4.1 Rodar `npm run lint`, `npm test` e `npm run build` e verificar que os três passam.
- [ ] 4.2 Com `npm run dev` e a `financial_api` com `GET /bill/{id}` rodando, abrir Contas, listar as faturas de um cartão, acionar o link de uma fatura e conferir o resumo, as compras (com parcela) e o link de volta; recarregar a página de detalhe e conferir que continua funcionando; abrir uma fatura inexistente e conferir a mensagem de erro.

## Workflow follow-up

- Arquivar a change depois da revisão do projeto e da publicação do endpoint na `financial_api`.
