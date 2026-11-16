## Purpose

Garantir que lint, testes e build rodem automaticamente em todo pull request e em todo push na `master`, e que a falha de qualquer um apareça no PR.

## ADDED Requirements

### Requirement: Verificações automáticas em pull requests
O sistema SHALL executar, a cada pull request aberto ou atualizado, a instalação das dependências a partir do `package-lock.json`, o lint, os testes e o build de produção, e SHALL reportar o resultado como um check do PR.

#### Scenario: PR aberto
- **WHEN** um pull request é aberto contra a `master`
- **THEN** o workflow roda a instalação, o lint, os testes e o build, e o PR mostra o resultado

#### Scenario: Novo commit no PR
- **WHEN** um commit novo é enviado a um PR já aberto
- **THEN** o workflow roda de novo sobre o código atualizado

### Requirement: Falha de qualquer passo reprova o check
O sistema SHALL marcar o check como falho quando a instalação, o lint, os testes ou o build falharem, e SHALL interromper os passos seguintes.

#### Scenario: Teste falhando
- **WHEN** um teste do PR falha
- **THEN** o check do PR fica vermelho e o build não roda

#### Scenario: Erro de tipo
- **WHEN** o PR introduz um erro de tipo que o lint e os testes não detectam
- **THEN** o passo de build falha e o check do PR fica vermelho

#### Scenario: Tudo passa
- **WHEN** instalação, lint, testes e build concluem sem erro
- **THEN** o check do PR fica verde

### Requirement: Verificação de commits na master
O sistema SHALL executar as mesmas verificações a cada push na `master`.

#### Scenario: Commit direto na master
- **WHEN** um commit é enviado direto à `master`, sem pull request
- **THEN** o workflow roda as mesmas verificações e reporta o resultado no commit

### Requirement: Ambiente compatível com as dependências
O sistema SHALL executar as verificações em uma versão do Node.js que satisfaça as exigências das dependências do projeto, e a documentação SHALL informar essa mesma versão mínima.

#### Scenario: Versão do Node
- **WHEN** o workflow prepara o ambiente
- **THEN** ele usa uma versão do Node.js aceita por `vite`, `vitest`, `jsdom` e `msw`, e o README cita a mesma versão mínima

### Requirement: Permissões mínimas
O sistema SHALL conceder ao workflow apenas permissão de leitura do conteúdo do repositório e SHALL NOT usar segredos nem executar código de PRs de forks com permissões ampliadas.

#### Scenario: PR de fork
- **WHEN** um PR vem de um fork
- **THEN** o workflow roda com permissão somente de leitura e sem acesso a segredos
