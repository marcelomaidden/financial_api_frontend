# Design

## Context

Motivação em `proposal.md`, comportamento na spec delta de `combined-overview`.

`OverviewPage` monta os cards com `SummaryCard`, que recebe uma `SummarySection` e desenha o título em `h3`, dentro de um `CardGroup` (`h2`). "Entradas no período" e "Saídas no período" usam `groupByAccount`, que agrupa por `owner:accountId`, soma em centavos e devolve o subtotal de cada grupo. As duas seções vêm da mesma consulta por conta na API: quando um dono falha, ele sai das duas juntas.

## Goals / Non-Goals

**Goals:**
- Calcular o resultado só no front, a partir de `incomes.transactions` e `expenses.accountDebits`.
- Manter a soma das contas igual ao total do card, sem diferença de arredondamento.

**Non-Goals:**
- Reconhecer transferências.
- Mudar os cards "Entradas no período" e "Saídas no período", exceto a nota das saídas.
- Mudar a API.

## Decisions

**1. Cálculo em centavos, numa função pura em `src/lib/`.**
Uma função recebe as duas seções e devolve o total e uma linha por conta (`owner`, `accountId`, entrou, saiu, resultado). Ela soma as entradas e as saídas de cada conta pela mesma chave `owner:accountId` de `groupByAccount`, usando o `toCents` de lá, e calcula tudo em centavos. A função não reaproveita `groupByAccount` em si: ele ordena os grupos pelo subtotal e perde a ordem de chegada que o desempate usa. O total do card é a soma das linhas. Assim ele nunca diverge do detalhe, mesmo que os `total.value` da API tenham arredondamento diferente. Alternativa descartada: subtrair `total.value` da API para o card e usar os subtotais no detalhe, o que poderia deixar uma diferença de centavos entre o card e a soma.

**2. Ordem das contas.**
Pelo resultado, do maior para o menor. No empate, vale a ordem de chegada: primeiro as contas na ordem das entradas, depois as que só têm saídas.

**3. Card próprio, não `SummaryCard`.**
O resultado não é uma `SummarySection` da API e o valor muda de cor pelo sinal. Um componente próprio reaproveita o estilo do `SummaryCard` (borda, total, "Ver detalhe (n)", "Nenhum item.") com o título em `h2`. O card fica fora dos grupos e no mesmo nível de "Entradas" e "Despesas" na hierarquia. Os `h3` dos cards dos grupos não mudam.

**4. Cor e sinal.**
Positivo usa a cor de entrada, negativo a cor de saída com "−" e zero fica neutro. A regra vale no total e em cada linha do detalhe. É a mesma convenção do `TransactionRow`.

**5. Linha da conta.**
Avatar do dono, nome da conta (via `nameOf`, com o `accountId` como reserva), "entrou" e "saiu" em tom apagado e o resultado à direita.

## Risks / Trade-offs

- **Resultado lido como "gasto"** → o card mostra só o fluxo das contas bancárias. Faturas e compras do cartão não entram, porque o pagamento da fatura já é uma saída da conta.
- **Dados parciais** → um dono com falha sai das entradas e das saídas juntas, então o resultado continua coerente. O aviso de dados parciais já existe.
- **Contas sem movimento ficam de fora** → uma conta com saldo e sem transações no período não aparece no detalhe. É o comportamento esperado.
