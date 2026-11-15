import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import type { Account, OwnerAccounts, Transaction } from '../api/types'
import { renderWithProviders } from '../test/render'
import { server } from '../test/server'
import { TransactionsPage } from './TransactionsPage'

const origin = window.location.origin

function account(id: string, name: string): Account {
  return { id, itemId: 'i', type: 'BANK', subtype: null, name, number: null, balance: 0, currencyCode: 'BRL' }
}

function tx(id: string, description: string, date: string, amount = 10): Transaction {
  return { id, date, description, amount, currencyCode: 'BRL', type: 'DEBIT', status: 'POSTED', category: null }
}

function mockAccounts(owners: OwnerAccounts[]) {
  server.use(http.get(`${origin}/api/accounts`, () => HttpResponse.json({ owners })))
}

function txHandler(
  byAccount: Record<string, Transaction[][] | 'error'>,
  seen: URL[] = [],
) {
  return http.get(`${origin}/api/owners/:owner/accounts/:accountId/transactions`, ({ request, params }) => {
    const url = new URL(request.url)
    seen.push(url)
    const pages = byAccount[`${params.owner}:${params.accountId}`]
    if (pages === 'error') {
      return HttpResponse.json({ status: 502, error: 'Bad Gateway', message: 'Pluggy fora' }, { status: 502 })
    }
    const index = Number(url.searchParams.get('after') ?? 0)
    return HttpResponse.json({
      owner: params.owner,
      accountId: params.accountId,
      transactions: pages[index],
      nextCursor: index + 1 < pages.length ? String(index + 1) : null,
    })
  })
}

const owners: OwnerAccounts[] = [
  { owner: 'marcelo', accounts: [account('a1', 'Nubank'), account('a2', 'Itaú')], error: null },
  { owner: 'luana', accounts: [account('a3', 'Inter')], error: null },
]

describe('TransactionsPage', () => {
  it('junta as contas de todos os donos em uma lista ordenada por data (mais recente primeiro)', async () => {
    mockAccounts(owners)
    server.use(
      txHandler({
        'marcelo:a1': [[tx('1', 'Antiga', '2026-11-02T10:00:00Z'), tx('2', 'Nova', '2026-11-12T10:00:00Z')]],
        'marcelo:a2': [[tx('3', 'Meio', '2026-11-07T10:00:00Z')]],
        'luana:a3': [[tx('4', 'Luana', '2026-11-09T10:00:00Z')]],
      }),
    )
    renderWithProviders(<TransactionsPage />)

    await screen.findByText('Nova')
    const rows = screen.getAllByRole('row').slice(1)
    expect(rows.map((row) => within(row).getAllByRole('cell')[1].textContent)).toEqual([
      'Nova',
      'Luana',
      'Meio',
      'Antiga',
    ])
    const luana = rows[1]
    expect(within(luana).getByText('luana')).toBeInTheDocument()
    expect(within(luana).getByText('Inter')).toBeInTheDocument()
  })

  it('segue nextCursor até o fim em uma conta com várias páginas', async () => {
    mockAccounts([{ owner: 'marcelo', accounts: [account('a1', 'Nubank')], error: null }])
    const seen: URL[] = []
    server.use(
      txHandler(
        {
          'marcelo:a1': [
            [tx('1', 'P1', '2026-11-03T10:00:00Z')],
            [tx('2', 'P2', '2026-11-02T10:00:00Z')],
            [tx('3', 'P3', '2026-11-01T10:00:00Z')],
          ],
        },
        seen,
      ),
    )
    renderWithProviders(<TransactionsPage />)

    await screen.findByText('P3')
    expect(screen.getByText('P1')).toBeInTheDocument()
    expect(screen.getByText('P2')).toBeInTheDocument()
    expect(seen.map((url) => url.searchParams.get('after'))).toEqual([null, '1', '2'])
  })

  it('usa o mês corrente por padrão e refaz a busca ao mudar o período', async () => {
    mockAccounts([{ owner: 'marcelo', accounts: [account('a1', 'Nubank')], error: null }])
    const seen: URL[] = []
    server.use(txHandler({ 'marcelo:a1': [[tx('1', 'Compra', '2026-10-10T10:00:00Z')]] }, seen))
    renderWithProviders(<TransactionsPage />)
    await screen.findByText('Compra')

    const now = new Date()
    const first = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    expect(seen[0].searchParams.get('dateFrom')).toBe(first)

    seen.length = 0
    const from = screen.getByLabelText('De')
    await userEvent.clear(from)
    await userEvent.type(from, '2026-10-01')
    await screen.findByText('Compra')
    expect(seen.at(-1)!.searchParams.get('dateFrom')).toBe('2026-10-01')
  })

  it('exibe as transações das contas que responderam e avisa as que falharam', async () => {
    mockAccounts(owners)
    server.use(
      txHandler({
        'marcelo:a1': [[tx('1', 'Ok', '2026-11-02T10:00:00Z')]],
        'marcelo:a2': 'error',
        'luana:a3': [[tx('4', 'Luana', '2026-11-09T10:00:00Z')]],
      }),
    )
    renderWithProviders(<TransactionsPage />)

    expect(await screen.findByText('Ok')).toBeInTheDocument()
    expect(screen.getByText('Luana')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('marcelo · Itaú: Pluggy fora')
  })

  it('avisa quando as contas de um dono não puderam ser listadas', async () => {
    mockAccounts([
      { owner: 'marcelo', accounts: [account('a1', 'Nubank')], error: null },
      { owner: 'luana', accounts: [], error: { status: 502, error: 'Bad Gateway', message: 'Pluggy fora' } },
    ])
    server.use(txHandler({ 'marcelo:a1': [[tx('1', 'Ok', '2026-11-02T10:00:00Z')]] }))
    renderWithProviders(<TransactionsPage />)

    expect(await screen.findByText('Ok')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Contas de luana não carregadas: Pluggy fora')
  })

  it('mostra erro com nova tentativa quando as contas não carregam', async () => {
    server.use(
      http.get(`${origin}/api/accounts`, () =>
        HttpResponse.json({ status: 502, error: 'Bad Gateway', message: 'Pluggy fora' }, { status: 502 }),
      ),
    )
    renderWithProviders(<TransactionsPage />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Pluggy fora')
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument()
  })

  it('mostra mensagem quando não há transações', async () => {
    mockAccounts([{ owner: 'marcelo', accounts: [account('a1', 'Nubank')], error: null }])
    server.use(txHandler({ 'marcelo:a1': [[]] }))
    renderWithProviders(<TransactionsPage />)
    expect(await screen.findByText('Nenhuma transação no período.')).toBeInTheDocument()
  })
})
