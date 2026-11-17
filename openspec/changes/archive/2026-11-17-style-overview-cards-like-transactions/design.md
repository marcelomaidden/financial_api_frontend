# Design

## Context

Estado atual, observado no código:
- `OverviewPage.tsx` usa o `SummaryCard` para os quatro cards. Três deles passam `renderItem` e recebem a lista em texto corrido, com o avatar do dono na frente. Só o card de compras passa `renderDetail` (`PurchasesByCard`), com grupos por cartão, subtotal e `TransactionRow`.
- `src/lib/purchases.ts` tem `groupPurchases`, que agrupa por `owner:accountId`, soma em centavos com a regra das compras (outra moeda sem `amountInAccountCurrency` fica fora da soma), ordena os grupos pelo maior subtotal e as compras por data decrescente.
- `TransactionRow` tem `income` (booleano), `description`, `detail`, `aside`, `amount` e `amountNote`. O ícone de direção é fixo.
- Os nomes de contas e cartões vêm de uma consulta `['account-names']` não bloqueante, com o `accountId` como fallback.
- A API garante BRL em `incomes.available`, `incomes.transactions` e `expenses.owed`.

Motivação e escopo: veja proposal.md. Requisitos: veja specs/combined-overview/spec.md.

## Goals / Non-Goals

**Goals:**
- Os quatro cards da visão geral passam a ter o mesmo visual de linha, e o agrupamento por conta só onde há várias linhas por conta (compras e entradas).
- A regra de agrupar e somar fica em um só lugar, testada sem renderizar tela.

**Non-Goals:**
- Mudar o card de compras, os totais, o aviso de dados parciais ou a API.
- Mostrar o nome da conta a partir do próprio resumo. Seria mais rápido, mas fugiria do que o card de compras faz hoje.

## Decisions

**1. Agrupamento genérico por conta.**
Uma função `groupByAccount` em `src/lib` recebe o `detail` e três funções de quem chama: o `accountId` do item, a data para ordenar e o valor em centavos (ou `null` quando o item não entra na soma). Ela devolve grupos com `key` (`owner:accountId`), `owner`, `accountId`, `subtotal`, `items` e `excludedCount`, pelo maior subtotal e com os itens por data decrescente. O `groupPurchases` passa a ser um uso dela com a regra das compras, e as entradas usam a regra simples (soma do `amount`, já que a API garante BRL). Alternativa descartada: copiar a função para as entradas, o que duplicaria a ordenação e o arredondamento em centavos.

**2. Ordenação das faturas e do saldo em funções puras.**
Faturas por `dueDate` crescente, com data inválida no fim e ordem de chegada no empate. Contas do saldo pelo maior `balance`, também estável. Ficam em `src/lib` para serem testadas fora da tela. Não usam o agrupamento.

**3. Cabeçalho de grupo compartilhado.**
O cabeçalho (avatar do dono, nome da conta, subtotal com `data-testid="group-subtotal"`, e a lista) sai do `PurchasesByCard` para um componente que as compras e as entradas usam. O nome acessível do grupo continua sendo o título.

**4. `TransactionRow` ganha `leading` e `neutral`.**
`leading` troca o ícone de direção por outro conteúdo, e `neutral` tira a cor de entrada ou saída do valor e o "−". O Saldo usa os dois: o avatar do dono como `leading` e o saldo em cor neutra, com o sinal negativo vindo do próprio formato do valor. Sem essas propriedades, a linha é igual à de hoje, então a tela de transações e as compras não mudam. Alternativa descartada: trocar `income` por um tipo de três valores, que mexeria nas chamadas existentes sem necessidade.

**5. Mapeamento de cada card.**
- Entradas: grupos pelo componente de cabeçalho. Linha com `income` verdadeiro, descrição, data em `detail` e o valor sem "−". Nome da conta pela consulta de nomes, com o `accountId` de fallback.
- Faturas: sem grupo. Linha de saída com o nome do cartão como descrição, `vence em` e o vencimento em `detail`, o avatar do dono em `aside` e o valor com "−". O nome vem no próprio item, então não depende da consulta de nomes.
- Saldo: sem grupo. Linha com `leading` (avatar), nome da conta e `neutral`.

**6. O `SummaryCard` só aceita `renderDetail`.**
Com os quatro cards usando detalhe próprio, `renderItem` e o ramo da lista em texto corrido saem. O contador "Ver detalhe (N)" continua contando os itens, e "Nenhum item." continua valendo quando não há nenhum.

**7. Testes.**
- Funções puras: o agrupamento genérico com a regra das entradas e das compras, a ordem das faturas (inclusive data inválida) e a ordem do saldo.
- `TransactionRow`: `leading` e `neutral`.
- Visão geral: um conjunto de casos por card conforme a spec. Dois testes atuais mudam por regra: o das faturas, que procura `Cartão Nubank · vence em 20/11/2026 · R$ 250,40` e o avatar, e o `não agrupa os outros cards`, que passa a afirmar que só Entradas e Compras têm grupos.
- A consulta `/accounts` dos testes ganha uma conta bancária (`a1`), para as entradas terem nome.

## Risks / Trade-offs

- [As Entradas mostram o `accountId` por um instante, até os nomes chegarem] → Igual ao card de compras hoje e especificado. Dá para mostrar o nome do `incomes.available` depois, se incomodar.
- [Mexer no `groupPurchases` pode quebrar o card de compras] → Os testes atuais do agrupamento e da tela de compras são mantidos, e passam a rodar sobre a função genérica.
- [O saldo em cor neutra pode perder contraste no modo escuro] → Usa a cor padrão do texto, que já tem variante escura, e a conferência manual da última tarefa confere.
- [Ordenar as faturas por vencimento difere da ordem da API] → É a ordem pedida na spec, e a função tem teste.

## Migration Plan

Mudança só de front, sem migração. Rollback é reverter o commit.
