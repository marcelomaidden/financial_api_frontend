# Design

## Context

Estado atual, observado no código:
- `TransactionsPage.tsx` monta a linha da transação inline: um `<li>` com o ícone redondo (`role="img"` e `aria-label` "Entrada" ou "Saída"), a descrição (`min-w-0 flex-1 truncate`), o avatar do dono, o nome da conta e o valor em uma coluna `w-32` à direita, verde ou vermelho, com "− " nas saídas. Há classes de modo escuro em todas as cores.
- `OverviewPage.tsx` desenha cada compra com `ExpenseTransactionItem`, um `<span>` com o texto corrido, dentro do `<li>` de `PurchasesByCard`.
- Os testes da tela de transações procuram o ícone por `getByRole('img', { name: 'Saída' })` e o valor por `li.querySelector('span.text-red-600')` com o texto "−", a partir de `getByText(...).closest('li')`. Os testes da visão geral procuram `Notebook (3/10)` e `Netflix ... US$ 58,00 → ... 298,19`.

Motivação e escopo: veja proposal.md. Requisitos: veja specs/combined-overview/spec.md.

## Goals / Non-Goals

**Goals:**
- A compra e a transação saem do mesmo componente de linha, então o visual não diverge.
- A `TransactionsPage` continua mostrando exatamente o que mostra hoje.

**Non-Goals:**
- Mudar o agrupamento por cartão, o subtotal, a ordem ou a função `groupPurchases`.
- Tornar a linha configurável além do que as duas telas precisam.

## Decisions

**1. Um componente de linha compartilhado, apresentacional.**
`TransactionRow` em `src/components` renderiza o `<li>` com o ícone, a descrição, uma área opcional entre a descrição e o valor e a coluna do valor. Propriedades: `income` (booleano), `description`, `detail` (segunda linha apagada sob a descrição, opcional), `aside` (conteúdo entre a descrição e o valor, opcional), `amount` (texto já formatado, sem sinal) e `amountNote` (linha apagada sob o valor, opcional). O componente acrescenta o "− " nas saídas e escolhe verde ou vermelho. Alternativas descartadas: copiar as classes para a `OverviewPage`, o que as faria divergir na próxima mudança de estilo; e extrair só o ícone, o que deixaria o resto da linha duplicado.

**2. A `TransactionsPage` passa a usar o componente sem mudar o que mostra.**
Ela usa `aside` para o avatar e o nome da conta, e não usa `detail` nem `amountNote`. O ícone mantém o `role="img"` e o `aria-label`. O valor continua num `<span>` com `text-red-600` ou `text-green-600` e o "−", e as demais classes ficam iguais. A coluna do valor ganha um contêiner para a nota opcional, e o `<span>` do valor fica dentro dele, de modo que os seletores dos testes atuais continuem valendo. Os testes da tela de transações não mudam e funcionam como proteção contra regressão.

**3. Mapeamento da compra para a linha.**
- `income` é falso: toda compra sem fatura é saída.
- `description` é o texto da compra, seguido da parcela `número/total` em tom apagado, quando houver.
- `detail` é a data, formatada com `formatDate`, em tom apagado.
- `aside` não é usado: o dono e o nome do cartão ficam só no cabeçalho do grupo.
- `amount` é o valor em BRL quando há `amountInAccountCurrency`, senão o valor original.
- `amountNote` é o valor original (por exemplo, `US$ 58,00`), só quando há valor em BRL e a moeda não é BRL.
A condição de "estrangeira" continua sendo a de hoje: `amountInAccountCurrency` presente. O `ExpenseTransactionItem` deixa de existir.

**4. Compra estrangeira sem valor em BRL.**
A linha mostra só o valor original como valor principal, e a compra continua fora do subtotal, com o aviso que o grupo já traz. Nenhuma regra de soma muda, porque ela está em `groupPurchases`.

**5. Estilo dentro do card.**
A lista de cada grupo continua só com divisórias, sem o fundo branco e os cantos arredondados da lista da tela de transações, porque o card já tem fundo e borda. Os valores de cor, tamanho e modo escuro vêm do componente.

**6. Testes.**
- Componente: variantes de entrada e saída, `detail`, `aside` e `amountNote`, no `components.test.tsx`.
- Visão geral: atualizar os dois testes que procuram o texto corrido, e acrescentar casos para o ícone "Saída", o "−" no valor, a data na linha, a parcela ao lado da descrição, a compra estrangeira (BRL como principal e o original abaixo), a compra estrangeira sem valor em BRL, e o dono e o cartão fora das linhas (um avatar por grupo).
- Tela de transações: sem mudança.

## Risks / Trade-offs

- [O componente compartilhado pode alterar a marcação da tela de transações] → Os testes dela não mudam e cobrem o ícone, a cor e o "−". A coluna do valor mantém o `<span>` com as mesmas classes.
- [O card da visão geral tem meia largura em telas médias, e a coluna do valor de `w-32` aperta a descrição] → A descrição já trunca, e o teste manual da última tarefa confere em largura estreita e no modo escuro.
- [O ícone ↑ aparece em toda linha e não informa nada, já que tudo é saída] → Aceito por consistência visual. Dá para remover depois com uma propriedade, se incomodar.

## Migration Plan

Mudança só de front, sem migração. Rollback é reverter o commit.
