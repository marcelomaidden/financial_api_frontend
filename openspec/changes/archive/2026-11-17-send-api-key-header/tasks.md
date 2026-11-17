# Tasks

## 1. Envio da chave no cliente HTTP

- [x] 1.1 Em `src/api/client.ts`, ler `VITE_API_KEY` na carga do módulo com `trim()` e enviar `X-API-Key` em `getJson` só quando houver valor. Verificar com `npx tsc -b` sem erros.
- [x] 1.2 Em `src/api/endpoints.test.ts` (ou arquivo de teste do cliente), cobrir com MSW, usando `vi.stubEnv` e recarga do módulo: chave presente envia o cabeçalho, variável ausente e em branco não enviam, e o cabeçalho vai nas rotas de resumo, contas, cartões, faturas, transações e empréstimos. Verificar com `npm test` passando.
- [x] 1.3 Cobrir o 401: a resposta `{status: 401, error: 'Unauthorized', message}` vira `ApiRequestError` com a `message`, e nenhuma mensagem de erro contém o valor da chave. Verificar com `npm test` passando.

## 2. Documentação e configuração

- [x] 2.1 Acrescentar `VITE_API_KEY` ao `.env.example`, sem valor real e com comentário de que é lida no build. Verificar que o arquivo não contém segredo.
- [x] 2.2 No `README.md`, documentar `VITE_API_KEY` na tabela de variáveis, corrigir "não configura CORS" e "A API não tem autenticação", e avisar que `heroku config:set` não regenera o bundle e exige novo deploy. Verificar relendo o README: nenhum trecho antigo contradiz a API.

## 3. Verificação final

- [x] 3.1 Rodar `npm run lint`, `npm test` e `npm run build` e verificar que os três passam.
- [ ] 3.2 Com a chave configurada no Heroku e um deploy novo, abrir o front e confirmar no navegador que as chamadas enviam `X-API-Key`, que o preflight responde 200 e que as telas carregam sem 401.

## Workflow follow-up

- Arquivar a change depois da revisão do projeto.
