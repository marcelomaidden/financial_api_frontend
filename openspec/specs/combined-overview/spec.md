# combined-overview Specification

## Purpose

Mostrar, em uma tela, a situação financeira de todos os donos somada no período escolhido, com base no resumo da API.

## Requirements

### Requirement: Resumo combinado do período
O sistema SHALL exibir os totais de `incomes.available`, `incomes.transactions`, `expenses.owed` e `expenses.transactions` do resumo, em BRL, somando todos os donos.

#### Scenario: Período padrão
- **WHEN** o usuário abre a visão geral sem escolher período
- **THEN** o sistema consulta o resumo sem `dateFrom` e `dateTo`, e exibe os quatro totais do mês corrente

#### Scenario: Período escolhido
- **WHEN** o usuário informa uma data inicial e uma final
- **THEN** o sistema consulta o resumo com `dateFrom` e `dateTo` em `yyyy-mm-dd` e atualiza os totais

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
