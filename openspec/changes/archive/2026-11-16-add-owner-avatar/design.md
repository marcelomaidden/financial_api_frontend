# Design

## Context

`OwnerBadge` é usado em quatro telas (`TransactionsPage`, `OverviewPage`, `AccountsPage`, `LoansPage`), com uma só cor. Os donos vêm da API como texto. Hoje existem `marcelo` e `luana`, e a lista é definida na configuração da API. Motivação em proposal.md.

Os testes de Contas, Empréstimos, Visão geral e Transações procuram o nome do dono por texto (`getByText('marcelo')`).

## Goals / Non-Goals

**Goals:**
- Um só componente decide a aparência do dono em todas as telas.
- O nome do dono continua acessível sem depender da cor.

**Non-Goals:**
- Cor configurável pelo usuário, e borda colorida na linha.
- Cor automática por hash do nome.

## Decisions

**1. Um componente `OwnerAvatar` no lugar de `OwnerBadge`.**
Recebe `owner` e `showName` (padrão `false`). O arquivo é renomeado, e os quatro pontos de uso importam o novo nome. Alternativa descartada: manter `OwnerBadge` e criar o avatar ao lado, o que deixaria dois componentes para o mesmo conceito.

**2. Cor por mapa fixo, com cor neutra de reserva.**
Um mapa `dono → classes de cor` no próprio componente, com `marcelo` em azul e `luana` em roxo, e cinza para os demais. Alternativas: hash do nome para uma paleta, que funciona com qualquer dono mas não permite escolher a cor, e ordem de listagem, que muda a cor se a ordem mudar. O mapa é o mais previsível para dois donos, e o hash só vale se surgirem muitos donos. A comparação do nome ignora maiúsculas e minúsculas.

**3. Cores sem verde e sem vermelho, com os dois temas.**
Cada cor define as classes do tema claro e do escuro (`dark:`), como o restante do projeto. Evitar verde e vermelho impede que o avatar seja lido como entrada ou saída.

**4. Acessibilidade.**
O avatar é um `span` com `role="img"`, `aria-label` com o nome do dono e `title` com o mesmo texto. A inicial fica `aria-hidden`. Com `showName`, o nome aparece como texto ao lado, e o avatar fica `aria-hidden` para o leitor de tela não ler o nome duas vezes.

**5. Nome escrito em Contas e Empréstimos.**
Essas telas têm espaço, e o `title` não funciona ao toque. Por isso `showName` é usado nelas, e os testes de Contas e Empréstimos que procuram o texto do dono continuam valendo. A Visão geral e as Transações usam só o avatar, e seus testes passam a procurar o `img` pelo nome.

## Risks / Trade-offs

- [Duas pessoas com a mesma inicial] → Hoje não ocorre. Se ocorrer, a cor distingue um dono conhecido, e o `title` e o `aria-label` trazem o nome.
- [Nome do dono fixo no código do FE] → Um dono novo aparece em cinza até alguém editar o mapa. Aceito para o porte atual.
- [Na Visão geral e nas Transações o nome só aparece no hover, e não em telas de toque] → O leitor de tela lê o `aria-label`. Se o toque importar, `showName` pode ser ativado nessas telas.
- [A cor do avatar pode ter pouco contraste em um dos temas] → A tarefa de verificação confere os dois temas.

## Verificação visual

Conferida pelo usuário em 2026-11-16 nas quatro telas, com a aparência aprovada. O registro não detalha o contraste de cada tema.
