# Proposal

## Why

No card "Compras do cartão sem fatura" da visão geral, as compras aparecem numa lista única, identificadas só pelo avatar do dono. Quem tem mais de um cartão não vê de qual cartão é cada compra nem quanto cada um acumula, mesmo que a API já envie o `accountId` em toda compra.

## What Changes

- No detalhe do card "Compras do cartão sem fatura", as compras passam a ser agrupadas por cartão (por dono e `accountId`). Cada grupo mostra o dono, o nome do cartão e o subtotal.
- O subtotal de cada grupo segue a regra da API: compra em BRL soma o `amount`, compra em outra moeda soma o `amountInAccountCurrency`, e compra estrangeira sem esse valor aparece na lista e fica fora da soma, com um aviso discreto no grupo. A soma dos subtotais é igual ao total do card.
- Os grupos ficam ordenados pelo maior subtotal. Dentro de cada grupo, as compras ficam por data, da mais recente para a mais antiga.
- O nome do cartão vem de `/accounts`, que traz contas e cartões. A busca não bloqueia o card: sem o nome (ainda carregando ou com falha), o grupo usa o `accountId` como título.
- A linha de cada compra não muda: descrição, parcela, data e valor, com a moeda original e o valor em BRL nas compras estrangeiras.
- Fora de escopo:
  - os outros três cards da visão geral;
  - mudanças na `financial_api` ou no `/summary`;
  - tabela "por conta" geral, filtro por conta e qualquer mudança no período;
  - mostrar cartões sem compra pendente.

## Capabilities

### New Capabilities

### Modified Capabilities
- `combined-overview`: ganha um requisito novo, que agrupa as compras sem fatura por cartão com o subtotal. Os requisitos existentes, inclusive o detalhe por dono, continuam valendo.

## Impact

- Código: `src/pages/OverviewPage.tsx` (detalhe do card de compras) e a busca dos nomes de contas e cartões, hoje privada em `src/api/transactions.ts`, que passaria a ser compartilhada.
- Chamadas: a visão geral passa a chamar também `/accounts`, só para os nomes.
- Testes: os testes da visão geral precisam mockar `/accounts`. Há casos novos de agrupamento, subtotal, ordem, nome ausente e compra estrangeira sem valor em BRL.
- Documentação: o README não cita esse detalhe, então nada muda lá.
- Sem mudança de dependências, variáveis de ambiente nem API.
