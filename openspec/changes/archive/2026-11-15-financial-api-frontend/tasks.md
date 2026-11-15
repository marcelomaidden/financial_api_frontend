# Tasks

## 1. Projeto base

- [x] 1.1 Criar o projeto Vite + React + TypeScript na raiz e verificar que `npm run build` conclui sem erros
- [x] 1.2 Adicionar React Router, TanStack Query, Tailwind CSS, Vitest, Testing Library e MSW, e verificar que `npm test` roda um teste de exemplo
- [x] 1.3 Configurar o proxy `/api` do Vite para `http://localhost:8080` e `VITE_API_BASE_URL`, e verificar com a API no ar que `curl localhost:5173/api/accounts` responde
- [x] 1.4 Criar o `README.md` com requisitos, variáveis e comandos (`dev`, `build`, `test`), e verificar que os comandos documentados funcionam

## 2. Cliente da API

- [x] 2.1 Definir em um módulo os tipos de `/summary`, `/accounts`, `/credit-cards`, transações e faturas a partir dos DTOs da `financial_api`, e verificar com testes que os JSON de exemplo do README são aceitos
- [x] 2.2 Implementar o cliente HTTP com tratamento do formato de erro `{status, error, message}`, e verificar com testes de 400, 404, 429, 502 e 504 e erro de rede
- [x] 2.3 Implementar funções de busca (resumo, contas, cartões, faturas, transações com `nextCursor`) e verificar com testes MSW que `after` e as datas saem na URL correta

## 3. Layout e navegação

- [x] 3.1 Criar o layout com navegação entre Visão geral, Contas e Transações, e os componentes de carregamento, erro com "tentar de novo" e aviso parcial, e verificar com testes de componente

## 4. Visão geral (`combined-overview`)

- [x] 4.1 Implementar a tela com seletor de período e os quatro totais, e verificar com testes dos cenários "período padrão" e "período escolhido"
- [x] 4.2 Implementar o detalhe por dono, parcelas e valor em BRL de compras estrangeiras, e verificar com testes dos cenários do spec
- [x] 4.3 Implementar o aviso de `partial` e o estado de falha total, e verificar com testes de `partial: true` e de 502

## 5. Contas e cartões (`combined-accounts`)

- [x] 5.1 Implementar a lista combinada com etiqueta de dono e erro por dono, e verificar com testes de um dono com `error`
- [x] 5.2 Implementar a lista de faturas de um cartão com paginação, e verificar com testes de abertura e de próxima página

## 6. Transações (`combined-transactions`)

- [x] 6.1 Implementar a busca por conta com concorrência limitada, seguindo `nextCursor`, e verificar com testes de conta com várias páginas
- [x] 6.2 Implementar a lista única ordenada por data com dono e conta, e o seletor de período (mês corrente por padrão), e verificar com testes de ordenação e de mudança de período
- [x] 6.3 Implementar o aviso de contas que falharam, e verificar com um teste em que uma conta retorna erro

## 7. Integração

- [ ] 7.1 Rodar a SPA contra a `financial_api` local e verificar manualmente as três telas com dados reais, e registrar no README as limitações (sem autenticação, mesmo domínio em produção)
