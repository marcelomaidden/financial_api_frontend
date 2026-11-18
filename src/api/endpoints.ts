import { getJson } from './client'
import type {
  BillDetailResponse,
  BillsResponse,
  OwnerAccounts,
  OwnerCreditCards,
  OwnerLoans,
  OwnersResponse,
  SummaryResponse,
  ConsolidatedTransactionsResponse,
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

/** Detalhe de uma fatura (`id` é o `bills[].id` da listagem). `owner` e `accountId` são obrigatórios na API. */
export function fetchBillDetail(owner: string, accountId: string, id: string, signal?: AbortSignal) {
  return getJson<BillDetailResponse>(`/bill/${encodeURIComponent(id)}`, { owner, accountId }, signal)
}

export interface TransactionsFilter extends DateRange {
  owner?: string
  /** Exige `owner`. */
  accountId?: string
}

/** Todas as transações em uma chamada. Sem datas, a API usa o mês corrente. */
export function fetchTransactions(filter: TransactionsFilter = {}, signal?: AbortSignal) {
  return getJson<ConsolidatedTransactionsResponse>('/transactions', { ...filter }, signal)
}
