import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { loansFixture } from '../api/fixtures'
import type { Loan, OwnerLoans } from '../api/types'
import { renderWithProviders } from '../test/render'
import { server } from '../test/server'
import { LoansPage } from './LoansPage'

const origin = window.location.origin

const minimalLoan: Loan = {
  id: 'min',
  itemId: 'i9',
  contractNumber: null,
  productName: 'Crédito Simples',
  kind: 'LOAN',
  type: null,
  contractAmount: null,
  currencyCode: 'BRL',
  contractDate: null,
  dueDate: null,
  installments: null,
  outstandingBalance: null,
  lastPayment: null,
}

function mockLoans(owners: OwnerLoans[]) {
  server.use(http.get(`${origin}/api/loans`, () => HttpResponse.json({ owners })))
}

function ownerWith(loan: Loan): OwnerLoans {
  return { owner: 'marcelo', loans: [loan], error: null }
}

async function findItem(name: string) {
  return (await screen.findByText(name)).closest('li')!
}

describe('LoansPage', () => {
  it('lista os empréstimos sem filtrar por dono, com etiqueta do dono', async () => {
    let url!: URL
    server.use(
      http.get(`${origin}/api/loans`, ({ request }) => {
        url = new URL(request.url)
        return HttpResponse.json(loansFixture)
      }),
    )
    renderWithProviders(<LoansPage />)

    const item = await findItem('Crédito Pessoal Consignado')
    expect(within(item).getByText('marcelo')).toBeInTheDocument()
    expect(url.search).toBe('')
  })

  it('mostra o erro de um dono sem ocultar os empréstimos dos demais', async () => {
    mockLoans(loansFixture.owners)
    renderWithProviders(<LoansPage />)

    expect(await screen.findByText('Crédito Pessoal Consignado')).toBeInTheDocument()
    expect(await screen.findByRole('alert')).toHaveTextContent('luana: Erro ao consultar a Pluggy')
  })

  it('mostra a mensagem do 502 e tenta de novo', async () => {
    let calls = 0
    server.use(
      http.get(`${origin}/api/loans`, () => {
        calls += 1
        return calls === 1
          ? HttpResponse.json({ status: 502, error: 'Bad Gateway', message: 'Pluggy fora' }, { status: 502 })
          : HttpResponse.json(loansFixture)
      }),
    )
    renderWithProviders(<LoansPage />)

    expect(await screen.findByText('Pluggy fora')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    expect(await screen.findByText('Crédito Pessoal Consignado')).toBeInTheDocument()
    expect(calls).toBe(2)
  })

  it('mostra "Nenhum empréstimo." quando a lista é vazia', async () => {
    mockLoans([{ owner: 'marcelo', loans: [], error: null }])
    renderWithProviders(<LoansPage />)
    expect(await screen.findByText('Nenhum empréstimo.')).toBeInTheDocument()
  })

  it('mostra todos os dados de um empréstimo completo, com datas sem deslocamento', async () => {
    mockLoans([loansFixture.owners[0]])
    renderWithProviders(<LoansPage />)

    const item = await findItem('Crédito Pessoal Consignado')
    expect(within(item).getByText('Empréstimo')).toBeInTheDocument()
    expect(within(item).getByText('Saldo para quitar').nextSibling).toHaveTextContent(/25\.000,00/)
    expect(within(item).getByText('Valor contratado').nextSibling).toHaveTextContent(/50\.000,00/)
    expect(within(item).getByText('Parcelas').nextSibling).toHaveTextContent('65 pagas, 55 restantes')
    expect(within(item).getByText('Fim do contrato').nextSibling).toHaveTextContent('15/01/2028')
    const last = within(item).getByText('Último pagamento').nextSibling
    expect(last).toHaveTextContent('15/07/2023')
    expect(last).toHaveTextContent(/680,50/)
    expect(within(item).queryByText(/em atraso/)).not.toBeInTheDocument()
  })

  it('mostra só o nome e o tipo quando só os campos obrigatórios vêm', async () => {
    mockLoans([ownerWith(minimalLoan)])
    renderWithProviders(<LoansPage />)

    const item = await findItem('Crédito Simples')
    expect(within(item).getByText('Empréstimo')).toBeInTheDocument()
    expect(within(item).queryByRole('definition')).not.toBeInTheDocument()
    expect(within(item).queryByText(/Saldo|Valor contratado|Parcelas|Fim do contrato|Último pagamento|atraso/)).not.toBeInTheDocument()
  })

  it('destaca as parcelas em atraso', async () => {
    mockLoans([ownerWith({ ...minimalLoan, installments: { total: 10, paid: 4, remaining: 6, pastDue: 2 } })])
    renderWithProviders(<LoansPage />)

    const item = await findItem('Crédito Simples')
    expect(within(item).getByText('2 parcelas em atraso')).toBeInTheDocument()
  })

  it('mostra só o total quando é o único dado de parcelas', async () => {
    mockLoans([ownerWith({ ...minimalLoan, installments: { total: 24, paid: null, remaining: null, pastDue: null } })])
    renderWithProviders(<LoansPage />)

    const item = await findItem('Crédito Simples')
    expect(within(item).getByText('Parcelas').nextSibling).toHaveTextContent('24 parcelas')
  })

  it.each([
    ['UNKNOWN', 'Outro'],
    ['TIPO_NOVO', 'Outro'],
    ['FINANCING', 'Financiamento'],
    ['INVOICE_FINANCING', 'Financiamento de fatura'],
    ['UNARRANGED_ACCOUNT_OVERDRAFT', 'Cheque especial'],
  ])('mostra o kind %s como "%s"', async (kind, label) => {
    mockLoans([ownerWith({ ...minimalLoan, kind })])
    renderWithProviders(<LoansPage />)

    const item = await findItem('Crédito Simples')
    expect(within(item).getByText(label)).toBeInTheDocument()
  })
})
