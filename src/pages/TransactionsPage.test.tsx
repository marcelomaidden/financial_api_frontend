import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import type { OwnedTransaction, TransactionError } from '../api/types'
import { renderWithProviders } from '../test/render'
import { server } from '../test/server'
import { TransactionsPage } from './TransactionsPage'

const origin = window.location.origin

function tx(
  id: string,
  description: string,
  date: string,
  amount = 10,
  owner = 'marcelo',
  accountId = 'a1',
): OwnedTransaction {
  return {
    owner,
    accountId,
    id,
    date,
    description,
    amount,
    currencyCode: 'BRL',
    type: 'DEBIT',
    status: 'POSTED',
    category: null,
  }
}

function mockTransactions(transactions: OwnedTransaction[], errors: TransactionError[] = [], seen: URL[] = []) {
  server.use(
    http.get(`${origin}/api/transactions`, ({ request }) => {
      seen.push(new URL(request.url))
      return HttpResponse.json({
        transactions,
        partial: errors.length > 0,
        errors,
      })
    }),
  )
}

let creditCardsCalls = 0

function mockNames() {
  creditCardsCalls = 0
  server.use(
    http.get(`${origin}/api/accounts`, () =>
      HttpResponse.json({
        owners: [
          {
            owner: 'marcelo',
            accounts: [
              { id: 'a1', type: 'BANK', name: 'Nubank' },
              { id: 'a2', type: 'BANK', name: 'Itaú' },
              { id: 'c1', type: 'CREDIT', name: 'Cartão Roxo' },
            ],
            error: null,
          },
          { owner: 'luana', accounts: [{ id: 'a3', type: 'BANK', name: 'Inter' }], error: null },
        ],
      }),
    ),
    http.get(`${origin}/api/credit-cards`, () => {
      creditCardsCalls += 1
      return HttpResponse.json({ owners: [] })
    }),
  )
}

describe('TransactionsPage', () => {
  beforeEach(mockNames)

  it('mostra as transações na ordem recebida, com dono e nome da conta ou do cartão', async () => {
    mockTransactions([
      tx('2', 'Nova', '2026-11-12T10:00:00Z'),
      tx('4', 'Luana', '2026-11-09T10:00:00Z', 10, 'luana', 'a3'),
      tx('3', 'Meio', '2026-11-07T10:00:00Z', 10, 'marcelo', 'c1'),
      tx('1', 'Antiga', '2026-11-02T10:00:00Z'),
    ])
    renderWithProviders(<TransactionsPage />)

    await screen.findByText('Nova')
    const rows = screen.getAllByRole('listitem')
    expect(rows.map((row) => row.querySelector('span.truncate')?.textContent)).toEqual([
      'Nova',
      'Luana',
      'Meio',
      'Antiga',
    ])
    expect(within(rows[0]).getByText('Nubank')).toBeInTheDocument()
    expect(within(rows[1]).getByText('luana')).toBeInTheDocument()
    expect(within(rows[1]).getByText('Inter')).toBeInTheDocument()
    expect(within(rows[2]).getByText('Cartão Roxo')).toBeInTheDocument()
    expect(creditCardsCalls).toBe(0)
  })

  it('faz uma única chamada a /transactions, com o mês corrente por padrão e nova busca ao mudar o período', async () => {
    const seen: URL[] = []
    mockTransactions([tx('1', 'Compra', '2026-10-10T10:00:00Z')], [], seen)
    renderWithProviders(<TransactionsPage />)
    await screen.findByText('Compra')

    expect(seen).toHaveLength(1)
    const now = new Date()
    const first = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    expect(seen[0].searchParams.get('dateFrom')).toBe(first)

    const from = screen.getByLabelText('De')
    await userEvent.clear(from)
    await userEvent.type(from, '2026-10-01')
    await screen.findByText('Compra')
    expect(seen.at(-1)!.searchParams.get('dateFrom')).toBe('2026-10-01')
  })

  it('usa o id quando o nome da conta não está disponível', async () => {
    server.use(
      http.get(`${origin}/api/accounts`, () =>
        HttpResponse.json({ status: 502, error: 'x', message: 'x' }, { status: 502 }),
      ),
    )
    mockTransactions([tx('1', 'Compra', '2026-11-02T10:00:00Z', 10, 'marcelo', 'a9')])
    renderWithProviders(<TransactionsPage />)
    expect(within(await screen.findByRole('listitem')).getByText('a9')).toBeInTheDocument()
  })

  it('agrupa por data e distingue entrada e saída por ícone e cor', async () => {
    mockTransactions([
      { ...tx('1', 'Salário', '2026-11-12T10:00:00Z', 100), type: 'CREDIT' },
      tx('2', 'Mercado', '2026-11-12T09:00:00Z', 30),
      tx('3', 'Café', '2026-11-10T09:00:00Z', 5),
    ])
    renderWithProviders(<TransactionsPage />)

    await screen.findByText('Salário')
    const day12 = screen.getByRole('region', { name: '12/11/2026' })
    expect(within(day12).getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByRole('region', { name: '10/11/2026' })).toBeInTheDocument()

    const income = within(day12).getByText('Salário').closest('li')!
    expect(within(income).getByRole('img', { name: 'Entrada' })).toBeInTheDocument()
    expect(income.querySelector('span.text-green-600')).toHaveTextContent('R$')

    const expense = within(day12).getByText('Mercado').closest('li')!
    expect(within(expense).getByRole('img', { name: 'Saída' })).toBeInTheDocument()
    expect(expense.querySelector('span.text-red-600')).toHaveTextContent('−')
  })

  it('exibe as transações recebidas e avisa as contas que falharam', async () => {
    mockTransactions(
      [tx('1', 'Ok', '2026-11-02T10:00:00Z')],
      [
        {
          owner: 'marcelo',
          accountId: 'a2',
          status: 502,
          message: 'Pluggy fora',
        },
      ],
    )
    renderWithProviders(<TransactionsPage />)

    expect(await screen.findByText('Ok')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('marcelo · Itaú: Pluggy fora')
  })

  it('avisa quando as contas de um dono não puderam ser listadas', async () => {
    mockTransactions(
      [tx('1', 'Ok', '2026-11-02T10:00:00Z')],
      [
        {
          owner: 'luana',
          accountId: null,
          status: 502,
          message: 'Pluggy fora',
        },
      ],
    )
    renderWithProviders(<TransactionsPage />)

    expect(await screen.findByText('Ok')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Contas de luana não carregadas: Pluggy fora')
  })

  it('mostra erro com nova tentativa quando as transações não carregam', async () => {
    server.use(
      http.get(`${origin}/api/transactions`, () =>
        HttpResponse.json({ status: 502, error: 'Bad Gateway', message: 'Pluggy fora' }, { status: 502 }),
      ),
    )
    renderWithProviders(<TransactionsPage />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Pluggy fora')
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument()
  })

  it('mostra mensagem quando não há transações', async () => {
    mockTransactions([])
    renderWithProviders(<TransactionsPage />)
    expect(await screen.findByText('Nenhuma transação no período.')).toBeInTheDocument()
  })
})
