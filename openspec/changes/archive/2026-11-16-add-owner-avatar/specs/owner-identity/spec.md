# Spec Delta

## Purpose
Definir como a interface identifica o dono de cada conta, cartão, empréstimo e transação, de modo que seja reconhecível rapidamente e acessível sem depender só da cor.

## ADDED Requirements

### Requirement: Avatar do dono
O sistema SHALL identificar o dono de cada item por um avatar circular com a inicial do nome do dono, e SHALL expor o nome completo como texto acessível e como dica ao passar o mouse.

#### Scenario: Avatar de um dono
- **WHEN** um item do dono `luana` é exibido
- **THEN** o avatar mostra a inicial "L", e o nome `luana` está disponível no rótulo acessível e na dica de hover

### Requirement: Cor do dono
O sistema SHALL usar uma cor fixa para cada dono conhecido, a mesma em todas as telas, e uma cor neutra para um dono sem cor definida. A paleta SHALL evitar verde e vermelho, usados para entrada e saída.

#### Scenario: Mesmo dono em telas diferentes
- **WHEN** o mesmo dono aparece em Contas e em Transações
- **THEN** o avatar tem a mesma cor nas duas telas

#### Scenario: Dono desconhecido
- **WHEN** um dono sem cor definida aparece em uma lista
- **THEN** o avatar usa a cor neutra e mostra a inicial do nome

### Requirement: Nome visível onde há espaço
O sistema SHALL mostrar o nome do dono escrito ao lado do avatar nas telas de Contas e Empréstimos, e SHALL mostrar só o avatar na Visão geral e nas Transações.

#### Scenario: Tela de Contas
- **WHEN** uma conta é exibida na tela de Contas
- **THEN** o avatar e o nome do dono aparecem juntos

#### Scenario: Tela de Transações
- **WHEN** uma transação é exibida na tela de Transações
- **THEN** só o avatar identifica o dono, e o nome fica no rótulo acessível e na dica
