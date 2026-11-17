# Proposal

## Why

A SPA publicada no Heroku é aberta a qualquer pessoa que conheça a URL. Como a chave de API fica no JavaScript do bundle (`VITE_API_KEY`), quem abre o front vê a chave e os dados. A `financial_api` já registrou esse limite como fora de escopo e indicou a saída: pedir senha no front. O nginx do buildpack `heroku-community/nginx` já serve a SPA e permite Basic Auth sem mudar o código da SPA.

## What Changes

- Todo acesso à SPA (a página, os arquivos do bundle e as rotas `/accounts`, `/transactions`, `/loans` recarregadas) passa a exigir usuário e senha por HTTP Basic Auth, aplicado pelo nginx.
- Existe uma só credencial, compartilhada. Ela vem das config vars `BASIC_AUTH_USER` e `BASIC_AUTH_PASSWORD`, e não do repositório.
- Na subida do dyno, um passo gera o arquivo de senhas a partir dessas variáveis, e o nginx só sobe depois disso.
- Se uma das variáveis faltar ou estiver em branco, ou se o usuário contiver `:`, o dyno não sobe e o motivo aparece nos logs, sem exibir valores. Esquecer a configuração não deixa o app público.
- Trocar a senha é `heroku config:set` e o reinício do dyno. Não exige novo build nem novo deploy, ao contrário do `VITE_API_KEY`.
- O README documenta as variáveis e o comportamento.
- Fora de escopo:
  - uma credencial por pessoa, login com sessão ou logout;
  - limite de tentativas;
  - esconder a chave de quem tem a senha: quem se autentica ainda vê a chave no bundle;
  - mudanças na API, no CORS ou no código da SPA;
  - o desenvolvimento local (o servidor do Vite não passa pelo nginx).

## Capabilities

### New Capabilities
- `spa-access-control`: quem pode abrir a SPA publicada. Cobre a exigência de credencial, a origem da credencial no ambiente e a recusa de subir sem ela.

### Modified Capabilities

## Impact

- Código e configuração: `config/nginx.conf.erb` (checagem de acesso), `Procfile` (geração do arquivo antes do nginx), um script novo de geração, `.gitignore` (o arquivo de senhas gerado não é versionado).
- Ambiente: config vars novas `BASIC_AUTH_USER` e `BASIC_AUTH_PASSWORD` na app do front no Heroku, obrigatórias.
- A API e as chamadas da SPA à API não mudam. A SPA chama a API em outra origem, e o navegador não envia a credencial do Basic Auth para lá.
- Verificação: só no Heroku, porque o buildpack roda lá. A geração do arquivo e a renderização do `.erb` podem ser testadas localmente em parte.
- Documentação: `README.md`.
