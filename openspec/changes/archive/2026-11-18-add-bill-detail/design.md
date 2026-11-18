# Design

## Context

Estado atual, observado no código:
- `AccountsPage.tsx` tem o `BillsPanel`, que busca `fetchBills(owner, accountId, page, 12)` com a chave `['bills', owner, accountId, page]`. Cada fatura é um `<li className="flex justify-between py-1">` com `Vencimento {formatDate(bill.dueDate)}` e o total. O teste atual localiza a linha por `findByText(/Vencimento 20\/11\/2026/).closest('li')`, então esse texto e o `li` precisam continuar existindo.
- `Bill` (em `types.ts`) tem `id`, `dueDate` e `closingDate` (podem ser `null`), `totalAmount`, `currencyCode` e `minimumPaymentAmount`. A listagem usa datas com hora (`2026-11-20T00:00:00` nos testes), e o detalhe novo usa `yyyy-mm-dd`. `formatDate` aceita os dois formatos e devolve "-" para `null` ou data inválida.
- Rotas: `App.tsx` declara `<Route element={<Layout />}>` com `index`, `accounts`, `loans` e `transactions`. `main.tsx` usa `BrowserRouter`. Os testes usam `renderWithProviders(ui, route)`, que já envolve em `MemoryRouter`, então `<Link>` e `useSearchParams` funcionam nos testes de tela.
- Controle de acesso: o nginx (`config/nginx.conf.erb`) exige Basic Auth em toda requisição e devolve `index.html` para caminhos inexistentes (`error_page 404 = /index.html`). O `static.json` tem o mesmo fallback (`/**` para `index.html`). Uma rota nova `/bills/...` recarregada passa pelos dois sem mudança, e o requisito de `spa-access-control` já cobre "rota da SPA recarregada".
- `client.ts`: `getJson(path, params, signal)` monta a URL com `URL.searchParams` (codifica os parâmetros de consulta, descarta `undefined`, `null` e vazio), envia `X-API-Key` e lança `ApiRequestError` com a `message` do `ApiErrorBody`.
- Reuso disponível: `Loading`, `ErrorMessage` (com `onRetry`), `PartialWarning`, `OwnerAvatar`, `TransactionRow` (já usada em transações e na visão geral; `PurchaseRow` da visão geral mostra a parcela como `número/total` em texto pequeno ao lado da descrição), `formatMoney`, `formatDate`. Estilos são classes Tailwind inline (`rounded border bg-white dark:bg-slate-800`, `divide-y`, texto apagado `text-slate-500 dark:text-slate-400`).

Motivação e escopo: veja proposal.md. Requisitos: veja specs/combined-accounts/spec.md e specs/api-access/spec.md.

## Goals / Non-Goals

**Goals:**
- Chegar ao detalhe com um clique a partir da fatura, sem que o usuário informe dono ou conta.
- A página funcionar recarregada ou aberta por um endereço salvo, porque todo o contexto vai no endereço.
- Reaproveitar componentes, formatadores e estilos existentes, sem criar componentes genéricos novos.

**Non-Goals:**
- Reabrir o painel de faturas ao voltar para Contas (o estado do painel é local e não persiste).
- Marcar "Contas" como ativo no menu enquanto o usuário está no detalhe.
- Pagamento, cache próprio, mudanças na listagem de faturas.

## Decisions

**1. Rota `/bills/:id?owner=&accountId=`, dentro do `Layout`, como página própria.**
Em `App.tsx`, `<Route path="bills/:id" element={<BillDetailPage />} />` ao lado das demais. O `id` vai no caminho (é o recurso, como na API) e `owner` e `accountId` vão na query string, igual ao contrato `GET /bill/{id}?owner&accountId`. O `Layout` mantém o menu e o `main`; o controle de acesso é o mesmo das outras rotas (Basic Auth do nginx e `X-API-Key` do cliente), sem código de acesso na página. Alternativas descartadas: (a) painel expansível dentro da lista de faturas, que deixaria a lista longa, perderia o endereço compartilhável e não sobreviveria a recarregar; (b) rota aninhada `/accounts/:owner/:accountId/bills/:id`, que repete o formato da API de listagem mas cria um prefixo que o menu marcaria como "Contas" e exige três segmentos no teste sem ganho, já que o contrato do endpoint novo usa query string.

