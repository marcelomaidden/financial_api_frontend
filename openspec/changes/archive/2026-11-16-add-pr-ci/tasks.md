# Tasks

## 1. Workflow de CI

- [x] 1.1 Criar `.github/workflows/ci.yml` com os gatilhos `pull_request` e `push` em `master`, `permissions: contents: read`, `concurrency` que cancela execuções antigas só em PR, e um job `ci` em `ubuntu-latest` com checkout, `setup-node` 24 com `cache: npm`, `npm ci`, `npm run lint`, `npm test` e `npm run build`, nessa ordem. Verificar que o YAML é válido (por exemplo com `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))"`), que a ordem e os gatilhos conferem com o spec, e que os quatro comandos do job passam à mão com `npm ci && npm run lint && npm test && npm run build`

## 2. Documentação

- [x] 2.1 Atualizar o `README.md`: trocar "Node.js 20 ou superior" por "Node.js 22.22 ou superior (o CI usa 24)" e acrescentar a seção "Integração contínua" com o que o workflow roda e o passo manual de marcar o check `ci` como obrigatório nas regras de proteção da branch `master`. Verificar relendo o README contra as exigências de `engines` de `vitest`, `jsdom` e `msw` e confirmando que a seção cita os gatilhos e os passos do workflow

## 3. Confirmação em ambiente real

- [ ] 3.1 Abrir um PR com este change e conferir no GitHub que o check `ci` roda, que os testes passam no runner (inclusive os de data, em fuso UTC) e que um commit seguinte no PR dispara uma nova execução. Verificar pelo status do check no PR. Se falhar por diferença de ambiente, registrar a causa no `design.md`
