# Design

## Context

Estado atual, observado no código:
- `src/api/client.ts` é o único ponto de saída HTTP. `getJson` chama `fetch(buildUrl(path, params), { signal })` e todos os endpoints (`endpoints.ts`, `transactions.ts`) passam por ele. A URL base é lida uma vez, na carga do módulo, de `import.meta.env.VITE_API_BASE_URL`.
- Erros viram `ApiRequestError` com a `message` do corpo `{status, error, message}`. Um 401 da API já segue esse caminho.
- Os testes usam MSW (`src/test/server.ts`) e chamam as funções reais de `endpoints.ts`.

Motivação e escopo: veja proposal.md. Requisitos: veja specs/api-access/spec.md.

## Goals / Non-Goals

**Goals:**
- Um único lugar injeta o cabeçalho, para que nenhum endpoint novo o esqueça.

**Non-Goals:**
- Esconder a chave. O Vite a embute no bundle público, e a API já aceitou esse limite.
- Mudar o tratamento de erros: o 401 usa o caminho existente.

## Decisions

**1. O cabeçalho é montado em `getJson`, e a chave é lida na carga do módulo.**
Como `VITE_API_BASE_URL`, `client.ts` lê `import.meta.env.VITE_API_KEY` uma vez, aplica `trim()` e guarda o resultado. Se o texto for vazio, nenhum cabeçalho é enviado. Se houver valor, `getJson` passa `headers: { 'X-API-Key': apiKey }` ao `fetch`. Alternativa descartada: um wrapper de `fetch` ou um interceptor. Existe um só ponto de chamada, então a camada extra não ajuda.

**2. Omitir, e não falhar, quando a chave falta.**
Decidido na exploração: espelha a API, onde a chave é opcional em desenvolvimento, e mantém o desenvolvimento local e os testes atuais funcionando sem configuração. Em produção, a falta da chave aparece como 401 com a mensagem da API na tela. Alternativa descartada: falhar no build ou na carga, que exige tratamento diferente por ambiente.

**3. Preflight.**
O cabeçalho `X-API-Key` é personalizado, então o navegador envia um `OPTIONS` antes de cada `GET` de outra origem. A API já autoriza esse cabeçalho e responde o preflight sem exigir a chave. Em desenvolvimento a chamada é de mesma origem, pelo proxy do Vite, e o proxy repassa o cabeçalho.

**4. Testes.**
Como a chave é lida na carga do módulo, os testes de "com chave" e "sem chave" definem a variável com `vi.stubEnv` e recarregam o módulo (`vi.resetModules` e `import()` dinâmico). Os handlers MSW inspecionam `request.headers`. Os testes existentes continuam sem chave e não mudam.

## Risks / Trade-offs

- [A chave fica legível no bundle público] → Limite aceito e registrado na API. A chave barra quem chama a API direto, e não quem abre o front.
- [`heroku config:set VITE_API_KEY` só reinicia o dyno, e o bundle antigo continua em uso] → O README manda fazer um novo deploy (por exemplo, `git commit --allow-empty` e push). A variável precisa existir antes do build.
- [Chave errada ou esquecida em produção só aparece como 401 em tempo de uso] → Aceito. A mensagem da API aparece na tela, e o README explica a causa.
- [A chave no `.env` local pode ser commitada por engano] → Só o `.env.example` entra no repositório, sem valor real. Confirmar que `.env` está no `.gitignore`.

## Migration Plan

1. Publicar o front com esta mudança, com `VITE_API_KEY` já definida na app do front no Heroku, igual a `APP_API_KEY` da API.
2. Ordem em relação à API: a API nova só aceita chamadas com a chave. Fazer o deploy do front antes de a API nova entrar em produção (ou junto) evita uma janela de 401. Se a API já estiver no ar, o front fica em 401 até este deploy.
3. Rollback: reverter o commit. O front antigo volta a não enviar o cabeçalho.
