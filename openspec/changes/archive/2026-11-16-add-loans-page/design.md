# Design

## Context

Veja proposal.md (Why e What Changes). A SPA já tem três telas que seguem o mesmo padrão: `useQuery` do TanStack Query chama uma função de `api/endpoints.ts`, a página junta as entradas de todos os donos, usa `OwnerBadge`, `PartialWarning`, `Loading` e `ErrorMessage`, e os testes usam MSW com `renderWithProviders`. `AccountsPage` é o modelo mais próximo.

O contrato de `GET /loans` está no README da `financial_api` e no `LoanResponse`: `{ owners: [{ owner, loans, error }] }`, com só cinco campos garantidos e o resto `null` quando a instituição não informa. Datas de empréstimo vêm como `yyyy-mm-dd`.

`formatDate` usa `new Date(iso)`. Uma string `yyyy-mm-dd` é lida como meia-noite UTC, e `toLocaleDateString` em `America/Sao_Paulo` mostra o dia anterior. As datas atuais (faturas, transações) trazem hora, então o problema não apareceu.

## Goals / Non-Goals

**Goals:**
- Tela `/loans` no mesmo padrão das existentes, sem dependências novas.
- Tolerar qualquer campo opcional ausente, já que o formato real da Pluggy não foi conferido.

**Non-Goals:**
- Sem totais agregados (soma de saldos) nesta change. Somar saldos de moedas diferentes exigiria conversão, e a API não oferece. Fica para a change do `/summary`.
- Sem estimar parcela mensal nem próximo vencimento.

## Decisions

**1. Página própria `LoansPage` em `/loans`.**
Foi a escolha do usuário. `/accounts` já junta contas e cartões, e empréstimos têm campos e leitura diferentes. Alternativa descartada: seção dentro de `AccountsPage`.

**2. Uma consulta, lista plana ordenada por dono.**
`useQuery(['loans'])` com `fetchLoans`, e a página faz `flatMap` das entradas em pares `{ owner, loan }`, mantendo a ordem da API. Sem ordenação extra: a API não define critério e nada no spec exige um.

**3. Cada empréstimo é um cartão com linhas condicionais.**
Um componente `LoanItem` mostra o título (etiqueta do dono, nome do produto, rótulo do `kind`) e uma lista de pares rótulo/valor. Cada par só é renderizado se o valor não for `null`. Parcelas aparecem como "65 pagas, 55 restantes" e, se `pastDue > 0`, uma linha destacada "N em atraso". Se só `total` vier, mostra "N parcelas". Sem detalhes expansíveis: a lista é curta e todos os dados cabem no cartão.

**4. Rótulo de `kind` por mapa fixo.**
`LOAN` → "Empréstimo", `FINANCING` → "Financiamento", `INVOICE_FINANCING` → "Financiamento de fatura", `UNARRANGED_ACCOUNT_OVERDRAFT` → "Cheque especial", e qualquer outro valor (incluindo `UNKNOWN` e um valor novo que a API passe a enviar) → "Outro". O tipo no TypeScript é `string`, não união fechada, para um valor novo não quebrar a tela. `type` (texto do Open Finance) não é exibido: são dezenas de valores em maiúsculas sem tradução.

**5. Correção de `formatDate` para datas sem hora.**
Se a string casar com `^\d{4}-\d{2}-\d{2}$`, montar a data com `new Date(ano, mês - 1, dia)` (meia-noite local) antes de formatar. Qualquer outra string segue o caminho atual, então telas existentes não mudam. Alternativa descartada: passar `timeZone: 'UTC'` ao formatar, que erraria datas com hora.

**6. Tipos.**
`Loan` com `kind: string`, campos opcionais como `T | null`, `installments: LoanInstallments | null` e `lastPayment: LoanPayment | null`. `OwnerLoans` espelha `OwnerAccounts`, reaproveitando `OwnersResponse`.

**7. Fuso fixo nos testes.**
Para o teste de `formatDate` falhar de verdade no código antigo, a suíte precisa rodar a oeste de UTC. O `vite.config.ts` define `process.env.TZ = 'America/Sao_Paulo'` quando roda sob o Vitest, antes de os workers iniciarem (em `src/test/setup.ts` o `tsc` não reconhece `process`), o que torna o resultado igual na máquina local e na CI. Se isso alterar algum teste existente, o ajuste entra na mesma tarefa.

## Risks / Trade-offs

- [Formato real da Pluggy não conferido (tarefa 3.2 da API)] → Todo campo opcional é condicional. Um teste cobre o empréstimo só com campos obrigatórios.
- [Valor novo de `kind`] → Cai em "Outro", sem erro.
- [Moedas diferentes em empréstimos de donos distintos] → Cada valor usa o `currencyCode` do próprio empréstimo, e não há totais.
- [Mudar `formatDate` afeta todas as telas] → O novo ramo só pega strings `yyyy-mm-dd`, que nenhuma tela atual recebe, e a suíte existente continua passando.
