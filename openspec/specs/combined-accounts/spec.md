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

### Requirement: Link para o detalhe de cada fatura
O sistema SHALL mostrar, em cada fatura listada no painel de faturas de um cartão, um link para o detalhe daquela fatura. O nome acessível do link SHALL incluir o vencimento da fatura. O link SHALL levar o `id` da fatura, o dono e o `id` da conta do cartão que o painel já usa.

#### Scenario: Link em cada fatura
- **WHEN** o usuário abre as faturas de um cartão e a lista traz duas faturas
- **THEN** cada fatura mostra um link, e o nome acessível de cada um cita o vencimento da respectiva fatura (por exemplo, "Ver detalhe da fatura com vencimento 20/11/2026")

#### Scenario: Destino do link
- **WHEN** o usuário aciona o link da fatura `b1` do cartão `c1` do dono "marcelo"
- **THEN** o sistema abre a página de detalhe com o id `b1`, o dono "marcelo" e a conta `c1`, sem que o usuário digite nada

#### Scenario: Fatura sem vencimento
- **WHEN** uma fatura da lista não traz `dueDate`
- **THEN** o link continua presente e seu nome acessível diz que a fatura não tem vencimento, em vez de mostrar uma data vazia

### Requirement: Detalhe da fatura
O sistema SHALL, ao abrir a página de detalhe, consultar o detalhe da fatura enviando o `id` da fatura, o dono e o `id` da conta do cartão, e SHALL mostrar o resumo da fatura com vencimento, fechamento, total, pagamento mínimo, encargos e pagamentos. Campos sem valor SHALL aparecer como "-", sem quebrar a tela. Se a fatura informar se aceita parcelamento, o resumo SHALL mostrar essa informação.

#### Scenario: Consulta do detalhe
- **WHEN** o usuário abre o detalhe da fatura `b1` do cartão `c1` do dono "marcelo"
- **THEN** o sistema consulta o detalhe com o id `b1`, o dono "marcelo" e a conta `c1`, com o `id` codificado na URL

#### Scenario: Resumo da fatura
- **WHEN** o detalhe traz vencimento 2026-11-20, fechamento 2026-11-13, total R$ 250,40 e pagamento mínimo R$ 40,00
- **THEN** o resumo mostra o vencimento 20/11/2026, o fechamento 13/11/2026, o total R$ 250,40 e o mínimo R$ 40,00

#### Scenario: Fechamento e mínimo ausentes
- **WHEN** o detalhe traz `closingDate` e `minimumPaymentAmount` nulos
- **THEN** o resumo mostra "-" nesses dois campos e os demais normalmente

#### Scenario: Encargos
- **WHEN** o detalhe traz encargos financeiros
- **THEN** o resumo lista cada encargo com o tipo e o valor, e mostra a informação adicional quando houver

#### Scenario: Pagamentos
- **WHEN** o detalhe traz pagamentos
- **THEN** o resumo lista cada pagamento com o valor, o tipo de valor e a data quando houver

### Requirement: Compras da fatura
O sistema SHALL listar as compras da fatura na ordem recebida da API (da mais recente para a mais antiga), cada uma com descrição, data e valor, e com a parcela (número e total) quando houver.

#### Scenario: Compra parcelada
- **WHEN** uma compra traz `installment` com número 3 e total 10
- **THEN** a linha da compra mostra a parcela "3/10" junto da descrição

#### Scenario: Estorno
- **WHEN** uma transação da fatura tem o tipo de crédito
- **THEN** a linha aparece como entrada, e as demais aparecem como saída

#### Scenario: Valores em outra moeda
- **WHEN** uma compra tem `currencyCode` USD, valor 58,00 e `amountInAccountCurrency` 298,19, numa fatura em BRL
- **THEN** a linha mostra R$ 298,19, na moeda da fatura, como valor principal e US$ 58,00 em destaque menor abaixo dele

#### Scenario: Outra moeda sem valor convertido
- **WHEN** uma compra tem `currencyCode` diferente da moeda da fatura e não traz `amountInAccountCurrency`
- **THEN** a linha mostra só o valor na moeda da compra

### Requirement: Estados da página de detalhe
O sistema SHALL mostrar um indicador de carregamento enquanto consulta o detalhe, e SHALL mostrar a mensagem da API com a opção de tentar de novo quando a consulta falhar. O sistema SHALL NOT mostrar resumo ou compras parciais quando a consulta falhar. A página SHALL mostrar mensagens de lista vazia para compras, encargos e pagamentos sem itens. A página SHALL ter um link de volta para Contas em qualquer um desses estados.

#### Scenario: Carregando
- **WHEN** o detalhe ainda não respondeu
- **THEN** a página mostra o indicador de carregamento e o link de volta para Contas

#### Scenario: Fatura inexistente
- **WHEN** a API responde 404 com `{status, error, message}`
- **THEN** a página mostra a `message` recebida e a opção de tentar de novo, sem resumo nem compras

#### Scenario: Falha da Pluggy
- **WHEN** a API responde com erro no formato `ApiErrorBody`, como 502
- **THEN** a página mostra a `message` recebida, como nos outros erros da SPA, e nenhum dado parcial

#### Scenario: Sem compras
- **WHEN** o detalhe traz `transactions` vazio
- **THEN** a página mostra o resumo da fatura e a mensagem "Nenhuma compra nesta fatura."

#### Scenario: Sem encargos nem pagamentos
- **WHEN** o detalhe traz `financeCharges` e `payments` vazios
- **THEN** a página mostra "Nenhum encargo." e "Nenhum pagamento." nas respectivas seções

#### Scenario: Endereço sem dono ou conta
- **WHEN** o usuário abre `/bills/b1` sem `owner` ou sem `accountId`
- **THEN** a página mostra uma mensagem de que faltam dados da fatura e não chama a API

#### Scenario: Voltar para Contas
- **WHEN** o usuário aciona o link de volta
- **THEN** o sistema abre a aba Contas

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
