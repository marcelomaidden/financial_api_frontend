# Tasks

## 1. Agrupamento e subtotal (função pura)

- [x] 1.1 Criar em `src/lib` a função de agrupamento das compras sem fatura (decisões 1 a 4): chave `owner:accountId`, subtotal em centavos pela regra da API, contagem de compras fora da soma, grupos pelo maior subtotal e compras por data decrescente. Verificar com `npx tsc -b` sem erros.
- [x] 1.2 Cobrir com testes unitários: compras em BRL e em dólar (R$ 30,00, R$ 150,00 e US$ 58,00 com 298,19 somam R$ 478,19), soma dos grupos igual ao `total` da `summaryFixture`, compra estrangeira sem `amountInAccountCurrency` fora da soma e contada, ordem dos grupos e desempate, ordem das compras por data, mesmo `accountId` em dois donos e `detail` vazio. Verificar com `npm test` passando.

## 2. Nomes dos cartões

- [x] 2.1 Exportar `fetchAccountNames` de `src/api/transactions.ts` sem mudar o comportamento (mapa `owner:id`, mapa vazio se a chamada falhar). Verificar que os testes da tela de transações continuam passando com `npm test`.

## 3. Detalhe agrupado na visão geral

- [x] 3.1 Em `OverviewPage.tsx`, dar ao `SummaryCard` um detalhe opcional e usá-lo só no card "Compras do cartão sem fatura": cabeçalho de cada grupo com avatar do dono, título e subtotal, aviso quando houver compra fora da soma, e a lista de compras com a linha de hoje. Consultar os nomes com um `useQuery` próprio e não bloqueante, com o `accountId` como título enquanto os nomes não chegam, quando falham ou quando o cartão não está na lista. Verificar abrindo o detalhe no teste de tela do item 3.2.
- [x] 3.2 Atualizar os testes da visão geral: registrar o handler de `/accounts` nos testes atuais e acrescentar casos de tela para o título com o nome, o título com o `accountId` enquanto carrega e quando a lista falha, dois cartões em grupos separados, o subtotal exibido, o aviso de compra fora da soma, e os outros três cards inalterados. Verificar com `npm test` passando.

## 4. Verificação final

- [x] 4.1 Rodar `npm run lint`, `npm test` e `npm run build` e verificar que os três passam.
- [ ] 4.2 Com `npm run dev` e a `financial_api` rodando, abrir a visão geral e conferir que o card "Compras do cartão sem fatura" mostra os grupos por cartão com nome, que a soma dos subtotais bate com o total do card e que os outros cards não mudaram.

## Workflow follow-up

- Arquivar a change depois da revisão do projeto.
