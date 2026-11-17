## ADDED Requirements

### Requirement: Chave de API em toda chamada
A SPA SHALL enviar o cabeçalho `X-API-Key` em toda requisição à API, com o valor da chave configurada no build. A chave SHALL vir da variável de ambiente `VITE_API_KEY`.

#### Scenario: Chave configurada
- **WHEN** `VITE_API_KEY` tem um valor no build e a SPA chama qualquer rota da API
- **THEN** a requisição leva `X-API-Key` com esse valor

#### Scenario: Todas as rotas
- **WHEN** a SPA chama o resumo, as contas, os cartões, as faturas, as transações e os empréstimos
- **THEN** todas as requisições levam `X-API-Key`

### Requirement: Chave não configurada
A SPA SHALL omitir o cabeçalho `X-API-Key` quando `VITE_API_KEY` estiver ausente ou em branco, e SHALL seguir com a chamada. A SPA SHALL NOT enviar um cabeçalho vazio.

#### Scenario: Variável ausente
- **WHEN** `VITE_API_KEY` não está definida no build e a SPA chama a API
- **THEN** a requisição não leva `X-API-Key`

#### Scenario: Variável em branco
- **WHEN** `VITE_API_KEY` está definida só com espaços ou vazia
- **THEN** a requisição não leva `X-API-Key`

### Requirement: Recusa de acesso visível ao usuário
A SPA SHALL mostrar a mensagem do corpo da resposta quando a API responder 401, no mesmo tratamento dos demais erros da API. A SPA SHALL NOT exibir o valor da chave em tela.

#### Scenario: Chave ausente ou errada
- **WHEN** a API responde 401 com `{status, error, message}`
- **THEN** a tela mostra a `message` recebida, como nos outros erros

#### Scenario: Chave fora da tela e das mensagens
- **WHEN** uma chamada falha por qualquer motivo
- **THEN** nenhuma mensagem de erro exibida contém o valor de `VITE_API_KEY`
