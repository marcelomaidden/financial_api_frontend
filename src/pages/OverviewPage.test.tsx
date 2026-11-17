import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { summaryFixture } from '../api/fixtures'
import type { Account, ExpenseTransaction, OwnerAccounts } from '../api/types'
import { renderWithProviders } from '../test/render'
import { server } from '../test/server'
import { OverviewPage } from './OverviewPage'

const url = `${window.location.origin}/api/summary`
const accountsUrl = `${window.location.origin}/api/accounts`

function card(name: string) {
  return screen.getByRole('region', { name })
}

function cardAccount(id: string, name: string): Account {
  return { id, itemId: 'i', type: 'CREDIT', subtype: 'CREDIT_CARD', name, number: null, balance: 0, currencyCode: 'BRL' }
}

/** Resposta de /accounts com os cartões usados nos testes (ela traz contas e cartões). */
function accountsResponse(owners: OwnerAccounts[]) {
  return HttpResponse.json({ owners })
}

const namedCards: OwnerAccounts[] = [
  { owner: 'marcelo', accounts: [cardAccount('c1', 'Cartão Nubank'), cardAccount('c2', 'Cartão Inter')], error: null },
  { owner: 'luana', accounts: [cardAccount('c1', 'Cartão da Luana')], error: null },
]

beforeEach(() => {
  server.use(http.get(accountsUrl, () => accountsResponse(namedCards)))
})

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

    expect(within(owed).getByRole('img', { name: 'marcelo' })).toBeInTheDocument()
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

