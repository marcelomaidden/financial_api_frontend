// Tipos das respostas da financial_api (espelham os DTOs em resource/dto).
// Valores em BigDecimal chegam como number. Datas chegam como string ISO.

export interface ApiErrorBody {
  status: number
  error: string
  message: string
}

export interface Money {
  value: number
  currencyCode: string
}

export interface Account {
  id: string
  itemId: string
  type: string
  subtype: string | null
  name: string
  number: string | null
  balance: number
  currencyCode: string
}

export interface CreditCard {
  id: string
  itemId: string
  name: string
  number: string | null
  brand: string | null
  balance: number | null
  currencyCode: string
  creditLimit: number | null
  availableCreditLimit: number | null
  balanceCloseDate: string | null
  balanceDueDate: string | null
}

export interface OwnerAccounts {
  owner: string
  accounts: Account[]
  error: ApiErrorBody | null
}

export interface OwnerCreditCards {
  owner: string
  creditCards: CreditCard[]
  error: ApiErrorBody | null
}

export interface OwnersResponse<T> {
  owners: T[]
}

export interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  currencyCode: string
  type: string
  status: string
  category: string | null
}

export interface TransactionsResponse {
  owner: string
  accountId: string
  transactions: Transaction[]
  nextCursor: string | null
}

export interface Bill {
  id: string
  dueDate: string | null
  closingDate: string | null
  totalAmount: number
  currencyCode: string
  minimumPaymentAmount: number | null
}

export interface BillsResponse {
  owner: string
  accountId: string
  bills: Bill[]
  page: number | null
  totalPages: number | null
}

export interface IncomeAccount {
  id: string
  name: string
  balance: number
  currencyCode: string
}

export interface IncomeTransaction {
  id: string
  description: string
  amount: number
  currencyCode: string
  date: string
  accountId: string
}

export interface OwedBill {
  id: string
  accountId: string
  name: string
  dueDate: string
  totalAmount: number
  currencyCode: string
}

export interface Installment {
  number: number
  total: number
}

export interface ExpenseTransaction {
  id: string
  accountId: string
  description: string
  currencyCode: string
  amount: number
  date: string
  category: string | null
  amountInAccountCurrency?: number
  installment?: Installment
}

export interface SummarySection<T> {
  total: Money
  detail: Record<string, T[]>
}

export interface SummaryError {
  owner: string
  status: number
  message: string
}

export interface SummaryResponse {
  incomes: {
    available: SummarySection<IncomeAccount>
    transactions: SummarySection<IncomeTransaction>
  }
  expenses: {
    owed: SummarySection<OwedBill>
    transactions: SummarySection<ExpenseTransaction>
  }
  partial: boolean
  errors: SummaryError[]
}
