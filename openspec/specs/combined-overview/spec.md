# combined-overview Specification

## Purpose

Mostrar, em uma tela, a situação financeira de todos os donos somada no período escolhido, com base no resumo da API.

## Requirements

### Requirement: Resumo combinado do período
O sistema SHALL exibir os totais de `incomes.available`, `incomes.transactions`, `expenses.accountDebits`, `expenses.owed` e `expenses.transactions` do resumo, em BRL, somando todos os donos.

#### Scenario: Período padrão
- **WHEN** o usuário abre a visão geral sem escolher período
- **THEN** o sistema consulta o resumo sem `dateFrom` e `dateTo`, e exibe os cinco totais do mês corrente

#### Scenario: Período escolhido
- **WHEN** o usuário informa uma data inicial e uma final
- **THEN** o sistema consulta o resumo com `dateFrom` e `dateTo` em `yyyy-mm-dd` e atualiza os totais, incluindo o de "Saídas no período"

### Requirement: Detalhe por dono
O sistema SHALL permitir ver os itens que compõem cada total, identificando o dono de cada item.

#### Scenario: Expandir um total
- **WHEN** o usuário abre o detalhe de "faturas a pagar"
- **THEN** o sistema lista cada fatura com nome do cartão, vencimento, valor e dono

#### Scenario: Compra parcelada ou em moeda estrangeira
- **WHEN** uma compra do cartão traz `installment` ou `amountInAccountCurrency`
- **THEN** o sistema mostra a parcela (`número/total`) e o valor em BRL usado no total

### Requirement: Aviso de dados parciais
O sistema SHALL avisar quando o resumo vier com `partial` verdadeiro, informando quais donos falharam, e SHALL continuar exibindo os dados disponíveis.

#### Scenario: Um dono falhou
- **WHEN** a resposta traz `partial: true` e `errors` com o dono "luana"
- **THEN** o sistema exibe os totais recebidos e um aviso de que os dados de "luana" estão incompletos

### Requirement: Estados de carregamento e falha
O sistema SHALL indicar o carregamento e SHALL mostrar a mensagem de erro da API quando a consulta falhar por completo.

#### Scenario: API indisponível
- **WHEN** a consulta do resumo falha com 502, 504 ou erro de rede
- **THEN** o sistema mostra uma mensagem de erro e uma ação para tentar de novo

### Requirement: Compras sem fatura agrupadas por cartão
O sistema SHALL agrupar, no detalhe do card "Compras do cartão sem fatura", as compras por cartão, identificado pelo dono e pelo `accountId`. Cada grupo SHALL mostrar o dono, o nome do cartão e o subtotal. As compras de um grupo SHALL manter a mesma informação de hoje: descrição, parcela, data e valor, com a moeda original e o valor em BRL nas compras estrangeiras. O agrupamento SHALL NOT alterar o total do card nem os outros três cards.

#### Scenario: Compras de um cartão
- **WHEN** o resumo traz três compras do dono "marcelo" no cartão `c1`
- **THEN** o detalhe mostra um grupo com o dono, o nome do cartão `c1` e as três compras dentro dele

#### Scenario: Dois cartões
- **WHEN** o resumo traz compras de dois cartões, do mesmo dono ou de donos diferentes
- **THEN** o detalhe mostra um grupo para cada cartão, e as compras de um cartão não aparecem no grupo do outro

#### Scenario: Mesmo accountId em donos diferentes
- **WHEN** dois donos têm compras com o mesmo `accountId`
- **THEN** o sistema mostra um grupo para cada dono

#### Scenario: Sem compras
- **WHEN** o resumo não traz compras sem fatura
- **THEN** o detalhe mostra "Nenhum item.", como antes, e nenhum grupo

### Requirement: Subtotal por cartão
O sistema SHALL mostrar em cada grupo o subtotal em BRL das compras dele. A compra em BRL SHALL somar o `amount`, e a compra em outra moeda SHALL somar o `amountInAccountCurrency`. A compra em outra moeda sem `amountInAccountCurrency` SHALL aparecer na lista do grupo e SHALL NOT entrar no subtotal, e o grupo SHALL avisar que há compra fora da soma. A soma dos subtotais de todos os grupos SHALL ser igual ao total do card.

#### Scenario: Compras em BRL e em dólar
- **WHEN** um cartão tem uma compra de R$ 30,00, outra de R$ 150,00 e uma de US$ 58,00 com `amountInAccountCurrency` de 298,19
- **THEN** o subtotal do grupo é R$ 478,19

#### Scenario: Soma dos grupos
- **WHEN** o resumo traz compras de mais de um cartão
- **THEN** a soma dos subtotais dos grupos é igual ao total exibido no card

#### Scenario: Compra estrangeira sem valor em BRL
- **WHEN** uma compra em outra moeda não traz `amountInAccountCurrency`
- **THEN** a compra aparece no grupo, o subtotal não a inclui e o grupo avisa que há compra fora da soma

