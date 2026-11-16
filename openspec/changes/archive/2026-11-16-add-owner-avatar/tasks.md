# Tasks

## 1. Componente

- [x] 1.1 Criar `OwnerAvatar` em `src/components/` no lugar de `OwnerBadge`, com a inicial, a cor por mapa fixo (`marcelo` azul, `luana` roxo, cinza para os demais, sem verde nem vermelho, com classes `dark:`), `role="img"`, `aria-label` e `title` com o nome, e a propriedade `showName`. Verificar com testes em `components.test.tsx`: inicial correta, cor igual para o mesmo dono, cor neutra para dono desconhecido, nome no rótulo e no `title`, e com `showName` o nome em texto e o avatar fora da árvore de acessibilidade

## 2. Telas

- [x] 2.1 Trocar `OwnerBadge` por `OwnerAvatar` com `showName` em `AccountsPage` e `LoansPage`. Verificar com `AccountsPage.test.tsx` e `LoansPage.test.tsx` passando, ainda procurando o nome do dono por texto
- [x] 2.2 Trocar `OwnerBadge` por `OwnerAvatar` sem nome em `TransactionsPage` e `OverviewPage`, e ajustar `TransactionsPage.test.tsx` e `OverviewPage.test.tsx` para procurar o dono pelo `img` com o nome. Verificar com esses testes passando
- [x] 2.3 Remover `OwnerBadge`. Verificar que `grep OwnerBadge src` não encontra nada e que `npm run lint`, `npm test` e `npm run build` passam

## 3. Integração

- [x] 3.1 Abrir as quatro telas nos temas claro e escuro e conferir o contraste e a legibilidade dos avatares, a mesma cor do dono entre as telas e o nome no hover. Verificar visualmente e registrar o resultado no design.md
