import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { summaryFixture } from '../api/fixtures'
import type { Account, AccountDebit, ExpenseTransaction, IncomeAccount, IncomeTransaction, OwedBill, OwnerAccounts } from '../api/types'
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

function bankAccount(id: string, name: string): Account {
  return { id, itemId: 'i', type: 'BANK', subtype: 'CHECKING_ACCOUNT', name, number: null, balance: 0, currencyCode: 'BRL' }
}

/** Resposta de /accounts com os cartões usados nos testes (ela traz contas e cartões). */
function accountsResponse(owners: OwnerAccounts[]) {
  return HttpResponse.json({ owners })
}

const namedCards: OwnerAccounts[] = [
  {
    owner: 'marcelo',
    accounts: [
      cardAccount('c1', 'Cartão Nubank'),
      cardAccount('c2', 'Cartão Inter'),
      bankAccount('a1', 'Nubank'),
      bankAccount('a2', 'Inter'),
    ],
    error: null,
  },
  { owner: 'luana', accounts: [cardAccount('c1', 'Cartão da Luana'), bankAccount('a1', 'Conta da Luana')], error: null },
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

  it('mostra parcela e valor em BRL de compra estrangeira', async () => {
    server.use(http.get(url, () => HttpResponse.json(summaryFixture)))
    renderWithProviders(<OverviewPage />)
    const purchases = await screen.findByRole('region', { name: 'Compras do cartão sem fatura' })

    const notebook = within(purchases).getByText('Notebook').closest('li')!
    expect(notebook).toHaveTextContent('3/10')
    const netflix = within(purchases).getByText('Netflix').closest('li')!
    expect(netflix.querySelector('span.text-red-600')).toHaveTextContent(/− .*298,19/)
    expect(within(netflix).getByText(/US\$.*58,00/)).toBeInTheDocument()
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

  it('mostra cada compra como saída, com ícone, data, parcela e valor vermelho com "−"', async () => {
    server.use(http.get(url, () => HttpResponse.json(summaryFixture)))
    renderWithProviders(<OverviewPage />)
    const group = await screen.findByRole('group', { name: 'Cartão Nubank' })

    expect(within(group).getAllByRole('img', { name: 'Saída' })).toHaveLength(3)
    expect(within(group).queryByRole('img', { name: 'Entrada' })).not.toBeInTheDocument()

    const mercado = within(group).getByText('Mercado').closest('li')!
    expect(mercado).toHaveTextContent('06/11/2026')
    expect(mercado.querySelector('span.text-red-600')).toHaveTextContent(/− .*30,00/)
    // Só a data é apagada: sem parcela nem valor original.
    expect(mercado.querySelectorAll('span.text-xs')).toHaveLength(1)

    const notebook = within(group).getByText('Notebook').closest('li')!
    expect(notebook).toHaveTextContent('06/09/2026')
    expect(notebook).toHaveTextContent('3/10')
    expect(notebook.querySelector('span.text-red-600')).toHaveTextContent(/− .*150,00/)
  })

  it('mostra o BRL como valor principal e o valor original apagado na compra estrangeira', async () => {
    server.use(http.get(url, () => HttpResponse.json(summaryFixture)))
    renderWithProviders(<OverviewPage />)
    const group = await screen.findByRole('group', { name: 'Cartão Nubank' })

    const netflix = within(group).getByText('Netflix').closest('li')!
    const main = netflix.querySelector('span.text-red-600')!
    expect(main).toHaveTextContent(/− .*298,19/)
    expect(main).not.toHaveTextContent('US$')
    const note = within(netflix).getByText(/US\$.*58,00/)
    expect(note).toHaveClass('text-xs')
  })

  it('mostra só o valor original, sem nota, quando a compra estrangeira não tem valor em BRL', async () => {
    const summary = summaryWith(
      { marcelo: [purchase('b', 'c1', 58, { currencyCode: 'USD', description: 'Sem conversão' })] },
      0,
    )
    server.use(http.get(url, () => HttpResponse.json(summary)))
    renderWithProviders(<OverviewPage />)
    const group = await screen.findByRole('group', { name: 'Cartão Nubank' })

    const row = within(group).getByText('Sem conversão').closest('li')!
    expect(row.querySelector('span.text-red-600')).toHaveTextContent(/− .*US\$.*58,00/)
    expect(within(row).getAllByText(/US\$/)).toHaveLength(1)
  })

  it('mostra o dono e o cartão só no cabeçalho do grupo, e não em cada linha', async () => {
    server.use(http.get(url, () => HttpResponse.json(twoOwners)))
    renderWithProviders(<OverviewPage />)
    const group = await screen.findByRole('group', { name: 'Cartão Nubank' })

    expect(within(group).getAllByRole('img', { name: 'marcelo' })).toHaveLength(1)
    for (const row of within(group).getAllByRole('listitem')) {
      expect(within(row).queryByRole('img', { name: 'marcelo' })).not.toBeInTheDocument()
      expect(within(row).queryByText('Cartão Nubank')).not.toBeInTheDocument()
    }
  })

  it('mostra "Nenhum item." e nenhum grupo quando não há compras', async () => {
    server.use(http.get(url, () => HttpResponse.json(summaryWith({}, 0))))
    renderWithProviders(<OverviewPage />)
    const purchases = await screen.findByRole('region', { name: 'Compras do cartão sem fatura' })

    expect(within(purchases).getByText('Nenhum item.')).toBeInTheDocument()
    expect(within(purchases).queryByTestId('group-subtotal')).not.toBeInTheDocument()
  })

  it('agrupa só Entradas e Compras, e os totais dos quatro cards não mudam', async () => {
    server.use(http.get(url, () => HttpResponse.json(summaryFixture)))
    renderWithProviders(<OverviewPage />)
    await screen.findByRole('region', { name: 'Saldo disponível' })

    for (const name of ['Entradas no período', 'Compras do cartão sem fatura']) {
      expect(within(card(name)).getAllByTestId('group-subtotal').length).toBeGreaterThan(0)
    }
    for (const name of ['Saldo disponível', 'Faturas a pagar']) {
      expect(within(card(name)).queryByTestId('group-subtotal')).not.toBeInTheDocument()
    }

    expect(within(card('Saldo disponível')).getByTestId('total')).toHaveTextContent(/500,50/)
    expect(within(card('Entradas no período')).getByTestId('total')).toHaveTextContent(/19,99/)
    expect(within(card('Faturas a pagar')).getByTestId('total')).toHaveTextContent(/250,40/)
    expect(within(card('Compras do cartão sem fatura')).getByTestId('total')).toHaveTextContent(/478,19/)
  })
})

describe('OverviewPage: entradas do período por conta', () => {
  function incomeTx(id: string, accountId: string, amount: number, extra: Partial<IncomeTransaction> = {}): IncomeTransaction {
    return {
      id,
      accountId,
      description: `Entrada ${id}`,
      amount,
      currencyCode: 'BRL',
      date: '2026-11-05T10:00:00Z',
      ...extra,
    }
  }

  function summaryWithIncomes(detail: Record<string, IncomeTransaction[]>, total: number) {
    return {
      ...summaryFixture,
      partial: false,
      errors: [],
      incomes: { ...summaryFixture.incomes, transactions: { total: { value: total, currencyCode: 'BRL' }, detail } },
    }
  }

  const incomesCard = () => within(card('Entradas no período'))

  const threeAccounts = summaryWithIncomes(
    {
      marcelo: [incomeTx('a', 'a1', 100), incomeTx('b', 'a1', 50), incomeTx('c', 'a2', 400)],
      luana: [incomeTx('d', 'a1', 70)],
    },
    620,
  )

  it('agrupa a entrada do resumo de exemplo em uma conta com nome, dono e subtotal', async () => {
    server.use(http.get(url, () => HttpResponse.json(summaryFixture)))
    renderWithProviders(<OverviewPage />)
    await screen.findByRole('region', { name: 'Entradas no período' })

    const group = await incomesCard().findByRole('group', { name: 'Nubank' })
    expect(within(group).getByRole('img', { name: 'marcelo' })).toBeInTheDocument()
    expect(within(group).getByTestId('group-subtotal')).toHaveTextContent(/19,99/)
    expect(within(group).getAllByRole('listitem')).toHaveLength(1)
    expect(incomesCard().getByTestId('total')).toHaveTextContent(/19,99/)
  })

  it('separa as contas, ordena pelo maior subtotal e os subtotais somam o total do card', async () => {
    server.use(http.get(url, () => HttpResponse.json(threeAccounts)))
    renderWithProviders(<OverviewPage />)
    await screen.findByRole('region', { name: 'Entradas no período' })
    await incomesCard().findByRole('group', { name: 'Inter' })

    const names = incomesCard()
      .getAllByRole('group')
      .map((group) => group.getAttribute('aria-label'))
      .filter((name): name is string => name !== null)
    expect(names).toEqual(['Inter', 'Nubank', 'Conta da Luana'])

    const subtotal = (name: string) =>
      within(incomesCard().getByRole('group', { name })).getByTestId('group-subtotal').textContent ?? ''
    expect(subtotal('Inter')).toMatch(/400,00/)
    expect(subtotal('Nubank')).toMatch(/150,00/)
    expect(subtotal('Conta da Luana')).toMatch(/70,00/)
    // 400 + 150 + 70 = 620: mesmos centavos do total do card.
    expect(incomesCard().getByTestId('total')).toHaveTextContent(/620,00/)
  })

  it('mostra a entrada como entrada, com ícone, data e valor verde sem "−"', async () => {
    server.use(http.get(url, () => HttpResponse.json(summaryFixture)))
    renderWithProviders(<OverviewPage />)
    await screen.findByRole('region', { name: 'Entradas no período' })
    const group = await incomesCard().findByRole('group', { name: 'Nubank' })

    const row = within(group).getByText('PIX Recebido').closest('li')!
    expect(within(row).getByRole('img', { name: 'Entrada' })).toBeInTheDocument()
    expect(row).toHaveTextContent('10/11/2026')
    const amount = row.querySelector('span.text-green-600')!
    expect(amount).toHaveTextContent(/19,99/)
    expect(amount).not.toHaveTextContent('−')
    expect(row.querySelector('span.text-red-600')).toBeNull()
  })

  it('mostra o dono e a conta só no cabeçalho do grupo, e não em cada linha', async () => {
    server.use(http.get(url, () => HttpResponse.json(threeAccounts)))
    renderWithProviders(<OverviewPage />)
    await screen.findByRole('region', { name: 'Entradas no período' })
    const group = await incomesCard().findByRole('group', { name: 'Nubank' })

    expect(within(group).getAllByRole('img', { name: 'marcelo' })).toHaveLength(1)
    for (const row of within(group).getAllByRole('listitem')) {
      expect(within(row).queryByRole('img', { name: 'marcelo' })).not.toBeInTheDocument()
      expect(within(row).queryByText('Nubank')).not.toBeInTheDocument()
    }
  })

  it('ordena as entradas de cada conta da mais recente para a mais antiga', async () => {
    const summary = summaryWithIncomes(
      {
        marcelo: [
          incomeTx('nov5', 'a1', 10, { date: '2026-11-05T10:00:00Z' }),
          incomeTx('set6', 'a1', 10, { date: '2026-09-06T10:00:00Z' }),
          incomeTx('nov6', 'a1', 10, { date: '2026-11-06T10:00:00Z' }),
        ],
      },
      30,
    )
    server.use(http.get(url, () => HttpResponse.json(summary)))
    renderWithProviders(<OverviewPage />)
    await screen.findByRole('region', { name: 'Entradas no período' })
    const group = await incomesCard().findByRole('group', { name: 'Nubank' })

    const descriptions = within(group)
      .getAllByRole('listitem')
      .map((row) => row.textContent ?? '')
    expect(descriptions[0]).toContain('Entrada nov6')
    expect(descriptions[1]).toContain('Entrada nov5')
    expect(descriptions[2]).toContain('Entrada set6')
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
    await screen.findByRole('region', { name: 'Entradas no período' })

    const pending = await incomesCard().findByRole('group', { name: 'a1' })
    expect(within(pending).getByTestId('group-subtotal')).toHaveTextContent(/19,99/)
    expect(incomesCard().getByTestId('total')).toHaveTextContent(/19,99/)

    release()
    expect(await incomesCard().findByRole('group', { name: 'Nubank' })).toBeInTheDocument()
  })

  it('mantém o accountId como título, sem erro na tela, quando a lista de nomes falha', async () => {
    server.use(
      http.get(url, () => HttpResponse.json({ ...summaryFixture, partial: false, errors: [] })),
      http.get(accountsUrl, () => HttpResponse.json({ status: 502, error: 'Bad Gateway', message: 'Pluggy fora' }, { status: 502 })),
    )
    renderWithProviders(<OverviewPage />)
    await screen.findByRole('region', { name: 'Entradas no período' })

    expect(await incomesCard().findByRole('group', { name: 'a1' })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('usa o accountId quando a lista de nomes não traz a conta', async () => {
    server.use(
      http.get(url, () => HttpResponse.json(threeAccounts)),
      http.get(accountsUrl, () =>
        accountsResponse([{ owner: 'marcelo', accounts: [bankAccount('a1', 'Nubank')], error: null }]),
      ),
    )
    renderWithProviders(<OverviewPage />)
    await screen.findByRole('region', { name: 'Entradas no período' })
    await incomesCard().findByRole('group', { name: 'Nubank' })

    const names = incomesCard()
      .getAllByRole('group')
      .map((group) => group.getAttribute('aria-label'))
      .filter((name): name is string => name !== null)
    expect(names).toEqual(['a2', 'Nubank', 'a1'])
  })

  it('mostra "Nenhum item." e nenhum grupo quando não há entradas', async () => {
    server.use(http.get(url, () => HttpResponse.json(summaryWithIncomes({}, 0))))
    renderWithProviders(<OverviewPage />)
    await screen.findByRole('region', { name: 'Entradas no período' })

    expect(incomesCard().getByText('Nenhum item.')).toBeInTheDocument()
    expect(incomesCard().queryByTestId('group-subtotal')).not.toBeInTheDocument()
  })
})

describe('OverviewPage: faturas a pagar como linhas de saída', () => {
  function bill(id: string, name: string, dueDate: string, totalAmount: number): OwedBill {
    return { id, accountId: `acc-${id}`, name, dueDate, totalAmount, currencyCode: 'BRL' }
  }

  function summaryWithOwed(detail: Record<string, OwedBill[]>, total: number) {
    return {
      ...summaryFixture,
      partial: false,
      errors: [],
      expenses: { ...summaryFixture.expenses, owed: { total: { value: total, currencyCode: 'BRL' }, detail } },
    }
  }

  const owedCard = () => within(card('Faturas a pagar'))

  it('mostra a fatura como saída, com cartão, vencimento, dono e valor vermelho com "−"', async () => {
    server.use(http.get(url, () => HttpResponse.json(summaryFixture)))
    renderWithProviders(<OverviewPage />)
    await screen.findByRole('region', { name: 'Faturas a pagar' })

    const row = owedCard().getByText('Cartão Nubank').closest('li')!
    expect(within(row).getByRole('img', { name: 'Saída' })).toBeInTheDocument()
    expect(within(row).getByRole('img', { name: 'marcelo' })).toBeInTheDocument()
    expect(row).toHaveTextContent('vence em 20/11/2026')
    expect(row.querySelector('span.text-red-600')).toHaveTextContent(/− .*250,40/)
    expect(owedCard().getByTestId('total')).toHaveTextContent(/250,40/)
  })

  it('não agrupa as faturas: uma linha por fatura, sem cabeçalho de grupo', async () => {
    server.use(http.get(url, () => HttpResponse.json(summaryFixture)))
    renderWithProviders(<OverviewPage />)
    await screen.findByRole('region', { name: 'Faturas a pagar' })

    expect(owedCard().getAllByRole('listitem')).toHaveLength(1)
    expect(owedCard().queryByTestId('group-subtotal')).not.toBeInTheDocument()
  })

  it('mostra as faturas pelo vencimento, a que vence primeiro no topo', async () => {
    const summary = summaryWithOwed(
      {
        marcelo: [bill('x', 'Cartão A', '2026-11-25T00:00:00', 100), bill('y', 'Cartão B', '2026-11-10T00:00:00', 200)],
        luana: [bill('z', 'Cartão C', '2026-11-20T00:00:00', 300)],
      },
      600,
    )
    server.use(http.get(url, () => HttpResponse.json(summary)))
    renderWithProviders(<OverviewPage />)
    await screen.findByRole('region', { name: 'Faturas a pagar' })

    const rows = owedCard().getAllByRole('listitem')
    expect(rows[0]).toHaveTextContent('Cartão B')
    expect(rows[0]).toHaveTextContent('vence em 10/11/2026')
    expect(rows[1]).toHaveTextContent('Cartão C')
    expect(rows[2]).toHaveTextContent('Cartão A')
    expect(within(rows[1]).getByRole('img', { name: 'luana' })).toBeInTheDocument()
  })

  it('mostra "Nenhum item." quando não há faturas', async () => {
    server.use(http.get(url, () => HttpResponse.json(summaryWithOwed({}, 0))))
    renderWithProviders(<OverviewPage />)
    await screen.findByRole('region', { name: 'Faturas a pagar' })

    expect(owedCard().getByText('Nenhum item.')).toBeInTheDocument()
    expect(owedCard().queryByRole('listitem')).not.toBeInTheDocument()
  })
})

describe('OverviewPage: saldo disponível como linhas por conta', () => {
  function balance(id: string, name: string, value: number): IncomeAccount {
    return { id, name, balance: value, currencyCode: 'BRL' }
  }

  function summaryWithBalances(detail: Record<string, IncomeAccount[]>, total: number) {
    return {
      ...summaryFixture,
      partial: false,
      errors: [],
      incomes: { ...summaryFixture.incomes, available: { total: { value: total, currencyCode: 'BRL' }, detail } },
    }
  }

  const balancesCard = () => within(card('Saldo disponível'))

  it('mostra a conta com o avatar do dono, o nome e o saldo em cor neutra', async () => {
    server.use(http.get(url, () => HttpResponse.json(summaryFixture)))
    renderWithProviders(<OverviewPage />)
    await screen.findByRole('region', { name: 'Saldo disponível' })

    const row = balancesCard().getByText('Nubank').closest('li')!
    expect(within(row).getByRole('img', { name: 'marcelo' })).toBeInTheDocument()
    expect(within(row).queryByRole('img', { name: 'Entrada' })).not.toBeInTheDocument()
    expect(within(row).queryByRole('img', { name: 'Saída' })).not.toBeInTheDocument()
    expect(row).toHaveTextContent(/500,50/)
    expect(row.querySelector('span.text-green-600, span.text-red-600')).toBeNull()
    expect(row).not.toHaveTextContent('−')
    expect(balancesCard().getByTestId('total')).toHaveTextContent(/500,50/)
  })

  it('não agrupa as contas: uma linha por conta, sem cabeçalho de grupo', async () => {
    server.use(http.get(url, () => HttpResponse.json(summaryFixture)))
    renderWithProviders(<OverviewPage />)
    await screen.findByRole('region', { name: 'Saldo disponível' })

    expect(balancesCard().getAllByRole('listitem')).toHaveLength(1)
    expect(balancesCard().queryByTestId('group-subtotal')).not.toBeInTheDocument()
  })

  it('mostra o saldo negativo com o sinal, na mesma cor neutra', async () => {
    const summary = summaryWithBalances({ marcelo: [balance('a', 'Conta no vermelho', -50)] }, -50)
    server.use(http.get(url, () => HttpResponse.json(summary)))
    renderWithProviders(<OverviewPage />)
    await screen.findByRole('region', { name: 'Saldo disponível' })

    const row = balancesCard().getByText('Conta no vermelho').closest('li')!
    expect(row).toHaveTextContent(/-\s*R\$\s*50,00/)
    expect(row.querySelector('span.text-green-600, span.text-red-600')).toBeNull()
  })

  it('mostra as contas pelo maior saldo primeiro', async () => {
    const summary = summaryWithBalances(
      {
        marcelo: [balance('a', 'Conta A', 100), balance('b', 'Conta B', 900)],
        luana: [balance('c', 'Conta C', 300)],
      },
      1300,
    )
    server.use(http.get(url, () => HttpResponse.json(summary)))
    renderWithProviders(<OverviewPage />)
    await screen.findByRole('region', { name: 'Saldo disponível' })

    const rows = balancesCard().getAllByRole('listitem')
    expect(rows[0]).toHaveTextContent('Conta B')
    expect(rows[1]).toHaveTextContent('Conta C')
    expect(within(rows[1]).getByRole('img', { name: 'luana' })).toBeInTheDocument()
    expect(rows[2]).toHaveTextContent('Conta A')
  })

  it('mostra "Nenhum item." quando não há contas', async () => {
    server.use(http.get(url, () => HttpResponse.json(summaryWithBalances({}, 0))))
    renderWithProviders(<OverviewPage />)
    await screen.findByRole('region', { name: 'Saldo disponível' })

    expect(balancesCard().getByText('Nenhum item.')).toBeInTheDocument()
    expect(balancesCard().queryByRole('listitem')).not.toBeInTheDocument()
  })
})

describe('OverviewPage: saídas do período por conta', () => {
  function debitTx(id: string, accountId: string, amount: number, extra: Partial<AccountDebit> = {}): AccountDebit {
    return {
      id,
      description: `Saída ${id}`,
      amount,
      currencyCode: 'BRL',
      date: '2026-11-10T12:00:00Z',
      accountId,
      ...extra,
    }
  }

  function summaryWithDebits(detail: Record<string, AccountDebit[]>, total: number) {
    return {
      ...summaryFixture,
      partial: false,
      errors: [],
      expenses: { ...summaryFixture.expenses, accountDebits: { total: { value: total, currencyCode: 'BRL' }, detail } },
    }
  }

  const outflowsCard = () => within(card('Saídas no período'))

  it('mostra o total e a saída do resumo de exemplo agrupada na conta, com nome, dono e subtotal', async () => {
    server.use(http.get(url, () => HttpResponse.json(summaryFixture)))
    renderWithProviders(<OverviewPage />)
    await screen.findByRole('region', { name: 'Saídas no período' })

    expect(outflowsCard().getByTestId('total')).toHaveTextContent(/42,50/)
    const group = await outflowsCard().findByRole('group', { name: 'Nubank' })
    expect(within(group).getByRole('img', { name: 'marcelo' })).toBeInTheDocument()
    expect(within(group).getByTestId('group-subtotal')).toHaveTextContent(/42,50/)
    const row = within(group).getByText('Padaria Central').closest('li')!
    expect(within(row).getByRole('img', { name: 'Saída' })).toBeInTheDocument()
    expect(row.querySelector('span.text-red-600')).toHaveTextContent(/− .*42,50/)
  })

  it('agrupa por conta com subtotal, da maior para a menor, e o total geral', async () => {
    const summary = summaryWithDebits(
      {
        marcelo: [debitTx('a', 'a1', 100), debitTx('b', 'a1', 50), debitTx('c', 'a2', 400)],
        luana: [debitTx('d', 'a1', 70)],
      },
      620,
    )
    server.use(http.get(url, () => HttpResponse.json(summary)))
    renderWithProviders(<OverviewPage />)
    await screen.findByRole('region', { name: 'Saídas no período' })

    expect(outflowsCard().getByTestId('total')).toHaveTextContent(/620,00/)
    const names = outflowsCard()
      .getAllByRole('group')
      .map((group) => group.getAttribute('aria-label'))
      .filter((name): name is string => name !== null)
    expect(names).toEqual(['Inter', 'Nubank', 'Conta da Luana'])
    const subtotals = outflowsCard()
      .getAllByTestId('group-subtotal')
      .map((node) => node.textContent)
    expect(subtotals[0]).toMatch(/400,00/)
    expect(subtotals[1]).toMatch(/150,00/)
    expect(subtotals[2]).toMatch(/70,00/)
  })

  it('mostra "Nenhum item." e o total zerado quando não há saídas', async () => {
    server.use(http.get(url, () => HttpResponse.json(summaryWithDebits({}, 0))))
    renderWithProviders(<OverviewPage />)
    await screen.findByRole('region', { name: 'Saídas no período' })

    expect(outflowsCard().getByTestId('total')).toHaveTextContent(/0,00/)
    expect(outflowsCard().getByText('Nenhum item.')).toBeInTheDocument()
    expect(outflowsCard().queryByTestId('group-subtotal')).not.toBeInTheDocument()
  })

  it('avisa que pagamentos de fatura e transferências próprias estão incluídos', async () => {
    server.use(http.get(url, () => HttpResponse.json(summaryFixture)))
    renderWithProviders(<OverviewPage />)
    await screen.findByRole('region', { name: 'Saídas no período' })

    expect(outflowsCard().getByText(/pagamentos de fatura e transferências entre contas próprias/i)).toBeInTheDocument()
    expect(outflowsCard().getByText(/as transferências se anulam no resultado do período/i)).toBeInTheDocument()
  })

  it('refaz a consulta e mostra as saídas do novo período ao mudar De e Até', async () => {
    const other = summaryWithDebits({ marcelo: [debitTx('z', 'a1', 9.9)] }, 9.9)
    server.use(
      http.get(url, ({ request }) =>
        HttpResponse.json(new URL(request.url).searchParams.get('dateFrom') === '2026-10-01' ? other : summaryFixture),
      ),
    )
    renderWithProviders(<OverviewPage />)
    await screen.findByRole('region', { name: 'Saídas no período' })
    expect(outflowsCard().getByTestId('total')).toHaveTextContent(/42,50/)

    await userEvent.type(screen.getByLabelText('De'), '2026-10-01')
    await userEvent.type(screen.getByLabelText('Até'), '2026-10-31')

    await waitFor(() => expect(outflowsCard().getByTestId('total')).toHaveTextContent(/9,90/))
  })
})

describe('OverviewPage: grupos Entradas e Despesas', () => {
  it('mostra os títulos Entradas e Despesas, cada um com os cards do seu grupo', async () => {
    server.use(http.get(url, () => HttpResponse.json(summaryFixture)))
    renderWithProviders(<OverviewPage />)
    await screen.findByRole('region', { name: 'Saldo disponível' })

    expect(screen.getByRole('heading', { level: 2, name: 'Entradas' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Despesas' })).toBeInTheDocument()

    const incomes = within(screen.getByRole('region', { name: 'Entradas' }))
    expect(incomes.getByRole('region', { name: 'Saldo disponível' })).toBeInTheDocument()
    expect(incomes.getByRole('region', { name: 'Entradas no período' })).toBeInTheDocument()
    expect(incomes.queryByRole('region', { name: 'Saídas no período' })).not.toBeInTheDocument()
    expect(incomes.queryByRole('region', { name: 'Faturas a pagar' })).not.toBeInTheDocument()

    const expenses = within(screen.getByRole('region', { name: 'Despesas' }))
    expect(expenses.getByRole('region', { name: 'Saídas no período' })).toBeInTheDocument()
    expect(expenses.getByRole('region', { name: 'Faturas a pagar' })).toBeInTheDocument()
    expect(expenses.getByRole('region', { name: 'Compras do cartão sem fatura' })).toBeInTheDocument()
    expect(expenses.queryByRole('region', { name: 'Saldo disponível' })).not.toBeInTheDocument()
    expect(expenses.queryByRole('region', { name: 'Entradas no período' })).not.toBeInTheDocument()
  })

  it('mantém o título de cada card como h3, abaixo do título do grupo', async () => {
    server.use(http.get(url, () => HttpResponse.json(summaryFixture)))
    renderWithProviders(<OverviewPage />)
    await screen.findByRole('region', { name: 'Saldo disponível' })

    const titles = screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)
    expect(titles).toEqual([
      'Saldo disponível',
      'Entradas no período',
      'Saídas no período',
      'Faturas a pagar',
      'Compras do cartão sem fatura',
    ])
  })
})

describe('OverviewPage: resultado do período', () => {
  function inc(id: string, accountId: string, amount: number): IncomeTransaction {
    return { id, description: `Entrada ${id}`, amount, currencyCode: 'BRL', date: '2026-11-10T12:00:00Z', accountId }
  }
  function out(id: string, accountId: string, amount: number): AccountDebit {
    return { id, description: `Saída ${id}`, amount, currencyCode: 'BRL', date: '2026-11-10T12:00:00Z', accountId }
  }
  function money(value: number) {
    return { value, currencyCode: 'BRL' }
  }
  function summaryWithFlows(
    incomes: Record<string, IncomeTransaction[]>,
    incomesTotal: number,
    debits: Record<string, AccountDebit[]>,
    debitsTotal: number,
  ) {
    return {
      ...summaryFixture,
      partial: false,
      errors: [],
      incomes: { ...summaryFixture.incomes, transactions: { total: money(incomesTotal), detail: incomes } },
      expenses: { ...summaryFixture.expenses, accountDebits: { total: money(debitsTotal), detail: debits } },
    }
  }

  const resultCard = () => within(card('Resultado do período'))
  const totalOf = () => resultCard().getByTestId('total').querySelector('span')!

  it('aparece no topo, antes dos grupos e fora deles, com título h2', async () => {
    server.use(http.get(url, () => HttpResponse.json(summaryFixture)))
    renderWithProviders(<OverviewPage />)
    await screen.findByRole('region', { name: 'Resultado do período' })

    const result = card('Resultado do período')
    const incomes = screen.getByRole('region', { name: 'Entradas' })
    const expenses = screen.getByRole('region', { name: 'Despesas' })
    expect(result.compareDocumentPosition(incomes) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(incomes.contains(result)).toBe(false)
    expect(expenses.contains(result)).toBe(false)
    expect(screen.getByRole('heading', { level: 2, name: 'Resultado do período' })).toBeInTheDocument()
  })

  it('mostra entradas menos saídas do resumo de exemplo na cor de saída, com "−"', async () => {
    server.use(http.get(url, () => HttpResponse.json(summaryFixture)))
    renderWithProviders(<OverviewPage />)
    await screen.findByRole('region', { name: 'Resultado do período' })

    expect(totalOf()).toHaveTextContent(/− .*22,51/)
    expect(totalOf()).toHaveClass('text-red-600')
  })

  it('mostra o resultado positivo na cor de entrada, sem "−"', async () => {
    const summary = summaryWithFlows({ marcelo: [inc('a', 'a1', 10000)] }, 10000, { marcelo: [out('b', 'a1', 8500)] }, 8500)
    server.use(http.get(url, () => HttpResponse.json(summary)))
    renderWithProviders(<OverviewPage />)
    await screen.findByRole('region', { name: 'Resultado do período' })

    expect(totalOf()).toHaveTextContent(/1\.500,00/)
    expect(totalOf()).not.toHaveTextContent('−')
    expect(totalOf()).toHaveClass('text-green-600')
  })

  it('mostra zero em cor neutra e "Nenhum item." sem movimento', async () => {
    server.use(http.get(url, () => HttpResponse.json(summaryWithFlows({}, 0, {}, 0))))
    renderWithProviders(<OverviewPage />)
    await screen.findByRole('region', { name: 'Resultado do período' })

    expect(totalOf()).toHaveTextContent(/0,00/)
    expect(totalOf()).not.toHaveTextContent('−')
    expect(totalOf().className).toBe('')
    expect(resultCard().getByText('Nenhum item.')).toBeInTheDocument()
    expect(resultCard().queryByTestId('result-account')).not.toBeInTheDocument()
  })

  it('anula a transferência entre contas dos donos no detalhe por conta', async () => {
    const summary = summaryWithFlows({ luana: [inc('t-in', 'a1', 1000)] }, 1000, { marcelo: [out('t-out', 'a1', 1000)] }, 1000)
    server.use(http.get(url, () => HttpResponse.json(summary)))
    renderWithProviders(<OverviewPage />)
    await screen.findByRole('region', { name: 'Resultado do período' })

    expect(totalOf()).toHaveTextContent(/0,00/)
    const rows = await waitFor(() => {
      const found = resultCard().getAllByTestId('result-account')
      expect(found[0]).toHaveTextContent('Conta da Luana')
      return found
    })
    expect(rows).toHaveLength(2)
    expect(within(rows[0]).getByRole('img', { name: 'luana' })).toBeInTheDocument()
    expect(within(rows[0]).getByTestId('result-amount')).toHaveTextContent(/^R\$\s1\.000,00$/)
    expect(rows[1]).toHaveTextContent('Nubank')
    expect(within(rows[1]).getByRole('img', { name: 'marcelo' })).toBeInTheDocument()
    expect(within(rows[1]).getByTestId('result-amount')).toHaveTextContent(/− .*1\.000,00/)
    expect(within(rows[1]).getByTestId('result-amount').querySelector('span')).toHaveClass('text-red-600')
  })

  it('mostra R$ 0,00 em "entrou" para conta só com saídas, e as contas pelo resultado', async () => {
    const summary = summaryWithFlows(
      { marcelo: [inc('a', 'a1', 700), inc('c', 'a2', 800)] },
      1500,
      { luana: [out('b', 'a1', 200)] },
      200,
    )
    server.use(http.get(url, () => HttpResponse.json(summary)))
    renderWithProviders(<OverviewPage />)
    await screen.findByRole('region', { name: 'Resultado do período' })

    const rows = resultCard().getAllByTestId('result-account')
    expect(rows.map((row) => within(row).getByTestId('result-amount').textContent)).toEqual([
      expect.stringMatching(/800,00/),
      expect.stringMatching(/700,00/),
      expect.stringMatching(/− .*200,00/),
    ])
    expect(rows[2]).toHaveTextContent(/entrou R\$\s0,00 · saiu R\$\s200,00/)
    expect(resultCard().getByText('Ver detalhe (3)')).toBeInTheDocument()
  })

  it('recalcula o resultado ao mudar De e Até', async () => {
    const october = summaryWithFlows({ marcelo: [inc('o', 'a1', 300)] }, 300, { marcelo: [out('p', 'a1', 100)] }, 100)
    server.use(
      http.get(url, ({ request }) =>
        HttpResponse.json(new URL(request.url).searchParams.get('dateFrom') === '2026-10-01' ? october : summaryFixture),
      ),
    )
    renderWithProviders(<OverviewPage />)
    await screen.findByRole('region', { name: 'Resultado do período' })
    expect(totalOf()).toHaveTextContent(/22,51/)

    await userEvent.type(screen.getByLabelText('De'), '2026-10-01')
    await userEvent.type(screen.getByLabelText('Até'), '2026-10-31')

    await waitFor(() => expect(totalOf()).toHaveTextContent(/200,00/))
    expect(totalOf()).not.toHaveTextContent('−')
  })
})
