# Design

## Context

Estado atual, observado no código:
- `TransactionsPage` guarda `dateFrom` e `dateTo` em `useState`, com o mês corrente como valor inicial. A consulta é `useQuery({ queryKey: ['transactions', dateFrom, dateTo], queryFn: () => fetchCombinedTransactions({ dateFrom, dateTo }) })`, e o filtro de conta não existe.
- `fetchCombinedTransactions(range)` em `src/api/transactions.ts` chama em paralelo `fetchTransactions(range)` e `fetchAccountNames()`. Ela devolve `{ rows, warnings }`, com o nome de cada conta resolvido por `owner:accountId` e o id como fallback. O mapa de nomes não é devolvido.
- `fetchTransactions(filter: TransactionsFilter)` já aceita `owner`, `accountId`, `dateFrom` e `dateTo`, e o `getJson` descarta os parâmetros vazios.
- Com `accountId`, a `financial_api` consulta só essa conta e responde com o erro normal (404, 502 e outros) quando ela falha, sem resposta parcial.
- Na `AccountsPage`, cada conta bancária é um `<li className="flex items-center justify-between rounded border ... p-3">` com o avatar, o nome, o número e o saldo. Cada cartão tem o botão "Ver faturas" com `<span className="sr-only"> de {card.name}</span>`.
- Os testes usam `renderWithProviders(ui, route)` com `MemoryRouter`, então `useSearchParams` e `Link` funcionam nos testes de tela.

Motivação e escopo: veja proposal.md. Requisitos: veja specs.

## Goals / Non-Goals

**Goals:**
- A URL é a fonte do filtro: o endereço pode ser salvo, recarregado e compartilhado.
- O filtro e o "Ver todas" não perdem o período escolhido.

**Non-Goals:**
- Controle de seleção de conta dentro da tela.
- Filtro por tipo ou só por dono.
- Destacar a aba Contas no menu enquanto a tela está filtrada.

## Decisions

**1. Filtro lido da URL com `useSearchParams`, só quando há dono e conta.**
`const owner = params.get('owner')?.trim()` e o mesmo para `accountId`. `filter = owner && accountId ? { owner, accountId } : undefined`. A chave da consulta passa a ser `['transactions', dateFrom, dateTo, filter?.owner ?? null, filter?.accountId ?? null]`, para que o cache da lista completa e o da conta filtrada não se misturem.
Alternativa descartada: guardar o filtro em estado local. Ele se perderia ao recarregar e não daria para usar um link de outra tela.

**2. `fetchCombinedTransactions(range, account?)` repassa o filtro e devolve o nome da conta filtrada.**
A assinatura passa a ser `fetchCombinedTransactions(range: DateRange, account?: { owner: string; accountId: string }, signal?)`. A função chama `fetchTransactions({ ...range, ...account })`, e o resultado ganha `filteredAccountName: string | null`. Com filtro, ele recebe `nameOf(owner, accountId)`, que cai para o id quando o nome não existe. Sem filtro, recebe `null`.
O nome vem do mesmo `fetchAccountNames` que já roda em paralelo, então não há chamada extra a `/accounts`.
Alternativa descartada: tirar o nome da primeira linha. Ela não existe quando a conta não tem transações no período.

**3. Aviso do filtro sempre visível com o filtro ativo.**
Logo abaixo do título, um bloco em tom neutro mostra "Conta: {nome}", o `OwnerAvatar` do dono e um link "Ver todas" (`<Link to="/transactions">`). O bloco aparece com o filtro ativo em qualquer estado: carregando, com erro ou com dados. Enquanto o nome não chega, mostra o `accountId`, que é o mesmo fallback do nome indisponível.

**4. "Ver todas" mantém o período.**
`Link` para `/transactions` sem query string. A rota é a mesma, então o React Router mantém o `TransactionsPage` montado, e `dateFrom` e `dateTo` (estado local) continuam iguais. Só a chave da consulta muda.
Alternativa descartada: levar as datas na URL. Seria uma mudança maior e fora do escopo.

**5. Link na conta bancária.**
No `<li>` de cada conta bancária, abaixo do nome, entra um `Link` "Ver transações" com `<span className="sr-only"> de {account.name}</span>`, no mesmo estilo do botão "Ver faturas" (`text-sm text-blue-700 dark:text-blue-400`). O destino é `/transactions?${new URLSearchParams({ owner, accountId: account.id })}`. Para isso, o `<li>` passa a ter uma coluna à esquerda com o nome e o link, e o saldo continua à direita. O nome acessível não inclui o dono, no padrão do "Ver faturas", e a etiqueta do dono continua visível na mesma linha.

## Risks / Trade-offs

- [Dois donos com contas de mesmo nome, como "Nubank" de cada um] → Os links têm o mesmo nome acessível. Esse é o mesmo comportamento do "Ver faturas". A etiqueta do dono ao lado diferencia visualmente.
- [Conta de outro dono na URL, com `owner=luana` e o `accountId` do marcelo] → A API responde com o erro mapeado da Pluggy. A tela mostra a mensagem e o "Ver todas", e não precisa de validação extra.
- [O menu destaca "Transações", e não "Contas", quando a tela vem do link] → Aceito. O aviso do filtro deixa o contexto claro.
