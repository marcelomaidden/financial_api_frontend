import { fetchAccounts, fetchTransactionsPage, type DateRange } from './endpoints'
import type { Account, Transaction } from './types'

const CONCURRENCY = 4
const MAX_PAGES_PER_ACCOUNT = 200

export interface TransactionRow {
  owner: string
  accountId: string
  accountName: string
  transaction: Transaction
}

export interface AccountFailure {
  owner: string
  accountName: string
  message: string
}

export interface CombinedTransactions {
  rows: TransactionRow[]
  /** Contas cuja consulta falhou. As demais continuam na lista. */
  failures: AccountFailure[]
  /** Donos cujas contas não puderam ser listadas. */
  ownerErrors: { owner: string; message: string }[]
}

export interface Progress {
  done: number
  total: number
}

async function runLimited<T>(tasks: (() => Promise<T>)[], limit: number): Promise<T[]> {
  const results: T[] = new Array(tasks.length)
  let next = 0
  async function worker() {
    while (next < tasks.length) {
      const index = next++
      results[index] = await tasks[index]()
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker))
  return results
}

async function fetchAllPages(owner: string, accountId: string, range: DateRange, signal?: AbortSignal) {
  const transactions: Transaction[] = []
  let cursor: string | null = null
  for (let page = 0; page < MAX_PAGES_PER_ACCOUNT; page++) {
    const response = await fetchTransactionsPage(owner, accountId, range, cursor, signal)
    transactions.push(...response.transactions)
    if (!response.nextCursor) return transactions
    cursor = response.nextCursor
  }
  throw new Error('Muitas páginas de transações.')
}

/** Reúne as transações de todas as contas de todos os donos no período, da mais recente para a mais antiga. */
export async function fetchCombinedTransactions(
  range: DateRange,
  signal?: AbortSignal,
  onProgress?: (progress: Progress) => void,
): Promise<CombinedTransactions> {
  const accountsResponse = await fetchAccounts(signal)

  const ownerErrors = accountsResponse.owners.flatMap((entry) =>
    entry.error ? [{ owner: entry.owner, message: entry.error.message }] : [],
  )
  const targets: { owner: string; account: Account }[] = accountsResponse.owners.flatMap((entry) =>
    entry.accounts.map((account) => ({ owner: entry.owner, account })),
  )

  let done = 0
  onProgress?.({ done, total: targets.length })

  const outcomes = await runLimited(
    targets.map(({ owner, account }) => async () => {
      try {
        const transactions = await fetchAllPages(owner, account.id, range, signal)
        return { owner, account, transactions }
      } catch (error) {
        if (signal?.aborted) throw error
        const message = error instanceof Error ? error.message : 'Erro desconhecido.'
        return { owner, account, error: message }
      } finally {
        done += 1
        onProgress?.({ done, total: targets.length })
      }
    }),
    CONCURRENCY,
  )

  const rows: TransactionRow[] = []
  const failures: AccountFailure[] = []
  for (const outcome of outcomes) {
    if (outcome.error !== undefined) {
      failures.push({ owner: outcome.owner, accountName: outcome.account.name, message: outcome.error })
      continue
    }
    for (const transaction of outcome.transactions ?? []) {
      rows.push({
        owner: outcome.owner,
        accountId: outcome.account.id,
        accountName: outcome.account.name,
        transaction,
      })
    }
  }
  rows.sort((a, b) => new Date(b.transaction.date).getTime() - new Date(a.transaction.date).getTime())

  return { rows, failures, ownerErrors }
}
