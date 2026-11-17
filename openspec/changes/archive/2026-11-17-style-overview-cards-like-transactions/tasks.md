# Tasks

## 1. Agrupamento genérico por conta

- [x] 1.1 Criar `groupByAccount` em `src/lib` (decisão 1) e fazer o `groupPurchases` usá-lo com a regra das compras, mantendo ordem, subtotal em centavos e `excludedCount`. Ajustar o card de compras ao campo `items`. Verificar com `npx tsc -b` sem erros e com os testes atuais do agrupamento e do card de compras passando.
- [x] 1.2 Cobrir a função genérica em testes unitários com a regra das entradas: soma do `amount` em centavos (0,57 + 1,15 = 1,72), soma dos grupos igual ao total, grupos pelo maior subtotal com desempate pela ordem de chegada, itens por data decrescente, data inválida no fim, mesmo `accountId` em donos diferentes e `detail` vazio. Verificar com `npm test` passando.

## 2. Componentes de linha e de grupo

- [x] 2.1 Acrescentar `leading` e `neutral` ao `TransactionRow` (decisão 4), sem mudar a linha quando não são usados. Cobrir em `components.test.tsx`: `leading` no lugar do ícone, valor neutro sem cor de entrada nem de saída e sem "−", e a linha atual intacta. Verificar com `npm test` passando, sem alterar `TransactionsPage.test.tsx`.
- [x] 2.2 Extrair o cabeçalho de grupo do `PurchasesByCard` para um componente compartilhado (decisão 3). Verificar com os testes atuais do card de compras passando, sem alterá-los.

## 3. Entradas no período

- [x] 3.1 Mostrar as entradas agrupadas por conta bancária no card "Entradas no período": cabeçalho com dono, nome e subtotal, e linhas de entrada (↓ verde, descrição, data em `detail`, valor sem "−"), com o nome pela consulta de nomes e o `accountId` de fallback (decisão 5). Verificar com `npx tsc -b` sem erros.
- [x] 3.2 Acrescentar `a1` à consulta `/accounts` dos testes da visão geral e cobrir: um grupo com nome, dono e subtotal, duas contas pelo maior subtotal, soma dos subtotais igual ao total do card, título com o `accountId` enquanto os nomes carregam, quando falham e quando a conta não está na lista, linha de entrada com ícone, data e valor sem "−", dono e conta só no cabeçalho, e "Nenhum item." sem entradas. Verificar com `npm test` passando.

## 4. Faturas a pagar

- [x] 4.1 Criar a ordenação das faturas por vencimento em `src/lib` (decisão 2) e mostrar o card "Faturas a pagar" como linhas de saída, sem grupo: nome do cartão, `vence em` e o vencimento em `detail`, avatar em `aside` e valor com "−". Verificar com `npx tsc -b` sem erros.
- [x] 4.2 Cobrir a ordenação em testes unitários (vencimento crescente, data inválida no fim, empate pela ordem de chegada) e, na tela, a linha da fatura, a ordem e "Nenhum item.". Reescrever o teste atual das faturas, que procura o texto corrido e o avatar. Verificar com `npm test` passando.

## 5. Saldo disponível

- [x] 5.1 Criar a ordenação do saldo pelo maior valor em `src/lib` (decisão 2) e mostrar o card "Saldo disponível" como linhas sem grupo, com `leading` (avatar do dono), nome da conta e saldo `neutral`. Verificar com `npx tsc -b` sem erros.
- [x] 5.2 Cobrir a ordenação em testes unitários e, na tela, a linha da conta com avatar e saldo em cor neutra, o saldo negativo com sinal na mesma cor e a ordem pelo maior saldo. Verificar com `npm test` passando.

## 6. Limpeza e verificação final

- [x] 6.1 Remover `renderItem` e a lista em texto corrido do `SummaryCard` (decisão 6) e reescrever o teste `não agrupa os outros cards` para afirmar que só Entradas e Compras têm grupos, e que os totais dos quatro cards não mudaram. Verificar com `npx tsc -b` sem erros e `npm test` passando.
- [x] 6.2 Rodar `npm run lint`, `npm test` e `npm run build` e verificar que os três passam.
- [ ] 6.3 Com `npm run dev` e a `financial_api` rodando, abrir a visão geral e conferir os quatro cards no modo claro e no escuro e em largura estreita: o visual de linha é o mesmo, o saldo fica em cor neutra, as faturas seguem a ordem de vencimento e os totais batem.

## Workflow follow-up

- Arquivar a change na mesma branch do PR, antes do merge.
