import type { IncomeAccount, OwedBill } from '../api/types'
import { accountsByBalance, flattenDetail, owedBillsByDueDate } from './orderRows'

function bill(overrides: Partial<OwedBill> & Pick<OwedBill, 'id'>): OwedBill {
  return {
    accountId: 'c1',
    name: `Cartão ${overrides.id}`,
    dueDate: '2026-11-20T00:00:00',
    totalAmount: 100,
    currencyCode: 'BRL',
    ...overrides,
  }
}

describe('flattenDetail', () => {
  it('junta os donos na ordem em que o resumo chegou', () => {
    const rows = flattenDetail({ marcelo: [bill({ id: 'a' }), bill({ id: 'b' })], luana: [bill({ id: 'c' })] })
    expect(rows.map(({ owner, item }) => `${owner}:${item.id}`)).toEqual(['marcelo:a', 'marcelo:b', 'luana:c'])
  })

  it('devolve lista vazia sem itens', () => {
    expect(flattenDetail({})).toEqual([])
    expect(flattenDetail({ marcelo: [] })).toEqual([])
  })
})

describe('owedBillsByDueDate', () => {
  it('ordena pelo vencimento, o primeiro a vencer no topo, entre donos', () => {
    const rows = owedBillsByDueDate({
      marcelo: [bill({ id: 'dia25', dueDate: '2026-11-25T00:00:00' }), bill({ id: 'dia10', dueDate: '2026-11-10T00:00:00' })],
      luana: [bill({ id: 'dia20', dueDate: '2026-11-20T00:00:00' })],
    })
    expect(rows.map(({ item }) => item.id)).toEqual(['dia10', 'dia20', 'dia25'])
    expect(rows[0].owner).toBe('marcelo')
    expect(rows[1].owner).toBe('luana')
  })

  it('mantém a ordem de chegada quando o vencimento é o mesmo', () => {
    const rows = owedBillsByDueDate({
      marcelo: [bill({ id: 'a' }), bill({ id: 'b' })],
      luana: [bill({ id: 'c' })],
    })
    expect(rows.map(({ item }) => item.id)).toEqual(['a', 'b', 'c'])
  })

  it('manda vencimento inválido para o fim, sem embaralhar as outras', () => {
    const rows = owedBillsByDueDate({
      marcelo: [
        bill({ id: 'ruim1', dueDate: 'não é data' }),
        bill({ id: 'tarde', dueDate: '2026-12-01T00:00:00' }),
        bill({ id: 'ruim2', dueDate: '' }),
        bill({ id: 'cedo', dueDate: '2026-11-01T00:00:00' }),
      ],
    })
    expect(rows.map(({ item }) => item.id)).toEqual(['cedo', 'tarde', 'ruim1', 'ruim2'])
  })

  it('não altera a lista recebida', () => {
    const detail = {
      marcelo: [bill({ id: 'tarde', dueDate: '2026-12-01T00:00:00' }), bill({ id: 'cedo', dueDate: '2026-11-01T00:00:00' })],
    }
    owedBillsByDueDate(detail)
    expect(detail.marcelo.map((item) => item.id)).toEqual(['tarde', 'cedo'])
  })
})

describe('accountsByBalance', () => {
  function account(id: string, balance: number): IncomeAccount {
    return { id, name: `Conta ${id}`, balance, currencyCode: 'BRL' }
  }

  it('ordena pelo maior saldo primeiro, entre donos', () => {
    const rows = accountsByBalance({
      marcelo: [account('a', 100), account('b', 900)],
      luana: [account('c', 300)],
    })
    expect(rows.map(({ item }) => item.id)).toEqual(['b', 'c', 'a'])
    expect(rows[0].owner).toBe('marcelo')
    expect(rows[1].owner).toBe('luana')
  })

  it('põe o saldo negativo depois dos positivos', () => {
    const rows = accountsByBalance({ marcelo: [account('neg', -50), account('zero', 0), account('pos', 10)] })
    expect(rows.map(({ item }) => item.id)).toEqual(['pos', 'zero', 'neg'])
  })

  it('mantém a ordem de chegada em empate de saldo', () => {
    const rows = accountsByBalance({ marcelo: [account('a', 50), account('b', 50)], luana: [account('c', 50)] })
    expect(rows.map(({ item }) => item.id)).toEqual(['a', 'b', 'c'])
  })

  it('não altera a lista recebida e devolve lista vazia sem contas', () => {
    const detail = { marcelo: [account('a', 1), account('b', 2)] }
    accountsByBalance(detail)
    expect(detail.marcelo.map((item) => item.id)).toEqual(['a', 'b'])
    expect(accountsByBalance({})).toEqual([])
  })
})
