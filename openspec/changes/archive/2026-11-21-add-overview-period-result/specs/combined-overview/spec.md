# Spec Delta

## ADDED Requirements

### Requirement: Resultado do período
O sistema SHALL exibir o card "Resultado do período" com o total de "Entradas no período" menos o total de "Saídas no período", em BRL. O card SHALL ficar no topo da visão geral, antes e fora dos grupos "Entradas" e "Despesas". O valor SHALL aparecer na cor de entrada quando positivo, na cor de saída precedido de "−" quando negativo, e em cor neutra quando zero.

#### Scenario: Mais entradas que saídas
- **WHEN** as entradas do período somam R$ 10.000,00 e as saídas R$ 8.500,00
- **THEN** o card mostra R$ 1.500,00 na cor de entrada

#### Scenario: Mais saídas que entradas
- **WHEN** as entradas do período somam R$ 2.000,00 e as saídas R$ 2.300,00
- **THEN** o card mostra R$ 300,00 na cor de saída, precedido de "−"

#### Scenario: Sem movimento
- **WHEN** o resumo não traz entradas nem saídas no período
- **THEN** o card mostra R$ 0,00 em cor neutra e o detalhe mostra "Nenhum item."

#### Scenario: Fora dos grupos
- **WHEN** a visão geral é exibida
- **THEN** o card "Resultado do período" aparece antes do grupo "Entradas" e não pertence a nenhum dos dois grupos

#### Scenario: Período escolhido
- **WHEN** o usuário altera as datas "De" ou "Até"
- **THEN** o resultado é recalculado com as entradas e saídas do novo período

### Requirement: Resultado do período por conta
O detalhe do card "Resultado do período" SHALL listar cada conta bancária com entrada ou saída no período, identificada pelo dono e pelo `accountId`. Cada linha SHALL mostrar o dono, o nome da conta, o total que entrou, o total que saiu e o resultado da conta, com as mesmas cores do total do card. A soma dos resultados das contas SHALL ser igual ao total do card. As contas SHALL ficar pelo resultado, do maior para o menor.

#### Scenario: Transferência entre contas dos donos
- **WHEN** a conta Nubank de "marcelo" envia R$ 1.000,00 para a conta Inter de "luana" e não há outro movimento
- **THEN** o detalhe mostra a Inter com resultado de R$ 1.000,00 e a Nubank com resultado de − R$ 1.000,00, e o total do card é R$ 0,00

#### Scenario: Conta com movimento de um lado só
- **WHEN** uma conta tem saídas no período e nenhuma entrada
- **THEN** a linha mostra R$ 0,00 em "entrou", o total das saídas em "saiu" e o resultado negativo

#### Scenario: Ordem das contas
- **WHEN** as contas têm resultados de R$ 700,00, − R$ 200,00 e R$ 800,00
- **THEN** o detalhe mostra as contas na ordem R$ 800,00, R$ 700,00 e − R$ 200,00

#### Scenario: Nome da conta
- **WHEN** a lista de contas traz a conta `a1` com o nome "Nubank"
- **THEN** a linha da conta mostra "Nubank", e usa o `accountId` enquanto o nome não chega ou quando ele não está disponível

## MODIFIED Requirements

### Requirement: Aviso sobre o conteúdo das saídas
O sistema SHALL exibir no card "Saídas no período" uma nota informando que pagamentos de fatura e transferências entre contas próprias estão incluídos, e que as transferências entre contas próprias se anulam no resultado do período.

#### Scenario: Nota visível
- **WHEN** o card "Saídas no período" é exibido
- **THEN** a nota sobre pagamentos de fatura e transferências entre contas próprias aparece junto ao total, e diz que as transferências se anulam no resultado do período
