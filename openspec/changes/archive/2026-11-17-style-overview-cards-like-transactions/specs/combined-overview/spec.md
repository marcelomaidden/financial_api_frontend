## ADDED Requirements

### Requirement: Entradas do período agrupadas por conta
O sistema SHALL agrupar, no detalhe do card "Entradas no período", as entradas por conta bancária, identificada pelo dono e pelo `accountId`. Cada grupo SHALL mostrar o dono, o nome da conta e o subtotal, que soma o valor das entradas do grupo. Os grupos SHALL ficar pelo maior subtotal, e as entradas de cada grupo SHALL ficar da data mais recente para a mais antiga.

#### Scenario: Entradas de uma conta
- **WHEN** o resumo traz duas entradas do dono "marcelo" na conta `a1`
- **THEN** o detalhe mostra um grupo com o dono, o nome da conta `a1` e as duas entradas, e o subtotal é a soma delas

#### Scenario: Duas contas
- **WHEN** o resumo traz entradas de duas contas, do mesmo dono ou de donos diferentes
- **THEN** o detalhe mostra um grupo para cada conta, pelo maior subtotal primeiro

#### Scenario: Soma dos grupos
- **WHEN** o resumo traz entradas de mais de uma conta
- **THEN** a soma dos subtotais dos grupos é igual ao total exibido no card

#### Scenario: Sem entradas
- **WHEN** o resumo não traz entradas no período
- **THEN** o detalhe mostra "Nenhum item." e nenhum grupo

### Requirement: Nome da conta das entradas sem bloquear o card
O sistema SHALL obter o nome de cada conta bancária das entradas da lista de contas, sem bloquear o card, e SHALL usar o `accountId` como título do grupo enquanto o nome não chegar ou quando ele não estiver disponível. A falha da lista de contas SHALL NOT mostrar erro nem esconder o card.

#### Scenario: Nome disponível
- **WHEN** a lista de contas traz a conta `a1` com o nome "Nubank"
- **THEN** o título do grupo é "Nubank"

#### Scenario: Nome da conta indisponível
- **WHEN** a lista de contas ainda não chegou, falhou ou não traz a conta
- **THEN** o grupo usa o `accountId` como título, o card e o subtotal aparecem, e a tela não mostra erro por isso

### Requirement: Entradas no padrão visual das transações
O sistema SHALL mostrar cada entrada do período como uma entrada no padrão visual da tela de transações: ícone de entrada, descrição, data embaixo da descrição e valor na cor de entrada, sem "−", em uma coluna à direita. A linha SHALL NOT repetir o dono nem o nome da conta, que ficam no cabeçalho do grupo.

#### Scenario: Entrada em BRL
- **WHEN** uma conta tem a entrada "PIX Recebido" de R$ 19,99 em 10/11/2026
- **THEN** a linha mostra o ícone de entrada, a descrição, a data 10/11/2026 e o valor R$ 19,99 na cor de entrada, sem "−"

#### Scenario: Dono e conta só no cabeçalho
- **WHEN** um grupo mostra as entradas de uma conta
- **THEN** o dono e o nome da conta aparecem uma vez, no cabeçalho do grupo, e não em cada linha

### Requirement: Faturas a pagar como linhas de saída
O sistema SHALL mostrar cada fatura do card "Faturas a pagar" como uma linha de saída no padrão visual das transações: ícone de saída, o nome do cartão como descrição, o vencimento embaixo da descrição, o avatar do dono ao lado e o valor na cor de saída, precedido de "−". O sistema SHALL NOT agrupar as faturas, e SHALL mostrá-las pelo vencimento, com a que vence primeiro no topo.

#### Scenario: Fatura de um cartão
- **WHEN** o cartão "Cartão Nubank" do dono "marcelo" tem uma fatura de R$ 250,40 que vence em 20/11/2026
- **THEN** a linha mostra o ícone de saída, "Cartão Nubank", o vencimento 20/11/2026, o avatar de "marcelo" e o valor R$ 250,40 na cor de saída, precedido de "−"

#### Scenario: Faturas em ordem de vencimento
- **WHEN** o resumo traz faturas que vencem em 25/11/2026, 10/11/2026 e 20/11/2026
- **THEN** o detalhe as mostra na ordem 10/11/2026, 20/11/2026 e 25/11/2026

#### Scenario: Sem faturas
- **WHEN** o resumo não traz faturas a pagar
- **THEN** o detalhe mostra "Nenhum item."

### Requirement: Saldo disponível como linhas por conta
O sistema SHALL mostrar cada conta do card "Saldo disponível" como uma linha no padrão visual das transações, com o avatar do dono no lugar do ícone de direção, o nome da conta como descrição e o saldo em uma coluna à direita, em cor neutra, nem de entrada nem de saída. O sistema SHALL NOT agrupar as contas, e SHALL mostrá-las pelo maior saldo primeiro.

#### Scenario: Conta com saldo
- **WHEN** o dono "marcelo" tem a conta "Nubank" com saldo de R$ 500,50
- **THEN** a linha mostra o avatar de "marcelo", "Nubank" e o saldo R$ 500,50 em cor neutra

#### Scenario: Saldo negativo
- **WHEN** uma conta tem saldo negativo
- **THEN** a linha mostra o saldo com o sinal negativo, na mesma cor neutra

#### Scenario: Contas pelo maior saldo
- **WHEN** o resumo traz contas com saldos de R$ 100,00, R$ 900,00 e R$ 300,00
- **THEN** o detalhe as mostra na ordem R$ 900,00, R$ 300,00 e R$ 100,00

### Requirement: Totais e demais cards inalterados
O sistema SHALL manter o total de cada card, o aviso de dados parciais e o card "Compras do cartão sem fatura" como estão, independentemente do visual do detalhe dos outros cards.

#### Scenario: Totais iguais aos de antes
- **WHEN** a visão geral é exibida com o novo visual
- **THEN** os totais dos quatro cards têm os mesmos valores de antes

#### Scenario: Card de compras sem mudança
- **WHEN** o detalhe do card "Compras do cartão sem fatura" é aberto
- **THEN** ele mostra os mesmos grupos por cartão, subtotais e linhas de antes
