# Spec Delta

## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: Resumo combinado do período
O sistema SHALL exibir os totais de `incomes.available`, `incomes.transactions`, `expenses.accountDebits`, `expenses.owed` e `expenses.transactions` do resumo, em BRL, somando todos os donos.

#### Scenario: Período padrão
- **WHEN** o usuário abre a visão geral sem escolher período
- **THEN** o sistema consulta o resumo sem `dateFrom` e `dateTo`, e exibe os cinco totais do mês corrente

#### Scenario: Período escolhido
- **WHEN** o usuário informa uma data inicial e uma final
- **THEN** o sistema consulta o resumo com `dateFrom` e `dateTo` em `yyyy-mm-dd` e atualiza os totais, incluindo o de "Saídas no período"
