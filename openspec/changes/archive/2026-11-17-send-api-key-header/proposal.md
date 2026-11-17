# Proposal

## Why

A `financial_api` passou a exigir o cabeçalho `X-API-Key` em toda rota (change `adds-cors-and-api-key`, arquivada em 2026-11-17). A SPA não envia nenhum cabeçalho (`src/api/client.ts` chama `fetch(url, { signal })`), então toda chamada recebe 401 assim que a API nova for ao ar.

## What Changes

- A SPA envia `X-API-Key` em toda chamada à API, com o valor de `VITE_API_KEY`, lido no build do Vite como a `VITE_API_BASE_URL`.
- Sem `VITE_API_KEY` (ausente ou em branco), o cabeçalho é omitido e a chamada segue. Isso espelha a API, onde a chave é opcional em desenvolvimento. Em produção, esquecer a variável gera 401, e a tela mostra a mensagem da API.
- `.env.example` e `README` documentam `VITE_API_KEY`. O README também corrige dois trechos desatualizados ("não configura CORS" e "A API não tem autenticação") e avisa que `heroku config:set` sozinho não regenera o bundle: é preciso um novo deploy para a chave valer ou mudar.
- Fora de escopo:
  - proteger o próprio front. A chave fica no JavaScript do bundle público, e quem abrir o front vê os dados, o que a API já registrou como limite aceito;
  - rotação de chave, login e qualquer tela de configuração;
  - configurar CORS (já feito na API) e o deploy no Heroku.

## Capabilities

### New Capabilities
- `api-access`: como a SPA se identifica perante a API, ou seja, o envio da chave de API em toda chamada e o comportamento quando a chave não está configurada.

### Modified Capabilities

## Impact

- Código: `src/api/client.ts` (cabeçalho nas chamadas). Sem mudança nas telas, nos tipos nem nos endpoints.
- Ambiente: variável nova `VITE_API_KEY`, lida em tempo de build. Precisa existir antes do `npm run build` no Heroku.
- Testes: casos novos com MSW para o cabeçalho enviado, o cabeçalho ausente e o 401.
- Documentação: `README.md` e `.env.example`.
- Dependência da API: exige a `financial_api` com `X-API-Key` e CORS já publicados.
