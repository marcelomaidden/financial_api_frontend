# Tasks

## 1. Cálculo do resultado

- [x] 1.1 Criar em `src/lib/` a função que recebe `incomes.transactions` e `expenses.accountDebits` e devolve o total e uma linha por conta (`owner`, `accountId`, entrou, saiu, resultado), em centavos e ordenada pelo resultado. Verificar com testes unitários: transferência entre contas que se anula, conta só com saídas, conta só com entradas, ordem pelo resultado com empate pela ordem de chegada, soma das linhas igual ao total e seções vazias.

## 2. Card Resultado do período

- [x] 2.1 Criar o card "Resultado do período", com título `h2`, total colorido pelo sinal e "Ver detalhe (n)", e colocá-lo no topo da página, antes do grupo "Entradas". Verificar em `OverviewPage.test.tsx` que o card aparece antes dos grupos e fora deles, que o total do `summaryFixture` está certo e que positivo, negativo e zero usam a cor de entrada, a de saída com "−" e a neutra.
- [x] 2.2 Desenhar o detalhe por conta com o avatar do dono, o nome da conta (via `nameOf`), quanto entrou, quanto saiu e o resultado. Verificar em teste: transferência entre duas contas que se anula, conta só com saídas mostrando R$ 0,00 em "entrou", ordem das contas e "Nenhum item." sem movimento.
- [x] 2.3 Verificar em teste que o resultado é recalculado ao mudar "De" e "Até".

## 3. Nota das saídas

- [x] 3.1 Atualizar a nota de "Saídas no período" para dizer que as transferências entre contas próprias se anulam no resultado do período. Verificar que o teste da nota cobre o texto novo.

## 4. Verificação

- [x] 4.1 Rodar `npm test`, `npm run build` e `npx oxlint`, e confirmar que passam e que os testes existentes dos grupos e dos cards continuam verdes.
- [ ] 4.2 Conferir a visão geral no navegador com o resumo real, nos temas claro e escuro. Verificar que o resultado bate com "entradas − saídas" e que o detalhe por conta aparece corretamente.
