# financial-api-frontend

SPA em React + TypeScript (Vite) que consome a [`financial_api`](../financial_api) somente
para leitura e mostra a situação financeira de todos os donos de forma combinada.

## Requisitos

- Node.js 20 ou superior e npm.
- `financial_api` rodando (padrão `http://localhost:8080`). Veja o README dela.

## Variáveis de ambiente

| Variável | Uso |
|---|---|
| `VITE_API_BASE_URL` | URL base que a SPA usa para chamar a API. Padrão `/api` |
| `API_PROXY_TARGET` | Só em desenvolvimento: destino do proxy do Vite. Padrão `http://localhost:8080` |

Copie `.env.example` para `.env` para alterar `VITE_API_BASE_URL`.

## Comandos

```sh
npm install
npm run dev     # servidor de desenvolvimento em http://localhost:5173
npm run build   # verificação de tipos e build de produção em dist/
npm test        # testes (Vitest)
```

## Como a SPA fala com a API

A API usa a porta 8080 e não configura CORS. Em desenvolvimento, o Vite serve a SPA na
porta 5173 e repassa `/api/*` para a API (removendo o prefixo `/api`), então o navegador
só fala com a própria origem.

Em produção não há esse proxy. Sirva `dist/` e a API sob o mesmo domínio (por exemplo,
um nginx que encaminha `/api` para a API) ou habilite CORS na `financial_api`.

## Telas

| Rota | O que mostra |
|---|---|
| `/` | Visão geral: totais do período (`/summary`) |
| `/accounts` | Contas, cartões e faturas |
| `/transactions` | Transações de todas as contas |
| `/loans` | Empréstimos e financiamentos, com saldo para quitar, parcelas e último pagamento |

## Limitações

- A API não tem autenticação. Use em rede local ou confiável.
- Visão somente leitura e combinada, sem filtro por dono.
- Empréstimos: a API não informa o valor da parcela mensal, e a tela não soma saldos. Os empréstimos ainda não entram na visão geral.
