import type { ExpenseTransaction } from '../api/types'
import { groupByAccount, toCents, type AccountGroup } from './groupByAccount'

export type PurchaseGroup = AccountGroup<ExpenseTransaction>

/** Valor em BRL da compra, em centavos, ou `null` quando a compra não entra na soma. */
function countedCents(purchase: ExpenseTransaction): number | null {
  if (purchase.currencyCode === 'BRL') return toCents(purchase.amount)
  return purchase.amountInAccountCurrency === undefined ? null : toCents(purchase.amountInAccountCurrency)
}

/**
 * Agrupa as compras sem fatura por dono e cartão. Compra em outra moeda sem `amountInAccountCurrency`
 * aparece na lista e fica fora do subtotal, como no total da API.
 */
export function groupPurchases(detail: Record<string, ExpenseTransaction[]>): PurchaseGroup[] {
  return groupByAccount(detail, {
    accountId: (purchase) => purchase.accountId,
    date: (purchase) => purchase.date,
    cents: countedCents,
  })
}
