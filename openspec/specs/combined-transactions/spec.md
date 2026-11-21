# combined-transactions Specification

## Purpose

Mostrar as transações de todas as contas de todos os donos em uma lista única, ordenada por data, para um período.

## Requirements

### Requirement: Lista única de transações
O sistema SHALL obter as transações de todas as contas de todos os donos em uma única chamada à API e mostrá-las em uma lista, da mais recente para a mais antiga. Quando o endereço da tela traz o filtro de uma conta, a lista SHALL conter só as transações dessa conta.

#### Scenario: Várias contas e donos
- **WHEN** o usuário abre a tela de transações com um período e sem filtro de conta no endereço
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

### Requirement: Filtro por uma conta no endereço
O sistema SHALL aceitar no endereço da tela de transações o dono (`owner`) e o `id` da conta (`accountId`). Com os dois preenchidos, o sistema SHALL consultar a API só para essa conta e SHALL mostrar um aviso com o nome e o dono da conta e um link para voltar à lista de todas as contas. Com só um dos dois, o sistema SHALL ignorar o filtro e mostrar todas as contas.

#### Scenario: Endereço com conta
- **WHEN** o usuário abre a tela de transações com `owner=marcelo` e `accountId=a1` no endereço
- **THEN** o sistema consulta as transações do período com `owner` "marcelo" e `accountId` `a1`, e mostra o aviso "Conta: Nubank" com o dono "marcelo"

#### Scenario: Mudar o período com a conta filtrada
- **WHEN** a tela está filtrada pela conta `a1` e o usuário altera as datas
- **THEN** o sistema refaz a busca com as datas novas e continua filtrando pela conta `a1`

#### Scenario: Ver todas as contas
- **WHEN** a tela está filtrada por uma conta e o usuário aciona o link de voltar à lista de todas as contas
- **THEN** o endereço perde o filtro e o sistema mostra as transações de todas as contas do mesmo período

#### Scenario: Endereço incompleto
- **WHEN** o endereço traz só `accountId` ou só `owner`
- **THEN** o sistema mostra as transações de todas as contas e não envia o filtro à API

#### Scenario: Nome da conta indisponível
- **WHEN** a listagem de contas falha ou não traz a conta filtrada
- **THEN** o aviso do filtro mostra o `id` da conta no lugar do nome

#### Scenario: Conta filtrada com erro
- **WHEN** a API responde com erro à consulta da conta filtrada, como 404 ou 502
- **THEN** o sistema mostra a mensagem da API com a opção de tentar de novo, e o aviso do filtro com o link para todas as contas continua visível
