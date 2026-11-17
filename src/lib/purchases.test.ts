import { summaryFixture } from '../api/fixtures'
import type { ExpenseTransaction } from '../api/types'
import { groupPurchases } from './purchases'

function purchase(overrides: Partial<ExpenseTransaction> & Pick<ExpenseTransaction, 'id'>): ExpenseTransaction {
  return {
    accountId: 'c1',
    description: `compra ${overrides.id}`,
    currencyCode: 'BRL',
    amount: 10,
    date: '2026-11-05T10:00:00Z',
    category: null,
    ...overrides,
  }
}

describe('groupPurchases', () => {
  it('soma compras em BRL e em dólar pelo valor na moeda da conta', () => {
    const [group] = groupPurchases({
      marcelo: [
        purchase({ id: 'a', amount: 30 }),
        purchase({ id: 'b', amount: 150 }),
        purchase({ id: 'c', currencyCode: 'USD', amount: 58, amountInAccountCurrency: 298.19 }),
      ],
    })
    expect(group.subtotal).toBe(478.19)
    expect(group.excludedCount).toBe(0)
    expect(group.purchases).toHaveLength(3)
  })

  it('soma em centavos, sem erro de ponto flutuante', () => {
    const [group] = groupPurchases({
      marcelo: [purchase({ id: 'a', amount: 0.57 }), purchase({ id: 'b', amount: 1.15 })],
    })
    expect(group.subtotal).toBe(1.72)
  })

  it('a soma dos grupos é igual ao total do resumo de exemplo', () => {
    const { total, detail } = summaryFixture.expenses.transactions
    const groups = groupPurchases(detail)
    expect(groups).toHaveLength(1)
    expect(groups[0]).toMatchObject({ key: 'marcelo:c1', owner: 'marcelo', accountId: 'c1', subtotal: 478.19 })
    const sumInCents = groups.reduce((sum, group) => sum + Math.round(group.subtotal * 100), 0)
    expect(sumInCents).toBe(Math.round(total.value * 100))
  })

  it('deixa a compra estrangeira sem valor em BRL na lista e fora do subtotal', () => {
    const [group] = groupPurchases({
      marcelo: [
        purchase({ id: 'a', amount: 30 }),
        purchase({ id: 'b', currencyCode: 'USD', amount: 58 }),
        purchase({ id: 'c', currencyCode: 'EUR', amount: 10 }),
      ],
    })
    expect(group.subtotal).toBe(30)
    expect(group.excludedCount).toBe(2)
    expect(group.purchases).toHaveLength(3)
  })

  it('ordena os grupos pelo maior subtotal', () => {
    const groups = groupPurchases({
      marcelo: [purchase({ id: 'a', accountId: 'pequeno', amount: 100 }), purchase({ id: 'b', accountId: 'grande', amount: 400 })],
    })
    expect(groups.map((group) => group.accountId)).toEqual(['grande', 'pequeno'])
  })

  it('em empate de subtotal, mantém a ordem de chegada', () => {
    const groups = groupPurchases({
      marcelo: [purchase({ id: 'a', accountId: 'primeiro', amount: 50 }), purchase({ id: 'b', accountId: 'segundo', amount: 50 })],
      luana: [purchase({ id: 'c', accountId: 'terceiro', amount: 50 })],
    })
    expect(groups.map((group) => group.accountId)).toEqual(['primeiro', 'segundo', 'terceiro'])
  })

  it('ordena as compras de cada grupo da mais recente para a mais antiga', () => {
    const [group] = groupPurchases({
      marcelo: [
        purchase({ id: 'nov5', date: '2026-11-05T10:00:00Z' }),
        purchase({ id: 'set6', date: '2026-09-06T10:00:00Z' }),
        purchase({ id: 'nov6', date: '2026-11-06T10:00:00Z' }),
      ],
    })
    expect(group.purchases.map((p) => p.id)).toEqual(['nov6', 'nov5', 'set6'])
  })

  it('manda data inválida para o fim, sem embaralhar as outras', () => {
    const [group] = groupPurchases({
      marcelo: [
        purchase({ id: 'ruim1', date: 'não é data' }),
        purchase({ id: 'antiga', date: '2026-09-06T10:00:00Z' }),
        purchase({ id: 'ruim2', date: '' }),
        purchase({ id: 'nova', date: '2026-11-06T10:00:00Z' }),
      ],
    })
    expect(group.purchases.map((p) => p.id)).toEqual(['nova', 'antiga', 'ruim1', 'ruim2'])
  })

  it('separa o mesmo accountId de donos diferentes e de cartões diferentes', () => {
    const groups = groupPurchases({
      marcelo: [purchase({ id: 'a', accountId: 'c1', amount: 10 }), purchase({ id: 'b', accountId: 'c2', amount: 20 })],
      luana: [purchase({ id: 'c', accountId: 'c1', amount: 30 })],
    })
    expect(groups.map((group) => group.key).sort()).toEqual(['luana:c1', 'marcelo:c1', 'marcelo:c2'])
    expect(groups.find((group) => group.key === 'luana:c1')?.purchases.map((p) => p.id)).toEqual(['c'])
    expect(groups.find((group) => group.key === 'marcelo:c1')?.purchases.map((p) => p.id)).toEqual(['a'])
  })

  it('não altera a lista recebida', () => {
    const detail = {
      marcelo: [purchase({ id: 'a', date: '2026-09-06T10:00:00Z' }), purchase({ id: 'b', date: '2026-11-06T10:00:00Z' })],
    }
    groupPurchases(detail)
    expect(detail.marcelo.map((p) => p.id)).toEqual(['a', 'b'])
  })

  it('devolve lista vazia sem compras', () => {
    expect(groupPurchases({})).toEqual([])
    expect(groupPurchases({ marcelo: [] })).toEqual([])
  })
})
