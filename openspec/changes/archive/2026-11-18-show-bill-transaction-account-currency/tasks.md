# Tasks

## 1. Tipo e exemplo

- [x] 1.1 Em `src/api/types.ts`, acrescentar `amountInAccountCurrency?: number` a `BillTransaction`. Em `src/api/fixtures.ts`, acrescentar ao `billDetailFixture` uma compra em USD (`amount` -58, `currencyCode` `USD`, `amountInAccountCurrency` -298.19) e ajustar os testes que contam as compras do exemplo. Em `src/api/endpoints.test.ts`, conferir a leitura do campo na compra USD e a ausência dele numa compra BRL. Verificar com `npx tsc -b` e `npm test` passando

## 2. Linha da compra

- [x] 2.1 Em `src/pages/BillDetailPage.tsx`, passar `bill.currencyCode` à linha da compra. Com `amountInAccountCurrency` presente, `amount` vira `formatMoney(Math.abs(amountInAccountCurrency), bill.currencyCode)`. Quando `currencyCode` da compra for diferente de `bill.currencyCode`, `amountNote` vira `formatMoney(Math.abs(amount), currencyCode)`. Sem o campo, a linha fica como hoje, no padrão do `PurchaseRow` da visão geral. Verificar com os testes do item 2.2
- [x] 2.2 Em `src/pages/BillDetailPage.test.tsx`, cobrir três casos. Na compra USD com valor convertido, a linha mostra "R$ 298,19" como valor principal e "US$ 58,00" em destaque menor. Na compra USD sem valor convertido, a linha mostra só "US$ 58,00". A compra BRL e a parcela não mudam. Verificar com `npm test` passando

## 3. Verificação final

- [x] 3.1 Rodar `npm run lint`, `npm test` e `npm run build` e verificar que os três passam
- [ ] 3.2 Com `npm run dev` e a `financial_api` já com `amountInAccountCurrency` no detalhe, abrir uma fatura com compra internacional e conferir o valor em reais e o valor original embaixo
