import { http, HttpResponse } from 'msw'
import { server } from '../test/server'
import { ApiRequestError } from './client'
import {
  fetchAccounts,
  fetchBills,
  fetchCreditCards,
  fetchLoans,
  fetchSummary,
  fetchTransactions,
} from './endpoints'
import { accountsFixture, creditCardsFixture, loansFixture, summaryFixture } from './fixtures'

const origin = window.location.origin

describe('exemplos do README (tipos e leitura)', () => {
  it('lê o resumo, contas e cartões de exemplo', async () => {
    server.use(
      http.get(`${origin}/api/summary`, () => HttpResponse.json(summaryFixture)),
      http.get(`${origin}/api/accounts`, () => HttpResponse.json(accountsFixture)),
      http.get(`${origin}/api/credit-cards`, () => HttpResponse.json(creditCardsFixture)),
    )

    const summary = await fetchSummary()
    expect(summary.partial).toBe(true)
    expect(summary.expenses.transactions.detail.marcelo[2].installment).toEqual({ number: 3, total: 10 })
    expect(summary.expenses.transactions.detail.marcelo[0].amountInAccountCurrency).toBe(298.19)

    const accounts = await fetchAccounts()
    expect(accounts.owners[1].error?.status).toBe(502)

    const cards = await fetchCreditCards()
    expect(cards.owners[0].creditCards[0].brand).toBe('VISA')
  })
})

describe('empréstimos', () => {
  it('chama /loans sem owner e lê o exemplo', async () => {
    let url!: URL
    server.use(
      http.get(`${origin}/api/loans`, ({ request }) => {
        url = new URL(request.url)
        return HttpResponse.json(loansFixture)
      }),
    )
    const loans = await fetchLoans()
    expect(url.pathname).toBe('/api/loans')
    expect(url.search).toBe('')
    expect(loans.owners[0].loans[0].installments).toEqual({ total: 120, paid: 65, remaining: 55, pastDue: 0 })
    expect(loans.owners[1].error?.status).toBe(502)
  })

  it('converte o 502 em ApiRequestError', async () => {
    server.use(
      http.get(`${origin}/api/loans`, () =>
        HttpResponse.json({ status: 502, error: 'Bad Gateway', message: 'Pluggy fora' }, { status: 502 }),
      ),
    )
    const error = await fetchLoans().catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiRequestError)
    expect(error).toMatchObject({ status: 502, message: 'Pluggy fora' })
  })
})

describe('tratamento de erros', () => {
  it.each([400, 404, 429, 502, 504])('converte o erro %i da API em ApiRequestError', async (status) => {
    server.use(
      http.get(`${origin}/api/accounts`, () =>
        HttpResponse.json({ status, error: 'Erro', message: `mensagem ${status}` }, { status }),
      ),
    )
    const error = await fetchAccounts().catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiRequestError)
    expect(error).toMatchObject({ status, message: `mensagem ${status}` })
  })

  it('usa mensagem genérica quando o corpo não é o formato da API', async () => {
    server.use(http.get(`${origin}/api/accounts`, () => new HttpResponse('boom', { status: 500 })))
    await expect(fetchAccounts()).rejects.toMatchObject({ status: 500, message: 'Erro 500 ao consultar a API.' })
  })

  it('converte erro de rede em ApiRequestError com status 0', async () => {
    server.use(http.get(`${origin}/api/accounts`, () => HttpResponse.error()))
    await expect(fetchAccounts()).rejects.toMatchObject({ status: 0 })
  })
})

describe('parâmetros das consultas', () => {
  it('envia dateFrom e dateTo no resumo e omite os ausentes', async () => {
    const urls: URL[] = []
    server.use(
      http.get(`${origin}/api/summary`, ({ request }) => {
        urls.push(new URL(request.url))
        return HttpResponse.json(summaryFixture)
      }),
    )
    await fetchSummary({ dateFrom: '2026-11-01', dateTo: '2026-11-30' })
    await fetchSummary()
    expect(urls[0].searchParams.get('dateFrom')).toBe('2026-11-01')
    expect(urls[0].searchParams.get('dateTo')).toBe('2026-11-30')
    expect(urls[1].search).toBe('')
  })

  it('envia owner, accountId e datas em /transactions', async () => {
    let url!: URL
    server.use(
      http.get(`${origin}/api/transactions`, ({ request }) => {
        url = new URL(request.url)
        return HttpResponse.json({ transactions: [], partial: false, errors: [] })
      }),
    )
    await fetchTransactions({ owner: 'marcelo', accountId: 'a 1', dateFrom: '2026-11-01', dateTo: '2026-11-30' })
    expect(url.pathname).toBe('/api/transactions')
    expect(url.searchParams.get('owner')).toBe('marcelo')
    expect(url.searchParams.get('accountId')).toBe('a 1')
    expect(url.searchParams.get('dateFrom')).toBe('2026-11-01')
    expect(url.searchParams.get('dateTo')).toBe('2026-11-30')
  })

  it('não envia parâmetros omitidos em /transactions', async () => {
    let url!: URL
    server.use(
      http.get(`${origin}/api/transactions`, ({ request }) => {
        url = new URL(request.url)
        return HttpResponse.json({ transactions: [], partial: false, errors: [] })
      }),
    )
    await fetchTransactions()
    expect(url.search).toBe('')
  })

  it('envia page e pageSize nas faturas', async () => {
    let url!: URL
    server.use(
      http.get(`${origin}/api/owners/:owner/accounts/:accountId/bills`, ({ request }) => {
        url = new URL(request.url)
        return HttpResponse.json({ owner: 'm', accountId: 'c1', bills: [], page: 2, totalPages: 3 })
      }),
    )
    await fetchBills('m', 'c1', 2, 12)
    expect(url.searchParams.get('page')).toBe('2')
    expect(url.searchParams.get('pageSize')).toBe('12')
  })
})
