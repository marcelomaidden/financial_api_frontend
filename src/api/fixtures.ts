import type { OwnerAccounts, OwnerCreditCards, SummaryResponse } from './types'

// Exemplos baseados no README da financial_api.
export const summaryFixture: SummaryResponse = {
  incomes: {
    available: {
      total: { value: 500.5, currencyCode: 'BRL' },
      detail: { marcelo: [{ id: 'a1', name: 'Nubank', balance: 500.5, currencyCode: 'BRL' }] },
    },
    transactions: {
      total: { value: 19.99, currencyCode: 'BRL' },
      detail: {
        marcelo: [
          {
            id: 't1',
            description: 'PIX Recebido',
            amount: 19.99,
            currencyCode: 'BRL',
            date: '2026-11-10T12:00:00Z',
            accountId: 'a1',
          },
        ],
      },
    },
  },
  expenses: {
    owed: {
      total: { value: 250.4, currencyCode: 'BRL' },
      detail: {
        marcelo: [
          {
            id: 'b1',
            accountId: 'c1',
            name: 'Cartão Nubank',
            dueDate: '2026-11-20T00:00:00',
            totalAmount: 250.4,
            currencyCode: 'BRL',
          },
        ],
      },
    },
    transactions: {
      total: { value: 478.19, currencyCode: 'BRL' },
      detail: {
        marcelo: [
          {
            id: 'e1',
            accountId: 'c1',
            description: 'Netflix',
            currencyCode: 'USD',
            amount: 58,
            date: '2026-11-05T10:00:00Z',
            category: 'Video streaming',
            amountInAccountCurrency: 298.19,
          },
          {
            id: 'e2',
            accountId: 'c1',
            description: 'Mercado',
            currencyCode: 'BRL',
            amount: 30,
            date: '2026-11-06T10:00:00Z',
            category: 'Groceries',
          },
          {
            id: 'e3',
            accountId: 'c1',
            description: 'Notebook',
            currencyCode: 'BRL',
            amount: 150,
            date: '2026-09-06T10:00:00Z',
            category: 'Electronics',
            installment: { number: 3, total: 10 },
          },
        ],
      },
    },
  },
  partial: true,
  errors: [{ owner: 'luana', status: 502, message: 'Erro ao consultar a Pluggy' }],
}

export const accountsFixture: { owners: OwnerAccounts[] } = {
  owners: [
    {
      owner: 'marcelo',
      accounts: [
        {
          id: 'a1',
          itemId: 'i1',
          type: 'BANK',
          subtype: 'CHECKING_ACCOUNT',
          name: 'Nubank',
          number: '1234',
          balance: 500.5,
          currencyCode: 'BRL',
        },
      ],
      error: null,
    },
    {
      owner: 'luana',
      accounts: [],
      error: { status: 502, error: 'Bad Gateway', message: 'Erro ao consultar a Pluggy' },
    },
  ],
}

export const creditCardsFixture: { owners: OwnerCreditCards[] } = {
  owners: [
    {
      owner: 'marcelo',
      creditCards: [
        {
          id: 'c1',
          itemId: 'i1',
          name: 'Cartão Nubank',
          number: '5678',
          brand: 'VISA',
          balance: 250.4,
          currencyCode: 'BRL',
          creditLimit: 5000,
          availableCreditLimit: 4749.6,
          balanceCloseDate: '2026-11-13',
          balanceDueDate: '2026-11-20',
        },
      ],
      error: null,
    },
  ],
}
