## ADDED Requirements

### Requirement: Credencial obrigatória para abrir a SPA
O sistema SHALL exigir usuário e senha por HTTP Basic Auth em toda requisição à SPA publicada, incluindo a página inicial, os arquivos do bundle e as rotas da SPA acessadas diretamente ou recarregadas. O sistema SHALL responder 401 com o cabeçalho `WWW-Authenticate` do tipo Basic quando a credencial estiver ausente ou errada, e SHALL NOT entregar nenhum conteúdo da SPA nesse caso.

#### Scenario: Sem credencial
- **WHEN** um cliente pede a página inicial sem credencial
- **THEN** o sistema responde 401 com `WWW-Authenticate` do tipo Basic e sem o conteúdo da SPA

#### Scenario: Credencial errada
- **WHEN** um cliente envia usuário ou senha diferentes dos configurados
- **THEN** o sistema responde 401 e não entrega o conteúdo

#### Scenario: Credencial correta
- **WHEN** um cliente envia o usuário e a senha configurados
- **THEN** o sistema entrega a página da SPA normalmente

#### Scenario: Arquivos do bundle
- **WHEN** um cliente pede um arquivo do bundle (script ou estilo) sem credencial
- **THEN** o sistema responde 401, e o bundle com a chave de API não é entregue

#### Scenario: Rota da SPA recarregada
- **WHEN** um cliente pede diretamente `/accounts` sem credencial
- **THEN** o sistema responde 401, e não devolve a página da SPA

### Requirement: Credencial vinda do ambiente
O sistema SHALL ler o usuário de `BASIC_AUTH_USER` e a senha de `BASIC_AUTH_PASSWORD`, e SHALL NOT guardá-los no repositório. O sistema SHALL aceitar uma única credencial. O sistema SHALL NOT registrar a senha em logs.

#### Scenario: Variáveis definidas
- **WHEN** o app inicia com as duas variáveis definidas
- **THEN** a credencial configurada passa a valer para o acesso à SPA

#### Scenario: Senha com caracteres especiais
- **WHEN** a senha contém espaços, aspas ou `$`
- **THEN** o acesso com essa mesma senha funciona, e o acesso com qualquer outra é recusado

#### Scenario: Troca de credencial
- **WHEN** o valor de uma das variáveis muda e o app reinicia
- **THEN** a credencial nova vale e a antiga é recusada, sem novo build

### Requirement: Falha fechada sem credencial configurada
O sistema SHALL recusar a inicialização quando `BASIC_AUTH_USER` ou `BASIC_AUTH_PASSWORD` estiver ausente ou em branco, ou quando o usuário contiver `:`. A mensagem de erro SHALL citar a variável ou a regra violada e SHALL NOT exibir valores.

#### Scenario: Variável ausente
- **WHEN** o app inicia sem `BASIC_AUTH_USER` ou sem `BASIC_AUTH_PASSWORD`
- **THEN** o app não sobe, e o log cita o nome da variável ausente

#### Scenario: Variável em branco
- **WHEN** uma das variáveis está definida só com espaços ou vazia
- **THEN** o app não sobe, e o log cita o nome da variável

#### Scenario: Usuário com dois-pontos
- **WHEN** `BASIC_AUTH_USER` contém `:`
- **THEN** o app não sobe, e o log explica a regra sem exibir o valor

#### Scenario: Valores fora do log
- **WHEN** o app recusa subir por qualquer um desses motivos
- **THEN** o log não contém o usuário nem a senha

### Requirement: Credencial só por conexão segura
O sistema SHALL redirecionar para https toda requisição feita por http, antes de pedir a credencial, de modo que a senha não trafegue em texto aberto.

#### Scenario: Acesso por http
- **WHEN** um cliente pede a SPA por http
- **THEN** o sistema responde com redirecionamento para https, sem desafio de credencial
