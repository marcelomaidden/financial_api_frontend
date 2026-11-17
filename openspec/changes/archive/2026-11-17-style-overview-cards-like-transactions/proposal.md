# Proposal

## Why

Na visão geral, só o card "Compras do cartão sem fatura" tem o detalhe por conta e o visual das transações. Os outros três cards (Saldo disponível, Entradas no período e Faturas a pagar) ainda mostram o detalhe como texto corrido (`Nubank · R$ 500,50`, `PIX Recebido · 10/11/2026 · R$ 19,99`, `Cartão Nubank · vence em 20/11/2026 · R$ 250,40`). A mesma tela mistura dois estilos.

## What Changes

- **Entradas no período:** o detalhe é agrupado por conta bancária (dono e `accountId`), com o nome da conta e o subtotal no cabeçalho. Cada entrada vira uma linha no padrão das transações: ícone de entrada (↓ verde), descrição, data embaixo e valor verde, sem "−". Os grupos ficam pelo maior subtotal e as linhas por data decrescente. O nome da conta vem da lista de contas e, enquanto ela não chega ou se falhar, o grupo usa o `accountId`.
- **Faturas a pagar:** sem grupo, porque há em geral uma fatura por cartão. Cada fatura é uma linha de saída: ícone ↑ vermelho, o nome do cartão como descrição, o vencimento embaixo, o avatar do dono ao lado e o valor vermelho com "−". As faturas ficam por vencimento, a que vence primeiro no topo.
- **Saldo disponível:** sem grupo, porque cada item já é uma conta. Cada conta é uma linha com o avatar do dono no lugar do ícone, o nome da conta e o saldo em cor neutra, já que o saldo pode ser negativo. As contas ficam pelo maior saldo.
- Os totais dos cards, o aviso de dados parciais, o período e o card "Compras do cartão sem fatura" não mudam.
- A função de agrupamento por conta deixa de ser exclusiva de compras e passa a servir também às entradas. A regra de compra em outra moeda continua só nas compras. O `TransactionRow` ganha uma variante neutra para o saldo. O caminho de detalhe em texto corrido do `SummaryCard` deixa de ser usado e é removido.
- Fora de escopo:
  - o card de compras, a API e o `/summary`;
  - novos filtros, outro período ou agrupar por dia;
  - a tela de contas e a de transações.

## Capabilities

### New Capabilities

### Modified Capabilities
- `combined-overview`: ganha requisitos de aparência para os três cards. Os requisitos existentes continuam valendo, inclusive "Detalhe por dono": o dono segue visível em cada item, no cabeçalho do grupo ou no avatar da linha.

## Impact

- Código: `src/pages/OverviewPage.tsx` (os três cards e o `SummaryCard`), `src/lib/purchases.ts` (agrupamento genérico por conta), `src/components/TransactionRow.tsx` (variante neutra).
- Testes: os testes da visão geral que guardam o texto corrido das faturas e o que afirma que os outros cards não são agrupados precisam ser revistos. Há casos novos por card, para a função de agrupamento e para a variante neutra.
- Chamadas: nenhuma nova. As Entradas usam a consulta de nomes que a visão geral já faz.
- Documentação: o README não cita esse detalhe.
- Sem mudança de dependências, variáveis de ambiente nem API.
