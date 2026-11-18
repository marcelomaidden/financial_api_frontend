import { http, HttpResponse } from 'msw'
import { server } from '../test/server'
import { fetchCombinedTransactions } from './transactions'

const origin = window.location.origin

function mock(seen: URL[], accounts: 'ok' | 'fail' = 'ok') {
  server.use(
    http.get(`${origin}/api/transactions`, ({ request }) => {
      seen.push(new URL(request.url))
      return HttpResponse.json({ transactions: [], partial: false, errors: [] })
    }),
    http.get(`${origin}/api/accounts`, () =>
      accounts === 'ok'
        ? HttpResponse.json({
            owners: [{ owner: 'marcelo', accounts: [{ id: 'a1', type: 'BANK', name: 'Nubank' }], error: null }],
          })
        : HttpResponse.json({ status: 502, error: 'x', message: 'x' }, { status: 502 }),
    ),
  )
}

const range = { dateFrom: '2026-11-01', dateTo: '2026-11-30' }

describe('fetchCombinedTransactions', () => {
  it('sem filtro não envia owner nem accountId e não tem conta filtrada', async () => {
    const seen: URL[] = []
    mock(seen)
    const result = await fetchCombinedTransactions(range)
    expect(seen[0].searchParams.has('owner')).toBe(false)
    expect(seen[0].searchParams.has('accountId')).toBe(false)
    expect(result.filteredAccountName).toBeNull()
  })

  it('com filtro envia owner, accountId e as datas, e devolve o nome da conta', async () => {
    const seen: URL[] = []
    mock(seen)
    const result = await fetchCombinedTransactions(range, { owner: 'marcelo', accountId: 'a1' })
    expect(seen[0].searchParams.get('owner')).toBe('marcelo')
    expect(seen[0].searchParams.get('accountId')).toBe('a1')
    expect(seen[0].searchParams.get('dateFrom')).toBe('2026-11-01')
    expect(seen[0].searchParams.get('dateTo')).toBe('2026-11-30')
    expect(result.filteredAccountName).toBe('Nubank')
  })

  it('usa o id da conta filtrada quando a listagem de contas falha', async () => {
    const seen: URL[] = []
    mock(seen, 'fail')
    const result = await fetchCombinedTransactions(range, { owner: 'marcelo', accountId: 'a1' })
    expect(result.filteredAccountName).toBe('a1')
  })
})