describe('OverviewPage: compras do cartão sem fatura por cartão', () => {
  function purchase(id: string, accountId: string, amount: number, extra: Partial<ExpenseTransaction> = {}): ExpenseTransaction {
    return {
      id,
      accountId,
      description: `Compra ${id}`,
      currencyCode: 'BRL',
      amount,
      date: '2026-11-05T10:00:00Z',
      category: null,
      ...extra,
    }
  }

  function summaryWith(detail: Record<string, ExpenseTransaction[]>, total: number) {
    return {
      ...summaryFixture,
      partial: false,
      errors: [],
      expenses: { ...summaryFixture.expenses, transactions: { total: { value: total, currencyCode: 'BRL' }, detail } },
    }
  }

  const twoOwners = summaryWith(
    {
      marcelo: [purchase('a', 'c1', 30), purchase('b', 'c1', 150), purchase('c', 'c2', 400)],
      luana: [purchase('d', 'c1', 50)],
    },
    630,
  )

  /** Títulos dos grupos de compras. O <details> do card também tem papel `group`, mas sem nome. */
  function groupNames() {
    return within(card('Compras do cartão sem fatura'))
      .getAllByRole('group')
      .map((group) => group.getAttribute('aria-label'))
      .filter((name): name is string => name !== null)
  }

  it('agrupa as compras do resumo de exemplo em um cartão com nome, dono e subtotal', async () => {
    server.use(http.get(url, () => HttpResponse.json(summaryFixture)))
    renderWithProviders(<OverviewPage />)
    const purchases = await screen.findByRole('region', { name: 'Compras do cartão sem fatura' })

    const group = await within(purchases).findByRole('group', { name: 'Cartão Nubank' })
    expect(within(group).getByRole('img', { name: 'marcelo' })).toBeInTheDocument()
    expect(within(group).getByTestId('group-subtotal')).toHaveTextContent(/478,19/)
    expect(within(group).getAllByRole('listitem')).toHaveLength(3)
    expect(within(purchases).getByTestId('total')).toHaveTextContent(/478,19/)
  })

  it('separa cartões e donos, com subtotais que somam o total do card', async () => {
    server.use(http.get(url, () => HttpResponse.json(twoOwners)))
    renderWithProviders(<OverviewPage />)
    const purchases = await screen.findByRole('region', { name: 'Compras do cartão sem fatura' })
    await within(purchases).findByRole('group', { name: 'Cartão Inter' })

    const subtotals = Object.fromEntries(
      ['Cartão Inter', 'Cartão Nubank', 'Cartão da Luana'].map((name) => [
        name,
        within(within(purchases).getByRole('group', { name })).getByTestId('group-subtotal').textContent ?? '',
      ]),
    )
    expect(subtotals['Cartão Inter']).toMatch(/400,00/)
    expect(subtotals['Cartão Nubank']).toMatch(/180,00/)
    expect(subtotals['Cartão da Luana']).toMatch(/50,00/)
    expect(within(purchases).getByTestId('total')).toHaveTextContent(/630,00/)
    // 400 + 180 + 50 = 630: mesmos centavos do total do card.
    expect(within(within(purchases).getByRole('group', { name: 'Cartão da Luana' })).getByRole('img', { name: 'luana' })).toBeInTheDocument()
  })

  it('ordena os grupos pelo maior subtotal', async () => {
    server.use(http.get(url, () => HttpResponse.json(twoOwners)))
    renderWithProviders(<OverviewPage />)
    await screen.findByRole('group', { name: 'Cartão Inter' })

    expect(groupNames()).toEqual(['Cartão Inter', 'Cartão Nubank', 'Cartão da Luana'])
  })

  it('usa o accountId como título enquanto os nomes carregam e troca pelo nome quando chegam', async () => {
    let release!: () => void
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    server.use(
      http.get(url, () => HttpResponse.json(summaryFixture)),
      http.get(accountsUrl, async () => {
        await gate
        return accountsResponse(namedCards)
      }),
    )
    renderWithProviders(<OverviewPage />)

    const purchases = await screen.findByRole('region', { name: 'Compras do cartão sem fatura' })
    const pending = await within(purchases).findByRole('group', { name: 'c1' })
    expect(within(pending).getByTestId('group-subtotal')).toHaveTextContent(/478,19/)
    expect(within(purchases).getByTestId('total')).toHaveTextContent(/478,19/)

    release()
    expect(await within(purchases).findByRole('group', { name: 'Cartão Nubank' })).toBeInTheDocument()
  })

  it('mantém o accountId como título, sem erro na tela, quando a lista de nomes falha', async () => {
    server.use(
      http.get(url, () => HttpResponse.json({ ...summaryFixture, partial: false, errors: [] })),
      http.get(accountsUrl, () => HttpResponse.json({ status: 502, error: 'Bad Gateway', message: 'Pluggy fora' }, { status: 502 })),
    )
    renderWithProviders(<OverviewPage />)

    const purchases = await screen.findByRole('region', { name: 'Compras do cartão sem fatura' })
    expect(await within(purchases).findByRole('group', { name: 'c1' })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('usa o accountId quando a lista de nomes não traz o cartão', async () => {
    server.use(
      http.get(url, () => HttpResponse.json(twoOwners)),
      http.get(accountsUrl, () =>
        accountsResponse([{ owner: 'marcelo', accounts: [cardAccount('c1', 'Cartão Nubank')], error: null }]),
      ),
    )
    renderWithProviders(<OverviewPage />)
    await screen.findByRole('group', { name: 'Cartão Nubank' })

    expect(groupNames()).toEqual(['c2', 'Cartão Nubank', 'c1'])
  })

  it('deixa a compra estrangeira sem valor em BRL na lista e fora do subtotal, com aviso', async () => {
    const summary = summaryWith(
      {
        marcelo: [
          purchase('a', 'c1', 30),
          purchase('b', 'c1', 58, { currencyCode: 'USD', description: 'Sem conversão' }),
        ],
      },
      30,
    )
    server.use(http.get(url, () => HttpResponse.json(summary)))
    renderWithProviders(<OverviewPage />)

    const group = await screen.findByRole('group', { name: 'Cartão Nubank' })
    expect(within(group).getByTestId('group-subtotal')).toHaveTextContent(/30,00/)
    expect(within(group).getByText(/Sem conversão/)).toBeInTheDocument()
    expect(within(group).getByText('1 compra em outra moeda sem valor em BRL está fora do subtotal.')).toBeInTheDocument()
  })

  it('mostra "Nenhum item." e nenhum grupo quando não há compras', async () => {
    server.use(http.get(url, () => HttpResponse.json(summaryWith({}, 0))))
    renderWithProviders(<OverviewPage />)
    const purchases = await screen.findByRole('region', { name: 'Compras do cartão sem fatura' })

    expect(within(purchases).getByText('Nenhum item.')).toBeInTheDocument()
    expect(within(purchases).queryByTestId('group-subtotal')).not.toBeInTheDocument()
  })

  it('não agrupa os outros cards', async () => {
    server.use(http.get(url, () => HttpResponse.json(summaryFixture)))
    renderWithProviders(<OverviewPage />)
    await screen.findByRole('region', { name: 'Saldo disponível' })

    for (const name of ['Saldo disponível', 'Entradas no período', 'Faturas a pagar']) {
      expect(within(card(name)).queryByTestId('group-subtotal')).not.toBeInTheDocument()
    }
    expect(within(card('Faturas a pagar')).getByText(/Cartão Nubank · vence em 20\/11\/2026 · .*250,40/)).toBeInTheDocument()
  })
})
