## ADDED Requirements

### Requirement: Compras sem fatura agrupadas por cartão
O sistema SHALL agrupar, no detalhe do card "Compras do cartão sem fatura", as compras por cartão, identificado pelo dono e pelo `accountId`. Cada grupo SHALL mostrar o dono, o nome do cartão e o subtotal. As compras de um grupo SHALL manter a mesma informação de hoje: descrição, parcela, data e valor, com a moeda original e o valor em BRL nas compras estrangeiras. O agrupamento SHALL NOT alterar o total do card nem os outros três cards.

#### Scenario: Compras de um cartão
- **WHEN** o resumo traz três compras do dono "marcelo" no cartão `c1`
- **THEN** o detalhe mostra um grupo com o dono, o nome do cartão `c1` e as três compras dentro dele

#### Scenario: Dois cartões
- **WHEN** o resumo traz compras de dois cartões, do mesmo dono ou de donos diferentes
- **THEN** o detalhe mostra um grupo para cada cartão, e as compras de um cartão não aparecem no grupo do outro

#### Scenario: Mesmo accountId em donos diferentes
- **WHEN** dois donos têm compras com o mesmo `accountId`
- **THEN** o sistema mostra um grupo para cada dono

#### Scenario: Sem compras
- **WHEN** o resumo não traz compras sem fatura
- **THEN** o detalhe mostra "Nenhum item.", como antes, e nenhum grupo

### Requirement: Subtotal por cartão
O sistema SHALL mostrar em cada grupo o subtotal em BRL das compras dele. A compra em BRL SHALL somar o `amount`, e a compra em outra moeda SHALL somar o `amountInAccountCurrency`. A compra em outra moeda sem `amountInAccountCurrency` SHALL aparecer na lista do grupo e SHALL NOT entrar no subtotal, e o grupo SHALL avisar que há compra fora da soma. A soma dos subtotais de todos os grupos SHALL ser igual ao total do card.

#### Scenario: Compras em BRL e em dólar
- **WHEN** um cartão tem uma compra de R$ 30,00, outra de R$ 150,00 e uma de US$ 58,00 com `amountInAccountCurrency` de 298,19
- **THEN** o subtotal do grupo é R$ 478,19

#### Scenario: Soma dos grupos
- **WHEN** o resumo traz compras de mais de um cartão
- **THEN** a soma dos subtotais dos grupos é igual ao total exibido no card

#### Scenario: Compra estrangeira sem valor em BRL
- **WHEN** uma compra em outra moeda não traz `amountInAccountCurrency`
- **THEN** a compra aparece no grupo, o subtotal não a inclui e o grupo avisa que há compra fora da soma

### Requirement: Nome do cartão sem bloquear o card
O sistema SHALL obter o nome de cada cartão da lista de contas e cartões da API, e SHALL exibir o card e o subtotal sem esperar essa lista. Enquanto o nome não chegar, ou quando a lista falhar ou não trouxer o cartão, o sistema SHALL usar o `accountId` como título do grupo. A falha da lista de nomes SHALL NOT mostrar erro nem esconder o card.

#### Scenario: Nome disponível
- **WHEN** a lista de contas e cartões traz o cartão `c1` com o nome "Cartão Nubank"
- **THEN** o título do grupo é "Cartão Nubank"

#### Scenario: Lista de nomes ainda carregando
- **WHEN** o resumo já chegou e a lista de contas e cartões ainda não
- **THEN** o card, o total e os grupos aparecem, com o `accountId` como título, e o título passa ao nome quando a lista chega

#### Scenario: Lista de nomes falhou
- **WHEN** a consulta da lista de contas e cartões falha
- **THEN** os grupos continuam com o `accountId` como título, e a tela não mostra erro por isso

#### Scenario: Cartão fora da lista
- **WHEN** a lista de contas e cartões não traz o cartão de uma compra
- **THEN** o grupo dessa compra usa o `accountId` como título

### Requirement: Ordem dos grupos e das compras
O sistema SHALL ordenar os grupos pelo maior subtotal primeiro, e SHALL ordenar as compras de cada grupo por data, da mais recente para a mais antiga. Em empate de subtotal, o sistema SHALL manter a ordem em que os cartões chegaram no resumo.

#### Scenario: Cartão com maior subtotal primeiro
- **WHEN** o cartão A soma R$ 100,00 e o cartão B soma R$ 400,00
- **THEN** o grupo do cartão B aparece antes do grupo do cartão A

#### Scenario: Compras por data
- **WHEN** um grupo tem compras de 05/11, 06/11 e 06/09
- **THEN** a de 06/11 aparece primeiro, depois a de 05/11 e por último a de 06/09