**2. `fetchBillDetail(owner, accountId, id, signal)` em `endpoints.ts`.**
Segue o padrão de `fetchBills`: `getJson<BillDetailResponse>(`/bill/${encodeURIComponent(id)}`, { owner, accountId }, signal)`. O `id` é codificado no caminho com `encodeURIComponent`; `owner` e `accountId` são codificados pelo `URLSearchParams` do `buildUrl` (não codificar duas vezes). A ordem dos argumentos é a mesma de `fetchBills` (dono, conta), com o id da fatura por último.

**3. Tipos em `types.ts`.**
`BillFinanceCharge { id, type, amount, currencyCode, additionalInfo: string | null }`, `BillPayment { id, valueType, paymentDate: string | null, paymentMode: string | null, amount, currencyCode }`, `BillDetail { id, dueDate, closingDate: string | null, totalAmount, currencyCode, minimumPaymentAmount: number | null, allowsInstallments: boolean | null, financeCharges: BillFinanceCharge[], payments: BillPayment[] }`, `BillTransaction { id, date, description, amount, currencyCode, category: string | null, type: string, status: string, installment?: Installment }` e `BillDetailResponse { owner, accountId, bill: BillDetail, transactions: BillTransaction[] }`. `Installment` já existe e é reaproveitado. `type`, `valueType` e `paymentMode` ficam `string`, como `kind` em `Loan`, para um valor novo da API não quebrar a tela. Não se estende `Transaction`, porque ela não tem `installment` e o contrato difere (`installment` é opcional).

**4. Página `BillDetailPage.tsx`.**
Lê `id` com `useParams` e `owner` e `accountId` com `useSearchParams`. Se `owner` ou `accountId` faltar (ou estiver em branco), mostra `ErrorMessage` com "Faltam dados da fatura (dono ou conta). Volte para Contas e abra a fatura de novo.", sem botão de nova tentativa, e a consulta fica desabilitada (`enabled: false`), evitando o 400. A consulta é `useQuery({ queryKey: ['bill-detail', owner, accountId, id], queryFn: ({ signal }) => fetchBillDetail(...) })`, sem opções de cache além do padrão do `QueryClient` do projeto.

Estrutura da página, em ordem:
- Link "← Voltar para Contas" (`<Link to="/accounts">`) no topo, sempre visível, inclusive carregando e com erro.
- `<h1>` "Fatura" (e o `OwnerAvatar` com `showName` do dono, quando a resposta chegar, usando `owner` da resposta).
- Carregando: `<Loading label="Carregando fatura..." />`. Erro: `<ErrorMessage message={error.message} onRetry={refetch} />`; nada de resumo ou compras (a API não devolve resposta parcial, e a página não mistura dados antigos com erro novo).
- `<section aria-label="Resumo da fatura">` em card (`rounded border bg-white dark:bg-slate-800 p-4`), com lista de definição (`dl`): Vencimento, Fechamento, Total, Pagamento mínimo e, só quando `allowsInstallments !== null`, "Aceita parcelamento: Sim/Não". Campos nulos mostram "-" (`formatDate(null)` já faz isso; para o mínimo, "-" explícito). Total e mínimo usam `formatMoney(valor, bill.currencyCode)`.
- `<section aria-label="Encargos">`: lista com o tipo, `additionalInfo` em texto apagado quando houver e o valor; vazio: "Nenhum encargo.".
- `<section aria-label="Pagamentos">`: lista com o `valueType`, a data (`formatDate(paymentDate)`) e o `paymentMode` em texto apagado quando houver, e o valor; vazio: "Nenhum pagamento.".
- `<section aria-label="Compras">`: `<ul className="divide-y rounded bg-white text-sm dark:bg-slate-800">` de `TransactionRow`, na ordem recebida (a API já ordena por data decrescente; o front não reordena). Vazio: "Nenhuma compra nesta fatura.".
Os rótulos de seção usam `<h2>` com a mesma classe de `TransactionsPage` (`text-sm font-medium text-slate-500`), e `aria-label` igual ao título, como em `AccountsPage`.

**5. Linha de compra com `TransactionRow`, no padrão do `PurchaseRow` da visão geral.**
`income={transaction.type === 'CREDIT'}` (mesma regra de `TransactionsPage`: estorno ou crédito aparece como entrada verde, o resto como saída), `description` com a parcela `número/total` em `span` pequeno quando `installment` existir (mesmo markup do `PurchaseRow`), `detail={formatDate(date)}` e `amount={formatMoney(Math.abs(amount), currencyCode)}`. A moeda é a da própria compra; o contrato não traz valor convertido, então não há `amountNote`. A `category`, quando houver, vai na `detail` junto da data (`20/11/2026 · Alimentação`). A chave da linha é o `id`.

