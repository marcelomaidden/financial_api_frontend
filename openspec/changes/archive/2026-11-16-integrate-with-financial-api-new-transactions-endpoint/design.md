# Design

## Context

Hoje `fetchCombinedTransactions` chama `/accounts`, depois pagina cada conta com `after`, ordena no cliente e reúne as falhas. A API passa a fazer isso em `GET /transactions`, que devolve `{ transactions, partial, errors }`. Cada transação traz `owner` e `accountId`, e a resposta não traz o nome da conta. Motivação em proposal.md.

Observado no código da API: `AccountService.getAccounts` não filtra por tipo, e `getCreditCards` é o mesmo resultado filtrado por `type = CREDIT`. Portanto `/accounts` já cobre as contas bancárias e os cartões que aparecem em `/transactions`.

## Goals / Non-Goals

**Goals:**
- Uma chamada de transações por consulta, com a ordem e o reagrupamento por dia feitos sem nova ordenação.
- Manter o nome da conta em cada linha.

**Non-Goals:**
- Usar os filtros `owner` e `accountId` do endpoint.
- Alterar a API para devolver `accountName`.

## Decisions

**1. Nomes vindos só de `/accounts`.**
O FE chama `/transactions` e `/accounts` em paralelo e monta um mapa `owner:accountId` para nome. Alternativa descartada: também chamar `/credit-cards`, que só repete cartões já presentes em `/accounts`. Outra alternativa, pedir `accountName` à API, ficou fora de escopo e eliminaria a chamada a `/accounts`.

**2. Falha ao buscar nomes não derruba a lista.**
`/accounts` é consultada com `Promise.allSettled`. Se falhar, as linhas mostram o `accountId`. A lista de transações é o que o usuário pediu, e o nome é apresentação.

**3. Ordem vinda da API.**
O FE não reordena. Agrupa linhas consecutivas pela data formatada, o que só funciona porque a lista chega ordenada por data. A data sem hora (`yyyy-mm-dd`) e a com hora são tratadas por `formatDate`, que já evita o deslocamento de fuso.

**4. Entrada por `type === 'CREDIT'`.**
Qualquer outro valor de `type`, incluindo valores novos, é saída. O valor é exibido em módulo, com "−" nas saídas, para não depender do sinal de `amount`.

**5. Erros da API para avisos.**
`errors` vira lista de avisos. `accountId` nulo vira "Contas de <dono> não carregadas", e com `accountId` o aviso usa o nome da conta.

## Risks / Trade-offs

- [Resposta grande sem paginação em períodos longos] → O período inicial é o mês corrente. Paginar fica para uma change da API.
- [A ordem decrescente por data depende da API e não é conferida no FE] → A tarefa 3.1 confere com a API real. Se a ordem falhar, o agrupamento duplicaria cabeçalhos.
- [Duas chamadas em paralelo e um caso de erro a mais para os nomes] → Aceito, é leve. Pedir `accountName` à API removeria isso.
- [O contrato da API ainda está em change aberta] → O FE segue o `design.md` dela. Mudança de nome de campo exige ajuste em `types.ts`.
