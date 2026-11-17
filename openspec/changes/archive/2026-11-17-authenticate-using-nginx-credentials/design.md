# Design

## Context

Estado atual, observado no repositório:
- O `Procfile` tem `web: bin/start-nginx-static`. Esse script do buildpack roda `erb config/nginx.conf.erb > config/nginx.conf` e depois `bin/nginx -p . -c config/nginx.conf`, com `set -e`. O `erb` roda a cada início do dyno, então `ENV` está disponível, como já acontece com `PORT`.
- `config/nginx.conf.erb` serve `/app/dist` e já redireciona http para https com um `if` no nível do `server`. O `location /` contém `error_page 404 = /index.html;` para as rotas da SPA.
- Não existe pasta `bin/` no projeto. O nginx serve só o que está em `/app/dist`.

Motivação e escopo: veja proposal.md. Requisitos: veja specs/spa-access-control/spec.md.

## Goals / Non-Goals

**Goals:**
- A credencial nunca entra no repositório e muda sem rebuild.
- Esquecer a configuração impede o app de subir, em vez de deixá-lo aberto.

**Non-Goals:**
- Não proteger a chave de quem tem a senha.
- Não mexer na API, no CORS nem no código da SPA.

## Decisions

**1. `auth_basic` do nginx com um arquivo de senhas gerado na subida.**
O `location /` ganha `auth_basic "Restrito";` e `auth_basic_user_file /app/.htpasswd;`. O arquivo fica em `/app`, fora do document root (`/app/dist`), então não é servido. Alternativas descartadas: (a) o `if` sobre `$http_authorization` com o base64 no `.erb`, que foge do padrão e herda as armadilhas do `if` do nginx; (b) escrever o arquivo de dentro do `.erb`, que dá efeito colateral a um template e esconde a lógica de quem lê a configuração.

**2. Um script de geração, rodado antes do nginx.**
`bin/gen-htpasswd` é um script em Ruby, e o `Procfile` passa a ser `web: bin/gen-htpasswd && bin/start-nginx-static`. O `&&` impede o nginx de subir se o script falhar. Ruby foi escolhido porque o `erb` do buildpack já exige Ruby no dyno, e porque lê `ENV` e chama programas sem passar pelo shell, o que evita problemas de aspas e `$` na senha. O arquivo é recriado a cada início, então trocar a senha e reiniciar basta.

**3. Hash da senha com `openssl passwd -apr1`, chamado sem shell.**
O script chama `openssl passwd -apr1 -stdin` com `Open3` e entrega a senha pela entrada padrão, sem colocá-la na linha de comando nem no log. O resultado `usuario:hash` é gravado no arquivo, com permissão `0600`. O formato `apr1` é aceito pelo `auth_basic`. Se o dyno não tiver `openssl`, a alternativa é gravar `usuario:{PLAIN}senha`, que o nginx também aceita. A senha já está em texto na config var, então o ganho do hash é pequeno, e o formato `{PLAIN}` fica como saída caso a tarefa de verificação mostre que não há `openssl`.

**4. Falha fechada, validada antes de gerar o arquivo.**
O script confere, nesta ordem: `BASIC_AUTH_USER` presente e não vazio, `BASIC_AUTH_PASSWORD` presente e não vazia (após `strip`), e usuário sem `:`. Qualquer falha termina com `abort` e uma mensagem que cita a variável ou a regra, sem valores, e com saída diferente de zero. O dyno cai, e o motivo aparece nos logs. A mensagem de erro nunca interpola o valor das variáveis.

**5. A ordem das fases do nginx mantém o redirecionamento antes do desafio.**
O `if` do redirecionamento para https roda na fase de rewrite, antes da fase de acesso onde o `auth_basic` decide. Assim, uma requisição http recebe 301 e a credencial só é pedida por https.

**6. A rota da SPA recarregada continua protegida.**
O `error_page 404 = /index.html` faz um redirecionamento interno dentro do mesmo `location /`, que herda o `auth_basic`. Uma requisição sem credencial a `/accounts` recebe 401 na fase de acesso, antes de o nginx chegar ao 404.

**7. Como verificar.**
Localmente: rodar o script com variáveis de teste e checar o arquivo gerado (formato, permissão e ausência de valores no log), rodar com cada variável faltando e checar o erro, e renderizar o `.erb` com `erb` e validar com `nginx -t` se o nginx estiver instalado. No Heroku: `curl` sem credencial (401 e `WWW-Authenticate`), com credencial errada (401) e correta (200), http (301), `/accounts` e um arquivo do bundle sem credencial (401), e subida sem a variável (dyno cai com a mensagem).

## Risks / Trade-offs

- [Ruby ou `openssl` podem não existir no dyno] → Há uma tarefa para conferir com `heroku run` antes de implementar a geração. Sem `openssl`, usa-se `{PLAIN}` (decisão 3).
- [Quem tem a senha vê a chave de API no bundle] → Limite aceito e documentado. O Basic Auth protege contra quem só conhece a URL.
- [O navegador guarda a credencial até fechar, e não há logout] → Aceito.
- [Sem limite de tentativas, a senha pode sofrer força bruta] → Registrado como fora de escopo. Uma senha longa e aleatória reduz o risco, e `limit_req` pode vir depois.
- [O script sem permissão de execução no repositório quebra o dyno] → Commitar com o modo executável e conferir no checkout.
- [Esquecer as variáveis derruba o app, o que é o comportamento desejado, mas pode surpreender num deploy] → A mensagem do log cita a variável, e o README lista as duas.

## Migration Plan

1. Definir `BASIC_AUTH_USER` e `BASIC_AUTH_PASSWORD` na app do front no Heroku antes do deploy. Sem elas o dyno não sobe.
2. Fazer o deploy e conferir os cenários de verificação (decisão 7).
3. Rollback: reverter o commit e o deploy. As variáveis podem ficar definidas, sem efeito.