**6. Link na lista de faturas do `BillsPanel`.**
Cada `<li>` mantém `Vencimento {formatDate(dueDate)}` e o total (o teste atual continua passando) e ganha um `<Link>` com texto visível "Ver detalhe" e complemento só para leitores de tela, no padrão do botão "Ver faturas" (`<span className="sr-only"> da fatura com vencimento 20/11/2026</span>`), de modo que o nome acessível seja "Ver detalhe da fatura com vencimento 20/11/2026". Sem `dueDate`, o complemento é " da fatura sem vencimento" (em vez de "vencimento -"). O destino é montado com `encodeURIComponent(bill.id)` no caminho e `new URLSearchParams({ owner, accountId })` na query. O layout do `li` passa a ter três itens (vencimento, link e total) com `gap`, estilo do link igual ao do botão "Ver faturas" (`text-blue-700 dark:text-blue-400`). Alternativa descartada: tornar a linha inteira um link, que mistura o total e o vencimento no nome acessível e dificulta o teste por texto.

**7. Voltar para Contas por link fixo, não por `navigate(-1)`.**
O link vai sempre para `/accounts`, também quando a página foi aberta por endereço direto ou recarregada (onde o histórico não ajuda). O custo é que o painel de faturas volta fechado, porque `open` e `page` são estado local.

**8. Testes.**
- `endpoints.test.ts`: `fetchBillDetail` chama `/api/bill/<id>` com `owner` e `accountId` na query, codifica um `id` com caractere especial (por exemplo `b/1 x` vira `b%2F1%20x` no caminho), envia `X-API-Key` (padrão dos demais testes de endpoint, se existir; senão ao menos cobrir a URL) e propaga o erro 404 com a `message`.
- `BillDetailPage.test.tsx` (`renderWithProviders(<Routes>...</Routes>, '/bills/b1?owner=marcelo&accountId=c1')`, com a rota montada para o `useParams` funcionar): resumo, fechamento e mínimo nulos, encargos, pagamentos, compra parcelada, estorno, carregando, 404 e 502 sem dados parciais, tentar de novo, listas vazias, endereço sem `owner` ou `accountId` sem chamar a API, link de volta.
- `AccountsPage.test.tsx`: o link existe em cada fatura, com nome acessível com o vencimento, e o `href` leva `/bills/b1?owner=marcelo&accountId=c1`; fatura sem vencimento; os testes atuais de listagem e paginação seguem inalterados.
- `App.test.tsx`: a rota `/bills/b1?owner=...&accountId=...` renderiza a página dentro do layout.
- Uma fixture de detalhe em `fixtures.ts` pode servir aos três testes, no estilo das existentes.

## Risks / Trade-offs

- [A `financial_api` ainda está sendo especificada em paralelo e o contrato pode mudar] → Os tipos e o `fetchBillDetail` concentram o contrato num só lugar; a página lê só campos listados no contrato, e `type`, `valueType` e `paymentMode` são `string` para tolerar valores novos.
- [A semântica de `type` das transações do cartão (`CREDIT` como estorno) vem do padrão da Pluggy, usado em `TransactionsPage`, e não está no contrato] → Mesma regra da tela de transações; se a API devolver outro valor, a linha aparece como saída. Conferir na validação manual com a API real.
- [O `id` da fatura pode ter caracteres especiais] → `encodeURIComponent` no caminho do link e no `fetchBillDetail`, e `useParams` já devolve o `id` decodificado; os dois testes cobrem um `id` com `/` e espaço.
- [Painel de faturas volta fechado ao voltar para Contas] → Aceito (decisão 7). Se incomodar, guardar o cartão aberto na query string da aba Contas, em outra change.
- [O menu não destaca "Contas" no detalhe] → Aceito; o link de volta e o título deixam o contexto claro.
- [Valores `number` com ponto flutuante] → Só exibição com `Intl.NumberFormat`; a página não soma nada.

## Migration Plan

Sem migração. O deploy é o do front. A `financial_api` precisa publicar `GET /bill/{id}` antes; sem ele, o link leva a uma tela de erro com a mensagem da API (404 ou de rede). Rollback: reverter a change; nenhum dado persistido.
