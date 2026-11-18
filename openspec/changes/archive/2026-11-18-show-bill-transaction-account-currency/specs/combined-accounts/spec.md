## MODIFIED Requirements

### Requirement: Compras da fatura
O sistema SHALL listar as compras da fatura na ordem recebida da API (da mais recente para a mais antiga), cada uma com descrição, data e valor, e com a parcela (número e total) quando houver.

#### Scenario: Compra parcelada
- **WHEN** uma compra traz `installment` com número 3 e total 10
- **THEN** a linha da compra mostra a parcela "3/10" junto da descrição

#### Scenario: Estorno
- **WHEN** uma transação da fatura tem o tipo de crédito
- **THEN** a linha aparece como entrada, e as demais aparecem como saída

#### Scenario: Valores em outra moeda
- **WHEN** uma compra tem `currencyCode` USD, valor 58,00 e `amountInAccountCurrency` 298,19, numa fatura em BRL
- **THEN** a linha mostra R$ 298,19, na moeda da fatura, como valor principal e US$ 58,00 em destaque menor abaixo dele

#### Scenario: Outra moeda sem valor convertido
- **WHEN** uma compra tem `currencyCode` diferente da moeda da fatura e não traz `amountInAccountCurrency`
- **THEN** a linha mostra só o valor na moeda da compra
