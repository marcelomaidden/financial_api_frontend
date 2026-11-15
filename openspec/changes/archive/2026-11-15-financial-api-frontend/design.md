# Design

## Context

A `financial_api` é somente leitura, sem autenticação e sem CORS, e roda em `localhost:8080`. Ela não tem OpenAPI (sem springdoc), então os tipos TypeScript saem do README e dos DTOs em `financial_api/src/main/java/.../resource/dto`. O `id` de uma conta só vale para o dono que o devolveu, e as transações e faturas são consultadas por conta. Motivação e escopo: ver `proposal.md`.

## Goals / Non-Goals

**Goals:**
- SPA simples, local, que mostra a visão combinada dos donos.
- Tipos da API escritos à mão em um só módulo, para a visão combinada não depender de detalhes de cada rota.

**Non-Goals:**
- Filtro por dono, autenticação, escrita, SSR, mudanças na API.

## Decisions

- **Vite + React + TypeScript, sem roteador de servidor.** Alternativa: Next.js. Não há SSR nem segredo a esconder, então Vite é mais simples. Rotas de página com React Router (`/`, `/accounts`, `/transactions`).
- **TanStack Query para dados.** Dá cache, estado de carregamento/erro e refetch. Alternativa: `useEffect` com `fetch`, que repete essa lógica em cada tela.
- **Proxy do Vite para a API** (`/api` → `http://localhost:8080`, removendo o prefixo). Evita CORS sem tocar na API. A URL base vem de `VITE_API_BASE_URL` e o padrão é `/api`.
- **A junção por dono fica no frontend.** O `/summary`, `/accounts` e `/credit-cards` já combinam donos. As transações exigem uma consulta por conta: o frontend lista as contas, busca cada uma em paralelo, segue o `nextCursor` até o fim e junta e ordena por data. Alternativa: criar um endpoint combinado na API, fora do escopo desta change.
- **Tipos escritos à mão** a partir dos DTOs. Alternativa: gerar de OpenAPI, que a API não tem.
- **Tailwind CSS para estilo, Recharts só se um gráfico for necessário.** Esta versão mostra totais e tabelas; gráficos ficam para depois.
- **Testes com Vitest e Testing Library**, com a API simulada por MSW.

## Risks / Trade-offs

- [Muitas contas e muitas páginas deixam a tela de transações lenta] → Buscar contas em paralelo, usar o período do mês por padrão e mostrar o progresso.
- [A API pode limitar requisições da Pluggy (429)] → Limitar a concorrência das consultas por conta e mostrar o erro por conta.
- [Tipos escritos à mão podem divergir da API] → Concentrar em um módulo e cobrir o formato com testes de contrato usando o JSON de exemplo do README.
- [API sem autenticação] → Uso local ou em rede confiável; documentar no README.
- [O resumo ignora o período em `expenses.transactions`] → Mostrar essa parte como "estado atual", como a API documenta.
