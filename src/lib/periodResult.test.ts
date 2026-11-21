import { periodResult } from './periodResult'

const move = (accountId: string, amount: number) => ({ accountId, amount })

describe('periodResult', () => {
  it('anula a transferência entre contas dos donos: uma conta fica positiva, a outra negativa, total zero', () => {
    const result = periodResult({ luana: [move('i1', 1000)] }, { marcelo: [move('n1', 1000)] })

    expect(result.total).toBe(0)
    expect(result.accounts).toEqual([
      { key: 'luana:i1', owner: 'luana', accountId: 'i1', incoming: 1000, outgoing: 0, result: 1000 },
      { key: 'marcelo:n1', owner: 'marcelo', accountId: 'n1', incoming: 0, outgoing: 1000, result: -1000 },
    ])
  })

  it('junta entradas e saídas da mesma conta numa linha', () => {
    const result = periodResult({ marcelo: [move('a1', 600), move('a1', 400)] }, { marcelo: [move('a1', 300)] })

    expect(result.accounts).toEqual([
      { key: 'marcelo:a1', owner: 'marcelo', accountId: 'a1', incoming: 1000, outgoing: 300, result: 700 },
    ])
    expect(result.total).toBe(700)
  })

  it('mostra zero no lado sem movimento', () => {
    const onlyOut = periodResult({}, { marcelo: [move('a1', 50)] })
    expect(onlyOut.accounts[0]).toMatchObject({ incoming: 0, outgoing: 50, result: -50 })

    const onlyIn = periodResult({ marcelo: [move('a1', 50)] }, {})
    expect(onlyIn.accounts[0]).toMatchObject({ incoming: 50, outgoing: 0, result: 50 })
  })

  it('separa contas de mesmo accountId em donos diferentes', () => {
    const result = periodResult({ marcelo: [move('a1', 10)], luana: [move('a1', 20)] }, {})
    expect(result.accounts.map((account) => account.key)).toEqual(['luana:a1', 'marcelo:a1'])
  })

  it('ordena pelo resultado, do maior para o menor', () => {
    const result = periodResult(
      { marcelo: [move('a', 700), move('c', 800)] },
      { marcelo: [move('b', 200)] },
    )
    expect(result.accounts.map((account) => account.result)).toEqual([800, 700, -200])
  })

  it('no empate mantém a ordem de chegada: entradas primeiro, depois contas só com saídas', () => {
    const result = periodResult(
      { marcelo: [move('x', 100), move('x', -100), move('y', 0)] },
      { luana: [move('z', 0)] },
    )
    expect(result.accounts.map((account) => account.accountId)).toEqual(['x', 'y', 'z'])
  })

  it('soma em centavos: o total é exatamente a soma das linhas', () => {
    const result = periodResult(
      { marcelo: [move('a1', 0.1), move('a1', 0.2)], luana: [move('b1', 19.99)] },
      { marcelo: [move('a1', 0.3)], luana: [move('b1', 42.5)] },
    )
    expect(result.accounts.find((account) => account.key === 'marcelo:a1')!.result).toBe(0)
    expect(result.total).toBe(-22.51)
    const cents = result.accounts.reduce((sum, account) => sum + Math.round(account.result * 100), 0)
    expect(cents).toBe(Math.round(result.total * 100))
  })

  it('devolve total zero e nenhuma conta sem movimento', () => {
    expect(periodResult({}, {})).toEqual({ total: 0, accounts: [] })
    expect(periodResult({ marcelo: [] }, { luana: [] })).toEqual({ total: 0, accounts: [] })
  })
})
