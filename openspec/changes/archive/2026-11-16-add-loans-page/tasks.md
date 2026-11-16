# Tasks

## 1. Cliente da API e datas

- [x] 1.1 Adicionar os tipos `Loan`, `LoanInstallments`, `LoanPayment` e `OwnerLoans` em `api/types.ts`, `fetchLoans` em `api/endpoints.ts` e `loansFixture` em `api/fixtures.ts` (baseado no exemplo do README da API, com um dono com erro). Verificar com teste MSW em `endpoints.test.ts` que `fetchLoans` chama `/api/loans` sem `owner`, lê o exemplo e converte um 502 em `ApiRequestError`
- [x] 1.2 Fixar `process.env.TZ = 'America/Sao_Paulo'` em `vite.config.ts` (sob o Vitest) e fazer `formatDate` tratar `yyyy-mm-dd` como data local. Verificar com `lib/format.test.ts` que `2028-01-15` vira `15/01/2028`, que `2026-11-20T00:00:00` e `2026-11-10T12:00:00Z` mantêm o resultado atual, que `null` e texto inválido viram `-`, e que `npm test` segue passando

## 2. Tela de empréstimos

- [x] 2.1 Criar `pages/LoansPage.tsx` com a consulta, a lista combinada com `OwnerBadge`, os estados de carregamento, erro com "tentar de novo" e vazio ("Nenhum empréstimo."), e o `PartialWarning` com o erro de cada dono. Verificar com `LoansPage.test.tsx` os cenários: listagem de todos os donos sem `owner` na URL, um dono com `error` sem ocultar os demais, 502 com botão de tentar de novo e lista vazia
- [x] 2.2 Mostrar em cada empréstimo o nome, o rótulo de `kind`, saldo para quitar, valor contratado, parcelas pagas e restantes, parcelas em atraso destacadas, fim do contrato e último pagamento, omitindo o que vier `null`. Verificar com testes dos cenários: empréstimo completo (datas sem deslocamento), só campos obrigatórios, parcelas em atraso, só `total` de parcelas e `kind` `UNKNOWN` ou novo exibido como "Outro"

## 3. Navegação e documentação

- [x] 3.1 Registrar a rota `loans` em `App.tsx` e o link "Empréstimos" em `Layout.tsx`. Verificar com teste em `App.test.tsx` que o link existe e leva à tela, e que os testes de navegação existentes passam
- [x] 3.2 Listar a tela de empréstimos no README (incluindo a limitação: sem parcela mensal e sem totais). Verificar com `npm run build`, `npm test` e o linter do projeto passando, sem erros
