import type { ExpenseTransaction } from '../api/types'

export interface PurchaseGroup {
  /** `owner:accountId`, como em `api/transactions.ts`. */
  key: string
  owner: string
  accountId: string
  /** Subtotal em BRL, pela mesma regra do total da API. */
  subtotal: number
  /** Compras do grupo, da data mais recente para a mais antiga. */
  purchases: ExpenseTransaction[]
  /** Compras em outra moeda sem `amountInAccountCurrency`: aparecem na lista e ficam fora do subtotal. */
  excludedCount: number
}

const toCents = (value: number) => Math.round(value * 100)

/** Valor em BRL da compra, em centavos, ou `null` quando a compra não entra na soma. */
function countedCents(purchase: ExpenseTransaction): number | null {
  if (purchase.currencyCode === 'BRL') return toCents(purchase.amount)
  return purchase.amountInAccountCurrency === undefined ? null : toCents(purchase.amountInAccountCurrency)
}

/** Data inválida vira -Infinity: vai para o fim e mantém a ordem relativa (a ordenação é estável). */
function timeOf(purchase: ExpenseTransaction): number {
  const time = Date.parse(purchase.date)
  return Number.isNaN(time) ? -Infinity : time
}

function byDateDescending(a: ExpenseTransaction, b: ExpenseTransaction): number {
  const timeA = timeOf(a)
  const timeB = timeOf(b)
  if (timeA === timeB) return 0
  return timeA < timeB ? 1 : -1
}

/**
 * Agrupa as compras sem fatura por dono e cartão. Grupos pelo maior subtotal (empate: ordem de
 * chegada no resumo) e compras de cada grupo por data decrescente.
 */
export function groupPurchases(detail: Record<string, ExpenseTransaction[]>): PurchaseGroup[] {
  const totals = new Map<string, { group: PurchaseGroup; cents: number }>()

  for (const [owner, purchases] of Object.entries(detail)) {
    for (const purchase of purchases) {
      const key = `${owner}:${purchase.accountId}`
      let entry = totals.get(key)
      if (!entry) {
        const group = { key, owner, accountId: purchase.accountId, subtotal: 0, purchases: [], excludedCount: 0 }
        entry = { group, cents: 0 }
        totals.set(key, entry)
      }
      entry.group.purchases.push(purchase)
      const cents = countedCents(purchase)
      if (cents === null) entry.group.excludedCount += 1
      else entry.cents += cents
    }
  }

  return [...totals.values()]
    .sort((a, b) => b.cents - a.cents)
    .map(({ group, cents }) => ({
      ...group,
      subtotal: cents / 100,
      purchases: [...group.purchases].sort(byDateDescending),
    }))
}
