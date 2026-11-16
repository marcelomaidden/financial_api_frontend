## Purpose

Listar empréstimos e financiamentos de todos os donos em uma só tela, com saldo para quitar, parcelas e último pagamento.

## ADDED Requirements

### Requirement: Empréstimos de todos os donos
O sistema SHALL oferecer uma tela de empréstimos que lista os empréstimos e financiamentos de todos os donos juntos, com o dono identificado em cada item, e SHALL ter um link para ela na navegação principal.

#### Scenario: Listagem combinada
- **WHEN** o usuário abre a tela de empréstimos
- **THEN** o sistema consulta os empréstimos sem `owner` e mostra os itens de todos os donos, cada um com a etiqueta do dono

#### Scenario: Nenhum empréstimo
- **WHEN** a consulta responde sem nenhum empréstimo
- **THEN** o sistema mostra a mensagem "Nenhum empréstimo."

### Requirement: Dados de cada empréstimo
O sistema SHALL mostrar, para cada empréstimo, o nome do produto e o tipo (`kind`) em português, e SHALL mostrar apenas os dados que a API informar: saldo para quitar, valor contratado, parcelas pagas e restantes, parcelas em atraso, fim do contrato e último pagamento regular. O sistema SHALL omitir um dado que a API devolver `null`, sem mostrar valor inventado.

#### Scenario: Empréstimo completo
- **WHEN** o empréstimo traz saldo, parcelas, fim do contrato e último pagamento
- **THEN** o sistema mostra o saldo para quitar, as parcelas pagas e restantes, a data de fim do contrato e a data e o valor do último pagamento

#### Scenario: Empréstimo só com campos obrigatórios
- **WHEN** o empréstimo traz apenas `id`, `itemId`, `productName`, `kind` e `currencyCode`
- **THEN** o sistema mostra o nome do produto e o tipo, e não mostra nenhum dos demais dados

#### Scenario: Parcelas em atraso
- **WHEN** o empréstimo informa mais de zero parcelas em atraso
- **THEN** o sistema destaca a quantidade de parcelas em atraso

#### Scenario: Tipo desconhecido
- **WHEN** o `kind` do empréstimo é `UNKNOWN`
- **THEN** o sistema mostra o empréstimo com o tipo "Outro"

### Requirement: Datas de empréstimo sem deslocamento de fuso
O sistema SHALL exibir uma data sem hora (`yyyy-mm-dd`) no mesmo dia do calendário que a API informou, em qualquer fuso do navegador.

#### Scenario: Data a oeste de UTC
- **WHEN** o fim do contrato é `2028-01-15` e o navegador está em `America/Sao_Paulo`
- **THEN** o sistema mostra 15/01/2028

### Requirement: Falha parcial por dono
O sistema SHALL mostrar o erro de um dono quando a entrada dele trouxer `error`, sem ocultar os empréstimos dos demais.

#### Scenario: Um dono com erro
- **WHEN** a entrada de "luana" traz `error` e a de "marcelo" traz empréstimos
- **THEN** o sistema exibe os empréstimos de "marcelo" e a mensagem de erro de "luana"

### Requirement: Falha total da consulta
O sistema SHALL mostrar a mensagem de erro da API, com a opção de tentar de novo, quando a consulta de empréstimos falhar por completo.

#### Scenario: API responde 502
- **WHEN** a API responde 502 porque todos os donos falharam
- **THEN** o sistema mostra a mensagem de erro e um botão para tentar de novo
