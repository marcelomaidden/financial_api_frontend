## ADDED Requirements

### Requirement: Link para as transações de cada conta bancária
O sistema SHALL mostrar, em cada conta bancária da tela de contas, um link para as transações daquela conta. O nome acessível do link SHALL incluir o nome da conta. O link SHALL levar à tela de transações com o dono e o `id` da conta. Os cartões de crédito SHALL NOT ganhar esse link.

#### Scenario: Link em cada conta bancária
- **WHEN** a tela de contas lista as contas bancárias "Nubank" e "Itaú"
- **THEN** cada conta mostra um link, e os nomes acessíveis são "Ver transações de Nubank" e "Ver transações de Itaú"

#### Scenario: Destino do link
- **WHEN** o usuário aciona o link da conta `a1` do dono "marcelo"
- **THEN** o sistema abre a tela de transações filtrada pela conta `a1` do dono "marcelo", sem que o usuário escolha nada

#### Scenario: Cartão sem link de transações
- **WHEN** a tela de contas lista um cartão de crédito
- **THEN** o cartão mostra "Ver faturas" e não mostra o link de transações
