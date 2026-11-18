# Proposal

## Why

Na aba Contas, a lista de faturas de um cartão mostra só o vencimento e o total. Quem quer saber o que compõe a fatura (compras, parcelas, encargos, pagamentos, valor mínimo) não tem como ver isso no front, mesmo que a `financial_api` passe a expor o detalhe da fatura em `GET /bill/{id}`.

## What Changes

- Cada fatura listada no painel de faturas de um cartão (aba Contas) ganha um link para o detalhe. O nome acessível do link inclui o vencimento da fatura.
- Nova página de detalhe da fatura, na rota `/bills/:id?owner=<dono>&accountId=<id da conta do cartão>`, dentro do layout atual (mesmo menu e mesma proteção de acesso da SPA).
- A página chama `GET /bill/{id}?owner=...&accountId=...` com o `id` da fatura (`bill.id` da listagem), o dono e o `accountId` que o painel já usa, e envia a chave de API como nas demais chamadas.
- A página mostra o resumo da fatura (vencimento, fechamento, total, pagamento mínimo, se aceita parcelamento, encargos e pagamentos) e a lista de compras, da mais recente para a mais antiga, com a parcela quando houver.
- A página tem estados de carregamento, erro (com nova tentativa) e vazio, e um link de volta para Contas.
- Contrato da API (fixo, especificado em paralelo no projeto `financial_api`): resposta 200 com `owner`, `accountId`, `bill` (com `financeCharges` e `payments`) e `transactions`; erros 400 (parâmetros ausentes), 404 (fatura inexistente) e falhas da Pluggy no formato `ApiErrorBody`; sem resposta parcial.
- Fora de escopo:
  - alterar o endpoint de listagem de faturas ou o `BillsPanel` além do link;
  - pagamento de fatura;
  - cache customizado (vale o padrão do React Query já usado);
  - detalhe de fatura a partir de outras telas (visão geral, transações).

## Capabilities

### New Capabilities

Nenhuma. O detalhe da fatura é continuação do fluxo "faturas de um cartão" que já pertence a `combined-accounts`, e uma capability só para uma tela seria um recorte sem requisitos próprios além dele.

### Modified Capabilities
- `combined-accounts`: ganha os requisitos do link de detalhe na lista de faturas, da página de detalhe (resumo, compras com parcela) e dos estados da página (carregando, erro, vazio, parâmetros ausentes, voltar para Contas). Os requisitos existentes continuam valendo.
- `api-access`: o requisito "Chave de API em toda chamada" passa a citar o detalhe da fatura entre as rotas que levam `X-API-Key`.

`spa-access-control` não muda: o requisito já cobre toda rota da SPA acessada diretamente ou recarregada, inclusive `/bills/...`.

## Impact

- Código: `src/api/types.ts` (tipos do detalhe), `src/api/endpoints.ts` (`fetchBillDetail`), nova `src/pages/BillDetailPage.tsx`, `src/App.tsx` (rota `bills/:id`) e `src/pages/AccountsPage.tsx` (link em cada fatura do `BillsPanel`).
- Chamadas: nova chamada `GET /api/bill/{id}` (a base `/api` segue `VITE_API_BASE_URL`), só ao abrir a página de detalhe.
- Testes: `src/api/endpoints.test.ts`, novo `src/pages/BillDetailPage.test.tsx`, `src/pages/AccountsPage.test.tsx` e `src/App.test.tsx` (rota). Possível fixture nova em `src/api/fixtures.ts`.
- Sem nova dependência, variável de ambiente ou mudança em nginx: o fallback para `index.html` (nginx e `static.json`) já atende a rota nova.
- Dependência externa: a `financial_api` precisa publicar `GET /bill/{id}` conforme o contrato acima antes do uso em produção.
