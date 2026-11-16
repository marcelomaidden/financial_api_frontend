import { getJson } from './client'
import type {
  BillsResponse,
  OwnerAccounts,
  OwnerCreditCards,
  OwnerLoans,
  OwnersResponse,
  SummaryResponse,
  TransactionsResponse,
} from './types'

export interface DateRange {
  dateFrom?: string
  dateTo?: string
}

export function fetchSummary(range: DateRange = {}, signal?: AbortSignal) {
  return getJson<SummaryResponse>('/summary', { ...range }, signal)
}

export function fetchAccounts(signal?: AbortSignal) {
  return getJson<OwnersResponse<OwnerAccounts>>('/accounts', undefined, signal)
}

export function fetchCreditCards(signal?: AbortSignal) {
  return getJson<OwnersResponse<OwnerCreditCards>>('/credit-cards', undefined, signal)
}

export function fetchLoans(signal?: AbortSignal) {
  return getJson<OwnersResponse<OwnerLoans>>('/loans', undefined, signal)
}

export function fetchBills(owner: string, accountId: string, page?: number, pageSize?: number, signal?: AbortSignal) {
  return getJson<BillsResponse>(
    `/owners/${encodeURIComponent(owner)}/accounts/${encodeURIComponent(accountId)}/bills`,
    { page, pageSize },
    signal,
  )
}

export function fetchTransactionsPage(
  owner: string,
  accountId: string,
  range: DateRange,
  after?: string | null,
  signal?: AbortSignal,
) {
  return getJson<TransactionsResponse>(
    `/owners/${encodeURIComponent(owner)}/accounts/${encodeURIComponent(accountId)}/transactions`,
    { ...range, after },
    signal,
  )
}
