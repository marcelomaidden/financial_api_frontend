## MODIFIED Requirements

### Requirement: Chave de API em toda chamada
A SPA SHALL enviar o cabeçalho `X-API-Key` em toda requisição à API, com o valor da chave configurada no build. A chave SHALL vir da variável de ambiente `VITE_API_KEY`.

#### Scenario: Chave configurada
- **WHEN** `VITE_API_KEY` tem um valor no build e a SPA chama qualquer rota da API
- **THEN** a requisição leva `X-API-Key` com esse valor

#### Scenario: Todas as rotas
- **WHEN** a SPA chama o resumo, as contas, os cartões, as faturas, o detalhe da fatura, as transações e os empréstimos
- **THEN** todas as requisições levam `X-API-Key`
