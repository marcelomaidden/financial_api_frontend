import { summaryFixture } from '../api/fixtures'
import type { IncomeTransaction } from '../api/types'
import { groupByAccount, toCents } from './groupByAccount'

function income(overrides: Partial<IncomeTransaction> & Pick<IncomeTransaction, 'id'>): IncomeTransaction {
  return {
    description: `entrada ${overrides.id}`,
    amount: 10,
    currencyCode: 'BRL',
    date: '2026-11-05T10:00:00Z',
    accountId: 'a1',
    ...overrides,
  }
}

/** A regra das entradas: a API garante BRL, então soma o `amount`. */
const incomeOptions = {
  accountId: (item: IncomeTransaction) => item.accountId,
  date: (item: IncomeTransaction) => item.date,
  cents: (item: IncomeTransaction) => toCents(item.amount),
}

describe('groupByAccount com a regra das entradas', () => {
  it('soma o amount em centavos, sem erro de ponto flutuante', () => {
    const [group] = groupByAccount(
      { marcelo: [income({ id: 'a', amount: 0.57 }), income({ id: 'b', amount: 1.15 })] },
      incomeOptions,
    )
    expect(group.subtotal).toBe(1.72)
    expect(group.excludedCount).toBe(0)
    expect(group.items).toHaveLength(2)
  })

  it('a soma dos grupos é igual ao total do resumo de exemplo', () => {
    const { total, detail } = summaryFixture.incomes.transactions
    const groups = groupByAccount(detail, incomeOptions)
    expect(groups).toHaveLength(1)
    expect(groups[0]).toMatchObject({ key: 'marcelo:a1', owner: 'marcelo', accountId: 'a1', subtotal: 19.99 })
    const sumInCents = groups.reduce((sum, group) => sum + toCents(group.subtotal), 0)
    expect(sumInCents).toBe(toCents(total.value))
  })

  it('ordena os grupos pelo maior subtotal e desempata pela ordem de chegada', () => {
    const groups = groupByAccount(
      {
        marcelo: [
          income({ id: 'a', accountId: 'pequena', amount: 50 }),
          income({ id: 'b', accountId: 'grande', amount: 400 }),
          income({ id: 'c', accountId: 'empate1', amount: 70 }),
        ],
        luana: [income({ id: 'd', accountId: 'empate2', amount: 70 })],
      },
      incomeOptions,
    )
    expect(groups.map((group) => group.accountId)).toEqual(['grande', 'empate1', 'empate2', 'pequena'])
  })

  it('ordena as entradas de cada grupo da mais recente para a mais antiga', () => {
    const [group] = groupByAccount(
      {
        marcelo: [
          income({ id: 'nov5', date: '2026-11-05T10:00:00Z' }),
          income({ id: 'set6', date: '2026-09-06T10:00:00Z' }),
          income({ id: 'nov6', date: '2026-11-06T10:00:00Z' }),
        ],
      },
      incomeOptions,
    )
    expect(group.items.map((item) => item.id)).toEqual(['nov6', 'nov5', 'set6'])
  })

  it('manda data inválida para o fim, sem embaralhar as outras', () => {
    const [group] = groupByAccount(
      {
        marcelo: [
          income({ id: 'ruim1', date: 'não é data' }),
          income({ id: 'antiga', date: '2026-09-06T10:00:00Z' }),
          income({ id: 'ruim2', date: '' }),
          income({ id: 'nova', date: '2026-11-06T10:00:00Z' }),
        ],
      },
      incomeOptions,
    )
    expect(group.items.map((item) => item.id)).toEqual(['nova', 'antiga', 'ruim1', 'ruim2'])
  })

  it('separa o mesmo accountId de donos diferentes', () => {
    const groups = groupByAccount(
      {
        marcelo: [income({ id: 'a', accountId: 'a1', amount: 10 }), income({ id: 'b', accountId: 'a2', amount: 20 })],
        luana: [income({ id: 'c', accountId: 'a1', amount: 30 })],
      },
      incomeOptions,
    )
    expect(groups.map((group) => group.key).sort()).toEqual(['luana:a1', 'marcelo:a1', 'marcelo:a2'])
    expect(groups.find((group) => group.key === 'luana:a1')?.items.map((item) => item.id)).toEqual(['c'])
    expect(groups.find((group) => group.key === 'marcelo:a1')?.items.map((item) => item.id)).toEqual(['a'])
  })

  it('conta como excluído o item cujo cents é null, sem somá-lo', () => {
    const [group] = groupByAccount(
      { marcelo: [income({ id: 'a', amount: 10 }), income({ id: 'b', amount: 99 })] },
      { ...incomeOptions, cents: (item) => (item.id === 'b' ? null : toCents(item.amount)) },
    )
    expect(group.subtotal).toBe(10)
    expect(group.excludedCount).toBe(1)
    expect(group.items).toHaveLength(2)
  })

  it('não altera a lista recebida e devolve lista vazia sem itens', () => {
    const detail = {
      marcelo: [income({ id: 'a', date: '2026-09-06T10:00:00Z' }), income({ id: 'b', date: '2026-11-06T10:00:00Z' })],
    }
    groupByAccount(detail, incomeOptions)
    expect(detail.marcelo.map((item) => item.id)).toEqual(['a', 'b'])
    expect(groupByAccount({}, incomeOptions)).toEqual([])
    expect(groupByAccount({ marcelo: [] }, incomeOptions)).toEqual([])
  })
})
