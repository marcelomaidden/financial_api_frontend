# Design

## Context

Veja proposal.md (Why e What Changes). Estado observado:
- `.github/workflows/` só tem `copilot-setup-steps.yml`, gerado pelo OpenSpec. Ele não roda lint nem testes.
- Scripts em `package.json`: `lint` (`oxlint`), `test` (`vitest run`) e `build` (`tsc -b && vite build`). O `package-lock.json` está versionado.
- O branch principal do repositório é `master` (`git branch -a`). O remoto é `github.com:marcelomaidden/financial_api_frontend`.
- Exigências de Node das dependências instaladas: `vite` e `oxlint` pedem `^20.19.0 || >=22.12.0`, mas `vitest` pede `^22.12.0 || ^24.0.0 || >=26.0.0`, `jsdom` pede `^22.22.2 || ^24.15.0 || >=26.0.0` e `msw` pede `>=22.12.0`. Logo o README, que diz "Node.js 20 ou superior", está errado para rodar os testes.
- O fuso dos testes é fixado em `vite.config.ts` só quando `process.env.VITEST` existe, então não depende do fuso da máquina.

## Goals / Non-Goals

**Goals:**
- Um único workflow simples que reprova o PR quando lint, testes ou build falham.
- Mesmo comportamento no runner e na máquina local.

**Non-Goals:**
- Sem matriz de versões do Node, sem cache de build e sem cobertura de código. O projeto é pequeno (o build leva menos de 1 s).
- Sem proteção de branch por código: é configuração do repositório.

## Decisions

**1. Um workflow `.github/workflows/ci.yml` com um único job `ci`.**
Os passos são sequenciais e curtos, então um job evita repetir checkout e instalação. Alternativa descartada: jobs separados para lint, testes e build, que paralelizam mas instalam as dependências três vezes e levam mais tempo total para um projeto deste tamanho.

**2. Gatilhos: `pull_request` e `push` em `master`.**
`pull_request` roda em `opened`, `synchronize` e `reopened` por padrão, o que cobre abrir e atualizar o PR. O `push` em `master` pega commits diretos. Não usar `pull_request_target`, que roda com segredos e permissões ampliadas sobre código de forks.

**3. Node 24 (LTS).**
Satisfaz todas as exigências acima (`^24.15.0` para o `jsdom`) e é a versão de suporte longo. A versão é fixada em `node-version: 24` no `actions/setup-node`, com `cache: npm`. Alternativa descartada: ler `.nvmrc`, que o projeto não tem e que não vale criar só para isso.

**4. Ordem dos passos: `npm ci`, `lint`, `test`, `build`.**
O mais barato e que mais falha vai primeiro. `npm ci` instala exatamente o `package-lock.json` e falha se ele divergir do `package.json`. O build vai por último e é o único que checa tipos. Cada passo falho interrompe os seguintes, que é o comportamento padrão do Actions.

**5. Permissões e ações fixadas.**
`permissions: contents: read` no nível do workflow. `actions/checkout` e `actions/setup-node` na versão maior estável (`@v4`), como o workflow já existente. Sem segredos.

**6. `concurrency` por ref com cancelamento.**
Um novo push no mesmo PR cancela a execução anterior, para não gastar minutos em um commit já ultrapassado. Vale só para `pull_request`: em `master` toda execução deve terminar, então o cancelamento é condicionado ao evento.

**7. README.**
Corrigir o requisito para "Node.js 22.22 ou superior (o CI usa 24)", e acrescentar uma seção curta "Integração contínua" dizendo o que o workflow roda e que o check precisa ser marcado como obrigatório em Settings, Branches, para bloquear o merge.

## Risks / Trade-offs

- [O workflow não bloqueia o merge sozinho] → Documentado no README como passo manual de proteção de branch.
- [Fuso ou comportamento diferente no runner (UTC)] → O fuso é fixado no `vite.config.ts` para testes. A primeira execução no GitHub confirma, e eu não consigo rodar o Actions daqui.
- [Versão do Node 24 mais nova que a do desenvolvedor] → O mínimo documentado é 22.22, e o CI usa 24 só por ser a LTS. Se surgir diferença, vira uma matriz em outra change.
- [Passo de build além do pedido] → Premissa assumida na proposta, fácil de remover.
- [Não dá para validar o workflow localmente] → Verificar a sintaxe do YAML e rodar os mesmos quatro comandos à mão. A confirmação real vem do primeiro PR.
