# combined-accounts Specification

## Purpose

Listar contas bancárias e cartões de crédito de todos os donos em uma só tela, com saldo e faturas.

## Requirements

### Requirement: Contas e cartões de todos os donos
O sistema SHALL listar as contas e os cartões de todos os donos juntos, com o dono identificado em cada item.

#### Scenario: Listagem combinada
- **WHEN** o usuário abre a tela de contas
- **THEN** o sistema consulta contas e cartões sem `owner` e mostra os itens de todos os donos, cada um com a etiqueta do dono

### Requirement: Falha parcial por dono
O sistema SHALL mostrar o erro de um dono quando a entrada dele trouxer `error`, sem ocultar os itens dos demais.

#### Scenario: Um dono com erro
- **WHEN** a entrada de "luana" traz `error` e a de "marcelo" traz contas
- **THEN** o sistema exibe as contas de "marcelo" e a mensagem de erro de "luana"

### Requirement: Faturas de um cartão
O sistema SHALL mostrar as faturas de um cartão quando o usuário o selecionar, usando o dono e o `id` da conta daquele cartão.

#### Scenario: Abrir faturas
- **WHEN** o usuário seleciona um cartão
- **THEN** o sistema consulta as faturas desse dono e conta e lista vencimento e valor de cada uma

#### Scenario: Mais faturas que o tamanho da página
- **WHEN** a API indica que há mais páginas de faturas
- **THEN** o sistema permite carregar a página seguinte
