import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { accountsFixture, creditCardsFixture } from '../api/fixtures'
import { renderWithProviders } from '../test/render'
import { server } from '../test/server'
import { AccountsPage } from './AccountsPage'

const origin = window.location.origin

function mockLists() {
  server.use(
    http.get(`${origin}/api/accounts`, () => HttpResponse.json(accountsFixture)),
    http.get(`${origin}/api/credit-cards`, () => HttpResponse.json(creditCardsFixture)),
  )
}

describe('AccountsPage', () => {
  it('lista contas e cartões sem filtrar por dono, com etiqueta do dono', async () => {
    const urls: URL[] = []
    server.use(
      http.get(`${origin}/api/accounts`, ({ request }) => {
        urls.push(new URL(request.url))
        return HttpResponse.json(accountsFixture)
      }),
      http.get(`${origin}/api/credit-cards`, ({ request }) => {
        urls.push(new URL(request.url))
        return HttpResponse.json(creditCardsFixture)
      }),
    )
    renderWithProviders(<AccountsPage />)

    const banks = await screen.findByRole('region', { name: 'Contas bancárias' })
    expect(await within(banks).findByText('Nubank')).toBeInTheDocument()
    expect(within(banks).getByText('marcelo')).toBeInTheDocument()
    const cards = await screen.findByRole('region', { name: 'Cartões de crédito' })
    expect(await within(cards).findByText('Cartão Nubank')).toBeInTheDocument()
    expect(urls.every((url) => !url.searchParams.has('owner'))).toBe(true)
  })

  it('mostra o erro de um dono sem ocultar os itens dos demais', async () => {
    mockLists()
    renderWithProviders(<AccountsPage />)

    expect(await screen.findByText('Nubank')).toBeInTheDocument()
    expect(await screen.findByRole('alert')).toHaveTextContent('luana: Erro ao consultar a Pluggy')
  })

  it('abre as faturas de um cartão usando dono e id da conta', async () => {
    mockLists()
    let url!: URL
    server.use(
      http.get(`${origin}/api/owners/:owner/accounts/:accountId/bills`, ({ request }) => {
        url = new URL(request.url)
        return HttpResponse.json({
          owner: 'marcelo',
          accountId: 'c1',
          bills: [{ id: 'b1', dueDate: '2026-11-20T00:00:00', closingDate: null, totalAmount: 250.4, currencyCode: 'BRL', minimumPaymentAmount: null }],
          page: 1,
          totalPages: 1,
        })
      }),
    )
    renderWithProviders(<AccountsPage />)

    await userEvent.click(await screen.findByRole('button', { name: /Ver faturas/ }))
    const bill = (await screen.findByText(/Vencimento 20\/11\/2026/)).closest('li')!
    expect(bill).toHaveTextContent(/250,40/)
    expect(url.pathname).toBe('/api/owners/marcelo/accounts/c1/bills')
  })

  it('carrega a página seguinte de faturas', async () => {
    mockLists()
    const pages: (string | null)[] = []
    server.use(
      http.get(`${origin}/api/owners/:owner/accounts/:accountId/bills`, ({ request }) => {
        const page = new URL(request.url).searchParams.get('page')
        pages.push(page)
        const n = Number(page ?? 1)
        return HttpResponse.json({
          owner: 'marcelo',
          accountId: 'c1',
          bills: [{ id: `b${n}`, dueDate: `2026-0${n}-10T00:00:00`, closingDate: null, totalAmount: 10 * n, currencyCode: 'BRL', minimumPaymentAmount: null }],
          page: n,
          totalPages: 2,
        })
      }),
    )
    renderWithProviders(<AccountsPage />)

    await userEvent.click(await screen.findByRole('button', { name: /Ver faturas/ }))
    expect(await screen.findByText(/Vencimento 10\/01\/2026/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Próxima página' }))
    expect(await screen.findByText(/Vencimento 10\/02\/2026/)).toBeInTheDocument()
    expect(pages).toEqual(['1', '2'])
  })

  it('mostra erro quando a consulta de contas falha por completo', async () => {
    server.use(
      http.get(`${origin}/api/accounts`, () =>
        HttpResponse.json({ status: 502, error: 'Bad Gateway', message: 'Pluggy fora' }, { status: 502 }),
      ),
      http.get(`${origin}/api/credit-cards`, () => HttpResponse.json(creditCardsFixture)),
    )
    renderWithProviders(<AccountsPage />)
    expect(await screen.findByText('Pluggy fora')).toBeInTheDocument()
    expect(await screen.findByText('Cartão Nubank')).toBeInTheDocument()
  })
})
