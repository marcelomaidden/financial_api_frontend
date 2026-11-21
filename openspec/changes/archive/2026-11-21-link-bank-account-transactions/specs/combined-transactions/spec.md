## MODIFIED Requirements

### Requirement: Lista única de transações
O sistema SHALL obter as transações de todas as contas de todos os donos em uma única chamada à API e mostrá-las em uma lista, da mais recente para a mais antiga. Quando o endereço da tela traz o filtro de uma conta, a lista SHALL conter só as transações dessa conta.

#### Scenario: Várias contas e donos
- **WHEN** o usuário abre a tela de transações com um período e sem filtro de conta no endereço
- **THEN** o sistema faz uma chamada de transações para o período e mostra tudo em uma lista, cada linha com dono e nome da conta

## ADDED Requirements

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
