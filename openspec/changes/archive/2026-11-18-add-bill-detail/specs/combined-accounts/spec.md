## ADDED Requirements

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
- **WHEN** uma compra tem `currencyCode` diferente de BRL
- **THEN** o valor é formatado na moeda da compra

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
