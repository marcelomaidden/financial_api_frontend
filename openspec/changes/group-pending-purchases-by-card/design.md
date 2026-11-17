# Design

## Context

Estado atual, observado no código:
- `OverviewPage.tsx` renderiza os quatro cards com um `SummaryCard` genérico. O detalhe é uma lista única: `flatten(section)` junta o `detail` de todos os donos e cada linha mostra o avatar do dono e o `renderItem`. A linha das compras é o `ExpenseTransactionItem`.
- `ExpenseTransaction` traz `accountId` e não traz o nome do cartão. As faturas (`OwedBill`) trazem o nome, mas só dos cartões com fatura no período.
- `src/api/transactions.ts` tem `fetchAccountNames`, privada: chama `/accounts` (que traz contas e cartões), monta um mapa `owner:id` para nome e, se a chamada falhar, devolve o mapa vazio, sem erro (só repropaga o cancelamento).
- Os testes usam MSW e `renderWithProviders`, e hoje só mockam `/summary` na visão geral.

Motivação e escopo: veja proposal.md. Requisitos: veja specs/combined-overview/spec.md.

## Goals / Non-Goals

**Goals:**
- Agrupar e somar sem mudar o total do card e sem depender da API.
- O card nunca espera nem falha por causa dos nomes.

**Non-Goals:**
- Tabela geral por conta, filtro por conta ou mudança nos outros cards.
- Distinguir dois cartões do mesmo dono com o mesmo nome.

## Decisions

**1. A lógica de agrupamento fica numa função pura, fora do componente.**
Uma função em `src/lib` (por exemplo, `groupPurchases`) recebe o `detail` do resumo e devolve os grupos já ordenados: `{ owner, accountId, subtotal, purchases, excludedCount }`. O componente só desenha. Assim a soma, a ordem e os casos de borda são testados sem renderizar tela. Alternativa descartada: agrupar dentro do JSX, que mistura regra e apresentação e dificulta testar a conferência da soma.

**2. Soma em centavos, com a regra da API.**
Cada compra vira `Math.round(valor * 100)` antes de somar, e o subtotal volta a reais só na exibição, o que evita erro de ponto flutuante. Compra em BRL soma o `amount`. Compra em outra moeda soma o `amountInAccountCurrency`. Compra em outra moeda sem esse campo entra na lista e não entra na soma, e `excludedCount` conta quantas ficaram de fora para o aviso do grupo. Essa regra é a mesma do `expenses.transactions.total` da API, e os testes conferem que a soma dos grupos nas fixtures é igual ao total.

**3. Chave do grupo: `owner:accountId`.**
É o padrão do `transactions.ts`. Dois donos com o mesmo `accountId` geram dois grupos. A ordem de chegada dos grupos no resumo é a base do desempate.

**4. Ordem.**
Grupos pelo maior subtotal, com ordenação estável para desempatar pela ordem de chegada. Compras de cada grupo por data decrescente, comparando por `Date.parse`. Uma data inválida vai para o fim do grupo, mantendo a ordem relativa das compras sem data válida (a ordenação é estável). Isso evita um comparador inconsistente que embaralharia as outras.

**5. Nomes por uma consulta separada e não bloqueante.**
`fetchAccountNames` passa a ser exportada de `transactions.ts` e a visão geral a chama com um `useQuery` próprio (por exemplo, chave `['account-names']`). O card renderiza assim que o resumo chega, com o `accountId` como título, e o nome entra quando a consulta termina. Como `fetchAccountNames` já devolve um mapa vazio quando a chamada falha, a consulta nunca entra em estado de erro, e a tela não mostra aviso por causa dela. Alternativa descartada: buscar `/accounts` dentro do `queryFn` do resumo, o que atrasaria o card e faria a falha dos nomes derrubar o resumo inteiro.

**6. O `SummaryCard` ganha um detalhe opcional.**
Em vez de duplicar o card, o `SummaryCard` recebe uma propriedade opcional para desenhar o detalhe por conta própria. Sem ela, os três outros cards continuam com a lista de hoje. O contador "Ver detalhe (N)" continua contando compras, e a mensagem "Nenhum item." continua valendo quando não há nenhuma. Cada grupo é um bloco com nome acessível (o título do grupo), com o avatar do dono, o título e o subtotal no cabeçalho, e a lista de compras abaixo. A linha da compra não muda, então o texto que os testes de hoje procuram (por exemplo `Notebook (3/10)` e `Netflix ... US$ 58,00 → ... 298,19`) continua igual.

**7. Testes.**
- Função pura: soma em BRL e em dólar, soma dos grupos igual ao total, compra estrangeira sem valor em BRL, ordem dos grupos e das compras, mesmo `accountId` em dois donos, `detail` vazio.
- Tela: título com o nome, título com o `accountId` enquanto os nomes carregam e quando falham, e os outros cards inalterados.
- Os testes atuais da visão geral passam a registrar um handler para `/accounts`. Sem ele, a chamada nova não teria resposta mockada.
- As fixtures atuais têm um só cartão. Os casos de dois cartões e dois donos usam dados montados no próprio teste, sem alterar `summaryFixture`, que outros testes usam.

## Risks / Trade-offs

- [A soma no cliente pode divergir da API se a regra mudar lá] → O teste confere a soma dos grupos contra o total nas fixtures, e a regra está só na função pura.
- [Dois cartões do mesmo dono com o mesmo nome ficam com títulos iguais] → Aceito. O subtotal e as compras separam os grupos, e distinguir por final do cartão fica fora do escopo.
- [Uma chamada a mais (`/accounts`) na visão geral] → Aceito. É a mesma que a tela de transações já faz, e ela não bloqueia nada.
- [Com a lista de nomes falhando, os títulos mostram ids] → Aceito e especificado. O resumo continua legível.

## Migration Plan

Mudança só de front, sem migração. Rollback é reverter o commit.
