import type { IncomeAccount, OwedBill } from '../api/types'

export interface OwnedItem<T> {
  owner: string
  item: T
}

/** Junta o `detail` de todos os donos em uma lista, na ordem em que o resumo chegou. */
export function flattenDetail<T>(detail: Record<string, T[]>): OwnedItem<T>[] {
  return Object.entries(detail).flatMap(([owner, items]) => items.map((item) => ({ owner, item })))
}

/** Data inválida vira +Infinity: vai para o fim e mantém a ordem relativa (a ordenação é estável). */
function dueTime(bill: OwedBill): number {
  const time = Date.parse(bill.dueDate)
  return Number.isNaN(time) ? Infinity : time
}

/** Faturas pelo vencimento, a que vence primeiro no topo. Empate: ordem de chegada no resumo. */
export function owedBillsByDueDate(detail: Record<string, OwedBill[]>): OwnedItem<OwedBill>[] {
  return flattenDetail(detail).sort((a, b) => {
    const timeA = dueTime(a.item)
    const timeB = dueTime(b.item)
    if (timeA === timeB) return 0
    return timeA < timeB ? -1 : 1
  })
}

/** Contas pelo maior saldo primeiro. Empate: ordem de chegada no resumo. */
export function accountsByBalance(detail: Record<string, IncomeAccount[]>): OwnedItem<IncomeAccount>[] {
  return flattenDetail(detail).sort((a, b) => b.item.balance - a.item.balance)
}
