import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import App from './App'
import { accountsFixture, billDetailFixture, creditCardsFixture, loansFixture, summaryFixture } from './api/fixtures'
import { renderWithProviders } from './test/render'
import { server } from './test/server'

describe('navegação', () => {
  beforeEach(() => {
    const origin = window.location.origin
    server.use(
      http.get(`${origin}/api/summary`, () => HttpResponse.json(summaryFixture)),
      http.get(`${origin}/api/accounts`, () => HttpResponse.json(accountsFixture)),
      http.get(`${origin}/api/transactions`, () =>
        HttpResponse.json({ transactions: [], partial: false, errors: [] }),
      ),
      http.get(`${origin}/api/loans`, () => HttpResponse.json(loansFixture)),
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

  it('navega para Empréstimos pelo menu', async () => {
    renderWithProviders(<App />)
    await userEvent.click(screen.getByRole('link', { name: 'Empréstimos' }))
    expect(screen.getByRole('heading', { name: 'Empréstimos' })).toBeInTheDocument()
    expect(await screen.findByText('Crédito Pessoal Consignado')).toBeInTheDocument()
  })

  it('abre o detalhe da fatura dentro do layout', async () => {
    server.use(http.get(`${window.location.origin}/api/bill/:id`, () => HttpResponse.json(billDetailFixture)))
    renderWithProviders(<App />, '/bills/b1?owner=marcelo&accountId=c1')
    expect(screen.getByRole('heading', { name: /Fatura/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Contas' })).toBeInTheDocument()
    expect(await screen.findByRole('region', { name: 'Resumo da fatura' })).toBeInTheDocument()
  })
})
