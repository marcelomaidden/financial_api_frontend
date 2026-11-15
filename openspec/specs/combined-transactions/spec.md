# combined-transactions Specification

## Purpose

Mostrar as transações de todas as contas de todos os donos em uma lista única, ordenada por data, para um período.

## Requirements

### Requirement: Lista única de transações
O sistema SHALL reunir as transações de todas as contas de todos os donos em uma única lista, ordenada da mais recente para a mais antiga.

#### Scenario: Várias contas e donos
- **WHEN** o usuário abre a tela de transações com um período
- **THEN** o sistema busca as transações de cada conta e mostra tudo em uma lista, cada linha com dono e nome da conta

### Requirement: Período das transações
O sistema SHALL buscar as transações do período escolhido, e o período inicial SHALL ser o mês corrente.

#### Scenario: Mudar o período
- **WHEN** o usuário altera as datas
- **THEN** o sistema refaz a busca com `dateFrom` e `dateTo` e substitui a lista

### Requirement: Paginação por cursor
O sistema SHALL buscar todas as páginas de cada conta no período, usando `nextCursor` como `after`, antes de considerar a lista completa.

#### Scenario: Conta com várias páginas
- **WHEN** a resposta de uma conta traz `nextCursor`
- **THEN** o sistema busca a página seguinte com `after` igual a esse cursor, até não haver mais cursor

### Requirement: Falha em uma conta
O sistema SHALL mostrar as transações das contas que responderam e avisar quais contas falharam.

#### Scenario: Uma conta falha
- **WHEN** a consulta de uma conta retorna erro e as demais têm sucesso
- **THEN** o sistema exibe as transações das demais e um aviso com dono e conta que falharam
