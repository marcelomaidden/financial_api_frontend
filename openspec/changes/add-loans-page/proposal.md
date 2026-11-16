# Proposal

## Why

A `financial_api` agora expõe `GET /loans`, mas a SPA não mostra empréstimos nem financiamentos. Quem usa a SPA precisa abrir outra ferramenta para saber quanto ainda deve em cada contrato.

## What Changes

- Nova página `/loans` ("Empréstimos") com os empréstimos de todos os donos juntos, cada um com a etiqueta do dono, como nas outras telas.
- Cada empréstimo mostra nome do produto, tipo (`kind`), saldo para quitar, parcelas pagas e restantes (e em atraso, quando houver), fim do contrato e último pagamento regular. Campo que a API devolve `null` não aparece.
- Falha de um dono aparece como aviso, sem esconder os empréstimos dos demais.
- Novo link "Empréstimos" na navegação.
- Tipos `Loan` e `OwnerLoans`, função `fetchLoans` e dados de exemplo para testes.
- Datas sem hora (`yyyy-mm-dd`) passam a ser exibidas sem deslocamento de fuso. Hoje `formatDate("2022-08-01")` mostra 31/07/2022 em `America/Sao_Paulo`.

Fora do escopo:
- Empréstimos na visão geral e no `/summary` (change futuro).
- Valor da parcela mensal, que a API não informa.
- Filtro por dono e paginação, que a API também não oferece.

## Capabilities

### New Capabilities
- `combined-loans`: listar empréstimos e financiamentos de todos os donos em uma tela, com saldo, parcelas e último pagamento, tolerando campos ausentes e falha parcial por dono.

### Modified Capabilities

Nenhuma. A correção de fuso em datas sem hora é detalhe de implementação coberto pelos cenários de `combined-loans`.

## Impact

- Código: `src/api/types.ts`, `src/api/endpoints.ts`, `src/api/fixtures.ts`, `src/lib/format.ts`, `src/App.tsx`, `src/components/Layout.tsx` e a nova `src/pages/LoansPage.tsx`, com testes.
- API consumida: `GET /loans` (somente leitura, sem parâmetros). Nenhuma rota existente muda.
- Risco: o formato real da Pluggy ainda não foi conferido (tarefa 3.2 do change `loans-endpoint` na `financial_api`). A tela trata todo campo opcional como possivelmente ausente.
- README: lista a nova tela.
