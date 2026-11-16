# Proposal

## Why

Hoje nada verifica um pull request: `npm run lint`, `npm test` e `npm run build` só rodam se quem abre o PR lembrar de rodá-los. Um PR que quebra os testes ou os tipos pode ser mesclado sem ninguém perceber.

## What Changes

- Novo workflow do GitHub Actions que roda quando um PR é aberto ou atualizado, e também em push na `master`, executando `npm ci`, `npm run lint`, `npm test` e `npm run build`. O PR fica com um check verde ou vermelho.
- O `npm run build` entra além do pedido (lint e testes) porque ele roda `tsc -b`, e nem o lint nem o Vitest checam tipos. Premissa registrada: se não quiser, é só remover o passo.
- O push na `master` entra para pegar commits que não passaram por PR. Premissa registrada.
- O README passa a pedir Node.js 22.22 ou superior, no lugar de "20 ou superior", porque as dependências de teste (`vitest`, `jsdom`, `msw`) exigem isso. O CI usa a mesma versão.
- O README documenta o workflow e o passo manual de marcar o check como obrigatório na proteção da branch.

Fora do escopo:
- Validar o OpenSpec (`openspec validate`) no CI.
- Teste de contrato contra a `financial_api` real.
- Deploy, comentários automáticos no PR e revisão automática.
- Configurar a proteção da branch (é uma configuração do repositório, fora do código).

## Capabilities

### New Capabilities
- `pull-request-checks`: todo PR e todo push na `master` passam por lint, testes e build automáticos, e a falha de qualquer um é visível no PR.

### Modified Capabilities

Nenhuma. Os specs existentes descrevem telas da SPA e não mudam.

## Impact

- Arquivos: novo `.github/workflows/ci.yml` e ajustes no `README.md`. Nenhum código da SPA muda.
- Dependências: nenhuma nova. O workflow usa `actions/checkout` e `actions/setup-node`.
- Risco: o `vite.config.ts` fixa o fuso dos testes só sob o Vitest, então o resultado deve ser igual no runner (UTC). Isso só se confirma na primeira execução.
- Risco: o workflow sozinho não impede o merge. Só a proteção da branch faz isso.
