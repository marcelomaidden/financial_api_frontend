# combined-transactions Specification

## Purpose

Mostrar as transações de todas as contas de todos os donos em uma lista única, ordenada por data, para um período.

## Requirements

### Requirement: Lista única de transações
O sistema SHALL obter as transações de todas as contas de todos os donos em uma única chamada à API e mostrá-las em uma lista, da mais recente para a mais antiga.

#### Scenario: Várias contas e donos
- **WHEN** o usuário abre a tela de transações com um período
- **THEN** o sistema faz uma chamada de transações para o período e mostra tudo em uma lista, cada linha com dono e nome da conta

### Requirement: Período das transações
O sistema SHALL buscar as transações do período escolhido, e o período inicial SHALL ser o mês corrente.

#### Scenario: Mudar o período
- **WHEN** o usuário altera as datas
- **THEN** o sistema refaz a busca com `dateFrom` e `dateTo` e substitui a lista

### Requirement: Falha em uma conta
O sistema SHALL mostrar as transações recebidas e avisar as falhas informadas pela API, identificando o dono e a conta quando houver conta.

#### Scenario: Uma conta falha
- **WHEN** a resposta traz uma falha de conta em `errors` e transações das demais
- **THEN** o sistema exibe as transações recebidas e um aviso com dono e conta que falharam

#### Scenario: Contas de um dono não listadas
- **WHEN** a resposta traz uma falha de `errors` sem conta
- **THEN** o sistema exibe as transações recebidas e um aviso de que as contas desse dono não foram carregadas

### Requirement: Nome da conta em cada linha
O sistema SHALL mostrar em cada linha o nome da conta ou do cartão obtido da listagem de contas, e o identificador da conta quando o nome não estiver disponível.

#### Scenario: Conta bancária ou cartão
- **WHEN** a lista traz transações de uma conta bancária e de um cartão
- **THEN** cada linha mostra o nome da respectiva conta ou cartão, vindo da listagem de contas

#### Scenario: Listagem de contas indisponível
- **WHEN** a listagem de contas falha e a de transações tem sucesso
- **THEN** o sistema mostra as transações com o identificador da conta no lugar do nome

### Requirement: Agrupamento por data
O sistema SHALL agrupar as transações por dia, com um cabeçalho com a data e, abaixo dele, as transações desse dia.

#### Scenario: Transações em dias diferentes
- **WHEN** a lista tem transações de mais de um dia
- **THEN** cada dia aparece uma vez, como cabeçalho, seguido só das transações dele

### Requirement: Entrada e saída distintas
O sistema SHALL distinguir entrada e saída em cada transação por ícone e por cor do valor. Transações do tipo `CREDIT` SHALL ser entradas, e as demais SHALL ser saídas.

#### Scenario: Entrada
- **WHEN** uma transação tem tipo `CREDIT`
- **THEN** a linha mostra o ícone de entrada e o valor na cor de entrada

#### Scenario: Saída
- **WHEN** uma transação tem tipo diferente de `CREDIT`
- **THEN** a linha mostra o ícone de saída e o valor na cor de saída, precedido de "−"