### Requirement: Nome do cartão sem bloquear o card
O sistema SHALL obter o nome de cada cartão da lista de contas e cartões da API, e SHALL exibir o card e o subtotal sem esperar essa lista. Enquanto o nome não chegar, ou quando a lista falhar ou não trouxer o cartão, o sistema SHALL usar o `accountId` como título do grupo. A falha da lista de nomes SHALL NOT mostrar erro nem esconder o card.

#### Scenario: Nome disponível
- **WHEN** a lista de contas e cartões traz o cartão `c1` com o nome "Cartão Nubank"
- **THEN** o título do grupo é "Cartão Nubank"

#### Scenario: Lista de nomes ainda carregando
- **WHEN** o resumo já chegou e a lista de contas e cartões ainda não
- **THEN** o card, o total e os grupos aparecem, com o `accountId` como título, e o título passa ao nome quando a lista chega

#### Scenario: Lista de nomes falhou
- **WHEN** a consulta da lista de contas e cartões falha
- **THEN** os grupos continuam com o `accountId` como título, e a tela não mostra erro por isso

#### Scenario: Cartão fora da lista
- **WHEN** a lista de contas e cartões não traz o cartão de uma compra
- **THEN** o grupo dessa compra usa o `accountId` como título

### Requirement: Ordem dos grupos e das compras
O sistema SHALL ordenar os grupos pelo maior subtotal primeiro, e SHALL ordenar as compras de cada grupo por data, da mais recente para a mais antiga. Em empate de subtotal, o sistema SHALL manter a ordem em que os cartões chegaram no resumo.

#### Scenario: Cartão com maior subtotal primeiro
- **WHEN** o cartão A soma R$ 100,00 e o cartão B soma R$ 400,00
- **THEN** o grupo do cartão B aparece antes do grupo do cartão A

#### Scenario: Compras por data
- **WHEN** um grupo tem compras de 05/11, 06/11 e 06/09
- **THEN** a de 06/11 aparece primeiro, depois a de 05/11 e por último a de 06/09

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

### Requirement: Grupos Entradas e Despesas
O sistema SHALL organizar os cards da visão geral em dois grupos com título visível. O grupo "Entradas" SHALL conter "Saldo disponível" e "Entradas no período". O grupo "Despesas" SHALL conter "Saídas no período", "Faturas a pagar" e "Compras do cartão sem fatura". O título de cada card SHALL ficar abaixo do título do grupo na hierarquia da página.

#### Scenario: Resumo carregado
- **WHEN** o resumo é carregado com sucesso
- **THEN** a tela mostra os títulos "Entradas" e "Despesas", cada um com os cards do seu grupo, e nenhum card aparece no grupo do outro

#### Scenario: Cards existentes preservados
- **WHEN** a tela é exibida com os grupos
- **THEN** "Saldo disponível", "Entradas no período", "Faturas a pagar" e "Compras do cartão sem fatura" mantêm o nome, o total e o detalhe de antes

### Requirement: Saídas do período agrupadas por conta
O sistema SHALL agrupar, no detalhe do card "Saídas no período", as saídas por conta bancária, identificada pelo dono e pelo `accountId`. Cada grupo SHALL mostrar o dono, o nome da conta e o subtotal. Os grupos SHALL ficar pelo maior subtotal, e as saídas de cada grupo da data mais recente para a mais antiga. O nome da conta SHALL seguir a mesma regra das entradas, com o `accountId` como reserva.

#### Scenario: Saídas de duas contas
- **WHEN** o resumo traz saídas de duas contas
- **THEN** o detalhe mostra um grupo para cada conta, pelo maior subtotal primeiro, e a soma dos subtotais é igual ao total do card

#### Scenario: Sem saídas
- **WHEN** o resumo não traz saídas no período
- **THEN** o card mostra o total zerado e o detalhe mostra "Nenhum item." e nenhum grupo

### Requirement: Saídas no padrão visual das transações
O sistema SHALL mostrar cada saída do período como uma saída no padrão visual da tela de transações: ícone de saída, descrição, data embaixo da descrição e valor na cor de saída, precedido de "−". A linha SHALL NOT repetir o dono nem o nome da conta.

#### Scenario: Saída em BRL
- **WHEN** uma conta tem a saída "Padaria Central" de R$ 42,50
- **THEN** a linha mostra o ícone de saída, a descrição, a data e o valor R$ 42,50 na cor de saída, precedido de "−"

### Requirement: Aviso sobre o conteúdo das saídas
O sistema SHALL exibir no card "Saídas no período" uma nota informando que pagamentos de fatura e transferências entre contas próprias estão incluídos.

#### Scenario: Nota visível
- **WHEN** o card "Saídas no período" é exibido
- **THEN** a nota sobre pagamentos de fatura e transferências entre contas próprias aparece junto ao total
