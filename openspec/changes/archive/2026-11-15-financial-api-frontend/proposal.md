# Proposal

## Why

A `financial_api` (Spring Boot) expõe contas, cartões, transações, faturas e um resumo
de Marcelo e Luana, mas só por HTTP. Não há tela para consultar esses dados. O uso
principal é ver a situação financeira dos dois juntos, em uma visão combinada.

## What Changes

- Criar uma SPA em React + TypeScript (Vite) neste repositório, que consome a `financial_api` somente para leitura.
- Tela de visão geral com o resumo do período (`/summary`): saldo disponível, entradas, faturas a pagar e compras do cartão sem fatura, somados entre os donos.
- Tela de contas e cartões (`/accounts`, `/credit-cards`) com todos os donos juntos. O dono aparece como etiqueta em cada item, sem filtro por dono nesta versão.
- Tela de transações combinadas: junta as transações de todas as contas de todos os donos em uma lista única por período, e mostra as faturas de cada cartão.
- Exibir erros parciais da API (`partial`, `errors`, `error` por dono) sem esconder os dados dos donos que responderam.

Fora do escopo: login, escrita de dados, criação de itens Pluggy, seletor ou filtro por dono, alterações na `financial_api`.

## Capabilities

### New Capabilities
- `combined-overview`: visão geral do período com o resumo somado dos donos e aviso de dados parciais.
- `combined-accounts`: lista de contas bancárias e cartões de todos os donos, com saldo e faturas.
- `combined-transactions`: lista única de transações de todas as contas no período, ordenada por data.

### Modified Capabilities

Nenhuma.

## Impact

- Código novo neste repositório (projeto Vite, componentes, cliente da API). Nenhum código existente muda.
- Dependência de runtime: `financial_api` acessível por HTTP (porta padrão do Spring, 8080).
- A `financial_api` não configura CORS. Em desenvolvimento, o proxy do Vite evita a necessidade. Em produção, frontend e API devem ficar sob o mesmo domínio.
- A API não tem autenticação. A SPA não deve ser exposta fora de rede confiável.
