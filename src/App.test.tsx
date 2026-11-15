import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import App from './App'
import { accountsFixture, creditCardsFixture, summaryFixture } from './api/fixtures'
import { renderWithProviders } from './test/render'
import { server } from './test/server'

describe('navegação', () => {
  beforeEach(() => {
    const origin = window.location.origin
    server.use(
      http.get(`${origin}/api/summary`, () => HttpResponse.json(summaryFixture)),
      http.get(`${origin}/api/accounts`, () => HttpResponse.json(accountsFixture)),
      http.get(`${origin}/api/owners/:owner/accounts/:accountId/transactions`, () =>
        HttpResponse.json({ owner: 'marcelo', accountId: 'a1', transactions: [], nextCursor: null }),
      ),
      http.get(`${origin}/api/credit-cards`, () => HttpResponse.json(creditCardsFixture)),
    )
  })

  it('mostra a visão geral na rota inicial', () => {
    renderWithProviders(<App />)
    expect(screen.getByRole('heading', { name: 'Visão geral' })).toBeInTheDocument()
  })

  it('navega para Contas e Transações pelo menu', async () => {
    renderWithProviders(<App />)
    await userEvent.click(screen.getByRole('link', { name: 'Contas' }))
    expect(screen.getByRole('heading', { name: 'Contas' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('link', { name: 'Transações' }))
    expect(screen.getByRole('heading', { name: 'Transações' })).toBeInTheDocument()
  })
})
