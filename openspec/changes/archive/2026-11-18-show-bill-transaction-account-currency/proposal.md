# Proposal

## Why

No detalhe da fatura, uma compra internacional aparece só com o valor na moeda da compra, por exemplo "US$ 58,00". Quem confere a fatura precisa saber quanto a compra custou na moeda do cartão. A visão geral já mostra isso para as compras sem fatura. O detalhe ainda não, porque a resposta de `GET /bill/{id}` não trazia o valor convertido.

## What Changes

- O tipo das compras do detalhe da fatura ganha o campo opcional `amountInAccountCurrency`, que a `financial_api` passa a enviar nas compras em moeda diferente de BRL.
- A linha de uma compra em outra moeda com `amountInAccountCurrency` mostra o valor convertido como valor principal, formatado na moeda da fatura (`bill.currencyCode`). O valor original aparece menor, embaixo, na moeda da compra. É o mesmo padrão da linha de compra da visão geral.
- Sem `amountInAccountCurrency`, a linha mostra só o valor original, como hoje. Compras em BRL não mudam.
- A cor e o sentido da linha (entrada ou saída) e o valor sem sinal não mudam.

Fora de escopo: somar as compras ou comparar com o total da fatura, e converter encargos e pagamentos.

## Capabilities

### New Capabilities

### Modified Capabilities
- `combined-accounts`: no requisito "Compras da fatura", o cenário "Valores em outra moeda" passa a exigir o valor convertido na moeda da fatura como principal e o valor original em destaque menor, quando a API envia `amountInAccountCurrency`. Sem esse valor, a linha mostra só o valor original.

## Impact

- Código: `src/api/types.ts` (`BillTransaction.amountInAccountCurrency?`), `src/pages/BillDetailPage.tsx` (linha da compra passa `bill.currencyCode` e usa `amountNote` de `TransactionRow`), `src/api/fixtures.ts` (uma compra em USD no exemplo).
- Testes: `src/pages/BillDetailPage.test.tsx` (compra em USD com e sem valor convertido) e `src/api/endpoints.test.ts` (leitura do campo).
- Dependência: a change `add-bill-transaction-account-currency` da `financial_api`. Sem ela, o campo não chega e a tela continua como hoje, sem erro.
