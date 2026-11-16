# Proposal

## Why

Em todas as telas o dono aparece como uma etiqueta cinza com o nome. Na lista de transações, que já tem ícone, descrição, conta e valor, a etiqueta ocupa largura e todos os donos têm a mesma aparência, então é preciso ler o texto para saber de quem é cada linha.

## What Changes

- O `OwnerBadge` é substituído por um avatar: círculo colorido com a inicial do dono, com o nome completo em `title` (hover) e em `aria-label`.
- Cada dono conhecido tem uma cor fixa, e donos desconhecidos usam uma cor neutra. As cores evitam verde e vermelho, que já indicam entrada e saída nas transações.
- Nas telas Visão geral e Transações, só o avatar aparece. Em Contas e Empréstimos, o nome fica escrito ao lado do avatar, porque há espaço e o `title` não aparece em telas de toque.

## Capabilities

### New Capabilities
- `owner-identity`: como o dono de cada item é identificado na interface, por avatar com inicial, cor e nome acessível.

### Modified Capabilities

## Impact

- Código: o componente `src/components/OwnerBadge.tsx` (renomeado para avatar) e os pontos de uso em `TransactionsPage`, `OverviewPage`, `AccountsPage` e `LoansPage`, mais os testes que procuram o nome do dono pelo texto.
- Specs existentes: `combined-accounts` e `combined-loans` pedem "a etiqueta do dono". O avatar com nome ao lado continua atendendo a isso, então elas não mudam.
- Fora de escopo: borda colorida na linha, cor configurável pelo usuário e cor automática por hash do nome.
