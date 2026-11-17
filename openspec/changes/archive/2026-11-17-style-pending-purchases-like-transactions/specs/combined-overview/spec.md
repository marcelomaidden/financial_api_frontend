## ADDED Requirements

### Requirement: Compras sem fatura no padrão visual das transações
O sistema SHALL mostrar cada compra do detalhe do card "Compras do cartão sem fatura" como uma saída no padrão visual da tela de transações: ícone de saída, descrição, e valor na cor de saída, precedido de "−", em uma coluna à direita. A linha SHALL mostrar a data e, quando houver, a parcela no formato `número/total`, e SHALL NOT repetir o dono nem o nome do cartão, que ficam no cabeçalho do grupo.

#### Scenario: Compra em BRL
- **WHEN** um cartão tem a compra "Mercado" de R$ 30,00 em 06/11/2026
- **THEN** a linha mostra o ícone de saída, a descrição "Mercado", a data 06/11/2026 e o valor R$ 30,00 na cor de saída, precedido de "−"

#### Scenario: Compra parcelada
- **WHEN** uma compra é a parcela 3 de 10
- **THEN** a linha mostra `3/10` ao lado da descrição

#### Scenario: Compra à vista
- **WHEN** uma compra não tem informação de parcela
- **THEN** a linha não mostra parcela

#### Scenario: Compra em outra moeda com valor em BRL
- **WHEN** uma compra é de US$ 58,00 com `amountInAccountCurrency` de 298,19
- **THEN** a linha mostra R$ 298,19 como valor principal e o valor original US$ 58,00 em destaque menor abaixo dele

#### Scenario: Compra em outra moeda sem valor em BRL
- **WHEN** uma compra em outra moeda não traz `amountInAccountCurrency`
- **THEN** a linha mostra só o valor original, e a compra continua fora do subtotal, com o aviso do grupo

#### Scenario: Dono e cartão só no cabeçalho
- **WHEN** um grupo mostra as compras de um cartão
- **THEN** o dono e o nome do cartão aparecem uma vez, no cabeçalho do grupo, e não em cada linha

#### Scenario: Subtotais e total inalterados
- **WHEN** o detalhe é exibido com o novo visual
- **THEN** o subtotal de cada grupo e o total do card têm os mesmos valores de antes
