# Tasks

## 1. Verificar o ambiente do dyno

- [x] 1.1 Rodar `heroku run "which ruby openssl erb" -a <app-frontend>` e verificar que as três ferramentas existem. Se `openssl` faltar, registrar no design.md que a geração usa o formato `{PLAIN}` (decisão 3) antes de seguir para o grupo 2.

## 2. Script de geração do arquivo de senhas

- [x] 2.1 Criar `bin/gen-htpasswd` (Ruby, executável) conforme as decisões 2 a 4: valida `BASIC_AUTH_USER`, `BASIC_AUTH_PASSWORD` e a ausência de `:` no usuário, e grava `/app/.htpasswd` com permissão `0600`. Verificar rodando com valores de teste e conferindo o arquivo gerado. Verificar também que `git ls-files -s bin/gen-htpasswd` mostra o modo `100755`.
- [x] 2.2 Cobrir com um teste automatizado, que roda o script em um diretório temporário e checa, sem exibir valores: variável ausente, variável em branco, usuário com `:`, senha com espaços, aspas e `$`, e que a saída e o log não contêm a senha. Verificar com `npm test` passando.
- [x] 2.3 Acrescentar o arquivo de senhas gerado ao `.gitignore`. Verificar com `git check-ignore -v .htpasswd`.

## 3. Configuração do nginx e do Procfile

- [x] 3.1 Em `config/nginx.conf.erb`, ativar `auth_basic` e `auth_basic_user_file` no `location /`, mantendo o redirecionamento para https e o `error_page 404 = /index.html`. Verificar renderizando o `.erb` com `erb` e, se o nginx estiver instalado, rodando `nginx -t` na configuração gerada.
- [x] 3.2 Alterar o `Procfile` para `web: bin/gen-htpasswd && bin/start-nginx-static`. Verificar que o conteúdo está correto e que uma falha do script impede a segunda parte (simulando com uma variável faltando).

## 4. Documentação

- [x] 4.1 No `README.md`, documentar `BASIC_AUTH_USER` e `BASIC_AUTH_PASSWORD` (obrigatórias, falha fechada, restrição do `:`), que a troca não exige rebuild, e atualizar "Limitações" com o que o Basic Auth não cobre (quem tem a senha vê a chave, sem logout, sem limite de tentativas). Verificar relendo o README: nada contradiz o comportamento da spec.

## 5. Verificação final

- [x] 5.1 Rodar `npm run lint`, `npm test` e `npm run build` e verificar que os três passam.
- [ ] 5.2 No Heroku, com as variáveis definidas e um deploy novo, conferir com `curl` e no navegador: sem credencial dá 401 com `WWW-Authenticate`, credencial errada dá 401, credencial correta dá 200, http redireciona para https, `/accounts` e um arquivo do bundle sem credencial dão 401, e a SPA carrega e consulta a API depois do login.
- [ ] 5.3 No Heroku, remover uma das variáveis e verificar que o dyno não sobe, que o log cita o nome da variável e que não contém valores. Restaurar a variável em seguida.

## Workflow follow-up

- Arquivar a change depois da revisão do projeto.
