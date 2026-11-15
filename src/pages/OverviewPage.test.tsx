import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { summaryFixture } from '../api/fixtures'
import { renderWithProviders } from '../test/render'
import { server } from '../test/server'
import { OverviewPage } from './OverviewPage'

const url = `${window.location.origin}/api/summary`

function card(name: string) {
  return screen.getByRole('region', { name })
}

describe('OverviewPage', () => {
  it('consulta sem datas por padrão e mostra os quatro totais', async () => {
    let requested!: URL
    server.use(
      http.get(url, ({ request }) => {
        requested = new URL(request.url)
        return HttpResponse.json({ ...summaryFixture, partial: false, errors: [] })
      }),
    )
    renderWithProviders(<OverviewPage />)

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(await screen.findByRole('region', { name: 'Saldo disponível' })).toBeInTheDocument()
    expect(requested.search).toBe('')
    expect(within(card('Saldo disponível')).getByTestId('total')).toHaveTextContent(/500,50/)
    expect(within(card('Entradas no período')).getByTestId('total')).toHaveTextContent(/19,99/)
    expect(within(card('Faturas a pagar')).getByTestId('total')).toHaveTextContent(/250,40/)
    expect(within(card('Compras do cartão sem fatura')).getByTestId('total')).toHaveTextContent(/478,19/)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('consulta com dateFrom e dateTo quando o período é escolhido', async () => {
    const requests: URL[] = []
    server.use(
      http.get(url, ({ request }) => {
        requests.push(new URL(request.url))
        return HttpResponse.json({ ...summaryFixture, partial: false, errors: [] })
      }),
    )
    renderWithProviders(<OverviewPage />)
    await screen.findByRole('region', { name: 'Saldo disponível' })

    await userEvent.type(screen.getByLabelText('De'), '2026-10-01')
    await userEvent.type(screen.getByLabelText('Até'), '2026-10-31')

    await screen.findByRole('region', { name: 'Saldo disponível' })
    const last = requests.at(-1)!
    expect(last.searchParams.get('dateFrom')).toBe('2026-10-01')
    expect(last.searchParams.get('dateTo')).toBe('2026-10-31')
  })

  it('lista faturas com cartão, vencimento, valor e dono', async () => {
    server.use(http.get(url, () => HttpResponse.json(summaryFixture)))
    renderWithProviders(<OverviewPage />)
    const owed = await screen.findByRole('region', { name: 'Faturas a pagar' })

    expect(within(owed).getByText('marcelo')).toBeInTheDocument()
    expect(within(owed).getByText(/Cartão Nubank · vence em 20\/11\/2026 · .*250,40/)).toBeInTheDocument()
  })

  it('mostra parcela e valor em BRL de compra estrangeira', async () => {
    server.use(http.get(url, () => HttpResponse.json(summaryFixture)))
    renderWithProviders(<OverviewPage />)
    const purchases = await screen.findByRole('region', { name: 'Compras do cartão sem fatura' })

    expect(within(purchases).getByText(/Notebook \(3\/10\)/)).toBeInTheDocument()
    expect(within(purchases).getByText(/Netflix.*US\$.*58,00 → .*298,19/)).toBeInTheDocument()
  })

  it('avisa dados parciais e mantém os totais recebidos', async () => {
    server.use(http.get(url, () => HttpResponse.json(summaryFixture)))
    renderWithProviders(<OverviewPage />)

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Dados de luana incompletos: Erro ao consultar a Pluggy')
    expect(within(card('Saldo disponível')).getByTestId('total')).toHaveTextContent(/500,50/)
  })

  it('mostra erro com nova tentativa quando a API falha (502)', async () => {
    let calls = 0
    server.use(
      http.get(url, () => {
        calls += 1
        return calls === 1
          ? HttpResponse.json({ status: 502, error: 'Bad Gateway', message: 'Pluggy fora' }, { status: 502 })
          : HttpResponse.json({ ...summaryFixture, partial: false, errors: [] })
      }),
    )
    renderWithProviders(<OverviewPage />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Pluggy fora')
    await userEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    expect(await screen.findByRole('region', { name: 'Saldo disponível' })).toBeInTheDocument()
  })

  it('mostra erro de rede (sem resposta)', async () => {
    server.use(http.get(url, () => HttpResponse.error()))
    renderWithProviders(<OverviewPage />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível conectar à API.')
  })
})
