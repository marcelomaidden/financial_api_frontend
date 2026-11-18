import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom'
import { billDetailFixture } from '../api/fixtures'
import type { BillDetailResponse } from '../api/types'
import { renderWithProviders } from '../test/render'
import { server } from '../test/server'
import { BillDetailPage } from './BillDetailPage'

const origin = window.location.origin
const ROUTE = '/bills/b1?owner=marcelo&accountId=c1'

function renderPage(route = ROUTE) {
  return renderWithProviders(
    <Routes>
      <Route path="/bills/:id" element={<BillDetailPage />} />
      <Route path="/accounts" element={<p>Tela de contas</p>} />
    </Routes>,
    route,
  )
}

function mockDetail(detail: BillDetailResponse = billDetailFixture) {
  const urls: URL[] = []
  server.use(
    http.get(`${origin}/api/bill/:id`, ({ request }) => {
      urls.push(new URL(request.url))
      return HttpResponse.json(detail)
    }),
  )
  return urls
}

function mockError(status: number, message: string) {
  server.use(
    http.get(`${origin}/api/bill/:id`, () =>
      HttpResponse.json({ status, error: 'Erro', message }, { status }),
    ),
  )
}

describe('BillDetailPage', () => {
  it('consulta com o id, o dono e a conta do endereço e mostra o resumo formatado', async () => {
    const urls = mockDetail()
    renderPage()

    const summary = await screen.findByRole('region', { name: 'Resumo da fatura' })
    expect(urls[0].pathname).toBe('/api/bill/b1')
    expect(urls[0].searchParams.get('owner')).toBe('marcelo')
    expect(urls[0].searchParams.get('accountId')).toBe('c1')
    expect(summary).toHaveTextContent('20/11/2026')
    expect(summary).toHaveTextContent('10/11/2026')
    expect(summary).toHaveTextContent(/1\.520,75/)
    expect(summary).toHaveTextContent(/228,11/)
    expect(summary).toHaveTextContent('Aceita parcelamento')
    expect(summary).toHaveTextContent('Sim')
  })

  it('mostra "-" para fechamento e mínimo nulos e omite o parcelamento sem informação', async () => {
    mockDetail({
      ...billDetailFixture,
      bill: { ...billDetailFixture.bill, closingDate: null, minimumPaymentAmount: null, allowsInstallments: null },
    })
    renderPage()

    const summary = await screen.findByRole('region', { name: 'Resumo da fatura' })
    expect(within(summary).getByText('Fechamento').nextElementSibling).toHaveTextContent('-')
    expect(within(summary).getByText('Pagamento mínimo').nextElementSibling).toHaveTextContent('-')
    expect(summary).not.toHaveTextContent('Aceita parcelamento')
  })

  it('lista encargos e pagamentos', async () => {
    mockDetail()
    renderPage()

    const charges = await screen.findByRole('region', { name: 'Encargos' })
    expect(charges).toHaveTextContent('IOF')
    expect(charges).toHaveTextContent('IOF internacional')
    expect(charges).toHaveTextContent(/12,50/)
    const payments = screen.getByRole('region', { name: 'Pagamentos' })
    expect(payments).toHaveTextContent('PARTIAL em 18/11/2026')
    expect(payments).toHaveTextContent('PIX')
    expect(payments).toHaveTextContent(/300,00/)
  })

  it('mostra a compra parcelada com a parcela e o estorno como entrada, na ordem recebida', async () => {
    mockDetail()
    renderPage()

    const purchases = await screen.findByRole('region', { name: 'Compras' })
    const rows = within(purchases).getAllByRole('listitem')
    expect(rows).toHaveLength(3)
    expect(rows[0]).toHaveTextContent('Loja de Roupas')
    expect(rows[0]).toHaveTextContent('3/10')
    expect(rows[0]).toHaveTextContent('10/11/2026 · Compras')
    expect(within(rows[0]).getByRole('img', { name: 'Saída' })).toBeInTheDocument()
    expect(rows[1]).toHaveTextContent('Estorno Mercado')
    expect(rows[1]).toHaveTextContent('08/11/2026')
    expect(rows[1]).not.toHaveTextContent('/10')
    expect(within(rows[1]).getByRole('img', { name: 'Entrada' })).toBeInTheDocument()
    expect(rows[1]).toHaveTextContent(/20,00/)
  })

  it('mostra a compra em outra moeda pelo valor na moeda da fatura, com o original menor embaixo', async () => {
    mockDetail()
    renderPage()

    const purchases = await screen.findByRole('region', { name: 'Compras' })
    const row = within(purchases).getByText('Netflix').closest('li')!
    const main = within(row).getByText(/298,19/)
    expect(main).toHaveTextContent(/R\$\s?298,19/)
    expect(main).toHaveClass('font-medium')
    const note = within(row).getByText(/58,00/)
    expect(note).toHaveTextContent(/US\$\s?58,00/)
    expect(note).toHaveClass('text-xs')
  })

  it('mostra só o valor original da compra em outra moeda sem valor convertido', async () => {
    mockDetail({
      ...billDetailFixture,
      transactions: [
        {
          id: 'u1',
          date: '2026-11-05',
          description: 'Loja online',
          amount: -58,
          currencyCode: 'USD',
          category: null,
          type: 'DEBIT',
          status: 'POSTED',
        },
      ],
    })
    renderPage()

    const purchases = await screen.findByRole('region', { name: 'Compras' })
    const row = within(purchases).getByText('Loja online').closest('li')!
    expect(row).toHaveTextContent(/US\$\s?58,00/)
    expect(row).not.toHaveTextContent('R$')
  })

  it('mantém a compra em BRL e a parcela como antes, sem valor menor embaixo', async () => {
    mockDetail()
    renderPage()

    const purchases = await screen.findByRole('region', { name: 'Compras' })
    const row = within(purchases).getByText('Loja de Roupas').closest('li')!
    expect(row).toHaveTextContent(/R\$\s?150,00/)
    expect(row).toHaveTextContent('3/10')
    expect(row.querySelectorAll('.text-xs.text-slate-500')).toHaveLength(2)
  })

  it('mostra as mensagens de lista vazia', async () => {
    mockDetail({
      ...billDetailFixture,
      bill: { ...billDetailFixture.bill, financeCharges: [], payments: [] },
      transactions: [],
    })
    renderPage()

    expect(await screen.findByText('Nenhum encargo.')).toBeInTheDocument()
    expect(screen.getByText('Nenhum pagamento.')).toBeInTheDocument()
    expect(screen.getByText('Nenhuma compra nesta fatura.')).toBeInTheDocument()
  })

  it('mostra o carregamento enquanto a fatura não chega', async () => {
    mockDetail()
    renderPage()
    expect(screen.getByRole('status')).toHaveTextContent('Carregando fatura...')
    await screen.findByRole('region', { name: 'Resumo da fatura' })
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it.each([
    [404, 'Fatura não encontrada'],
    [502, 'Erro ao consultar a Pluggy'],
  ])('com erro %i mostra a mensagem da API, sem resumo nem compras', async (status, message) => {
    mockError(status, message)
    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent(message)
    expect(screen.queryByRole('region', { name: 'Resumo da fatura' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Compras' })).not.toBeInTheDocument()
  })

  it('"Tentar de novo" refaz a consulta', async () => {
    mockError(502, 'Pluggy fora')
    renderPage()
    await screen.findByRole('alert')

    mockDetail()
    await userEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    expect(await screen.findByRole('region', { name: 'Resumo da fatura' })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it.each([
    ['sem owner', '/bills/b1?accountId=c1'],
    ['sem accountId', '/bills/b1?owner=marcelo'],
    ['com owner em branco', '/bills/b1?owner=%20&accountId=c1'],
  ])('endereço %s avisa e não chama a API', async (_name, route) => {
    const urls = mockDetail()
    renderPage(route)

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Faltam dados da fatura')
    expect(screen.queryByRole('button', { name: 'Tentar de novo' })).not.toBeInTheDocument()
    expect(urls).toHaveLength(0)
  })

  it('tem link de volta para Contas, também com erro', async () => {
    mockError(404, 'Fatura não encontrada')
    renderPage()
    await screen.findByRole('alert')

    const back = screen.getByRole('link', { name: /Voltar para Contas/ })
    expect(back).toHaveAttribute('href', '/accounts')
    await userEvent.click(back)
    expect(await screen.findByText('Tela de contas')).toBeInTheDocument()
  })

  it('mostra o dono da fatura no título', async () => {
    mockDetail()
    renderPage()
    const heading = await screen.findByRole('heading', { level: 1 })
    await within(heading).findByText('marcelo')
  })
})
