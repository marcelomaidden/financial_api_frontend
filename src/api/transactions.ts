import { fetchAccounts, fetchTransactions, type DateRange } from './endpoints'
import type { Transaction } from './types'

export interface TransactionRow {
  owner: string
  accountId: string
  /** Nome da conta ou do cartão. Cai para o id quando a API não o informa. */
  accountName: string
  transaction: Transaction
}

export interface TransactionWarning {
  owner: string
  /** `null` quando a falha foi ao listar as contas do dono. */
  accountName: string | null
  message: string
}

export interface CombinedTransactions {
  rows: TransactionRow[]
  warnings: TransactionWarning[]
}

/** Nome de cada conta e cartão (`/accounts` traz os dois), por `owner:id`. Se falhar, o id vira o nome. */
async function fetchAccountNames(signal?: AbortSignal): Promise<Map<string, string>> {
  const names = new Map<string, string>()
  try {
    const response = await fetchAccounts(signal)
    for (const entry of response.owners)
      for (const account of entry.accounts) names.set(`${entry.owner}:${account.id}`, account.name)
  } catch (error) {
    if (signal?.aborted) throw error
  }
  return names
}

/** Transações de todos os donos e contas no período, na ordem em que a API devolve (data decrescente). */
export async function fetchCombinedTransactions(
  range: DateRange,
  signal?: AbortSignal,
): Promise<CombinedTransactions> {
  const [response, names] = await Promise.all([fetchTransactions(range, signal), fetchAccountNames(signal)])
  const nameOf = (owner: string, accountId: string) => names.get(`${owner}:${accountId}`) ?? accountId

  const rows = response.transactions.map(({ owner, accountId, ...transaction }) => ({
    owner,
    accountId,
    accountName: nameOf(owner, accountId),
    transaction,
  }))
  const warnings = response.errors.map((error) => ({
    owner: error.owner,
    accountName: error.accountId === null ? null : nameOf(error.owner, error.accountId),
    message: error.message,
  }))
  return { rows, warnings }
}
