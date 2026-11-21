import type { BillDetailResponse, OwnerAccounts, OwnerCreditCards, OwnerLoans, SummaryResponse } from './types'

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
    accountDebits: {
      total: { value: 42.5, currencyCode: 'BRL' },
      detail: {
        marcelo: [
          {
            id: 'd1',
            description: 'Padaria Central',
            amount: 42.5,
            currencyCode: 'BRL',
            date: '2026-11-08T12:00:00Z',
            accountId: 'a1',
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

export const loansFixture: { owners: OwnerLoans[] } = {
  owners: [
    {
      owner: 'marcelo',
      loans: [
        {
          id: 'l1',
          itemId: 'i1',
          contractNumber: '000000721792794',
          productName: 'Crédito Pessoal Consignado',
          kind: 'LOAN',
          type: 'CREDITO_PESSOAL_COM_CONSIGNACAO',
          contractAmount: 50000,
          currencyCode: 'BRL',
          contractDate: '2022-08-01',
          dueDate: '2028-01-15',
          installments: { total: 120, paid: 65, remaining: 55, pastDue: 0 },
          outstandingBalance: 25000,
          lastPayment: { paidDate: '2023-07-15', paidAmount: 680.5 },
        },
      ],
      error: null,
    },
    {
      owner: 'luana',
      loans: [],
      error: { status: 502, error: 'Bad Gateway', message: 'Erro ao consultar a Pluggy' },
    },
  ],
}

// Exemplo do contrato de GET /bill/{id}.
export const billDetailFixture: BillDetailResponse = {
  owner: 'marcelo',
  accountId: 'c1',
  bill: {
    id: 'b1',
    dueDate: '2026-11-20',
    closingDate: '2026-11-10',
    totalAmount: 1520.75,
    currencyCode: 'BRL',
    minimumPaymentAmount: 228.11,
    allowsInstallments: true,
    financeCharges: [
      { id: 'fc1', type: 'IOF', amount: 12.5, currencyCode: 'BRL', additionalInfo: 'IOF internacional' },
    ],
    payments: [
      {
        id: 'p1',
        valueType: 'PARTIAL',
        paymentDate: '2026-11-18',
        paymentMode: 'PIX',
        amount: 300,
        currencyCode: 'BRL',
      },
    ],
  },
  transactions: [
    {
      id: 't1',
      date: '2026-11-10',
      description: 'Loja de Roupas',
      amount: 150,
      currencyCode: 'BRL',
      category: 'Compras',
      type: 'DEBIT',
      status: 'POSTED',
      installment: { number: 3, total: 10 },
    },
    {
      id: 't2',
      date: '2026-11-08',
      description: 'Estorno Mercado',
      amount: -20,
      currencyCode: 'BRL',
      category: null,
      type: 'CREDIT',
      status: 'POSTED',
    },
    {
      id: 't3',
      date: '2026-11-05',
      description: 'Netflix',
      amount: -58,
      currencyCode: 'USD',
      category: 'Video streaming',
      type: 'DEBIT',
      status: 'POSTED',
      amountInAccountCurrency: -298.19,
    },
  ],
}
