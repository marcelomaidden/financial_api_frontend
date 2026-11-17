export interface AccountGroup<T> {
  /** `owner:accountId`, como em `api/transactions.ts`. */
  key: string
  owner: string
  accountId: string
  /** Subtotal em BRL, a partir dos centavos de cada item. */
  subtotal: number
  /** Itens do grupo, da data mais recente para a mais antiga. */
  items: T[]
  /** Itens que ficaram fora do subtotal (`cents` devolveu `null`): aparecem na lista, mas não somam. */
  excludedCount: number
}

export interface GroupByAccountOptions<T> {
  accountId: (item: T) => string
  /** Data usada para ordenar os itens de cada grupo. */
  date: (item: T) => string
  /** Valor do item em centavos, ou `null` quando o item não entra na soma. */
  cents: (item: T) => number | null
}

export const toCents = (value: number) => Math.round(value * 100)

/** Data inválida vira -Infinity: vai para o fim e mantém a ordem relativa (a ordenação é estável). */
function timeOf(date: string): number {
  const time = Date.parse(date)
  return Number.isNaN(time) ? -Infinity : time
}

/**
 * Agrupa os itens do resumo por dono e conta. Grupos pelo maior subtotal (empate: ordem de chegada
 * no resumo) e itens de cada grupo por data decrescente. A soma é feita em centavos.
 */
export function groupByAccount<T>(detail: Record<string, T[]>, options: GroupByAccountOptions<T>): AccountGroup<T>[] {
  const totals = new Map<string, { group: AccountGroup<T>; cents: number }>()

  for (const [owner, items] of Object.entries(detail)) {
    for (const item of items) {
      const accountId = options.accountId(item)
      const key = `${owner}:${accountId}`
      let entry = totals.get(key)
      if (!entry) {
        entry = { group: { key, owner, accountId, subtotal: 0, items: [], excludedCount: 0 }, cents: 0 }
        totals.set(key, entry)
      }
      entry.group.items.push(item)
      const cents = options.cents(item)
      if (cents === null) entry.group.excludedCount += 1
      else entry.cents += cents
    }
  }

  const byDateDescending = (a: T, b: T) => {
    const timeA = timeOf(options.date(a))
    const timeB = timeOf(options.date(b))
    if (timeA === timeB) return 0
    return timeA < timeB ? 1 : -1
  }

  return [...totals.values()]
    .sort((a, b) => b.cents - a.cents)
    .map(({ group, cents }) => ({
      ...group,
      subtotal: cents / 100,
      items: [...group.items].sort(byDateDescending),
    }))
}
