import { toCents } from './groupByAccount'

/** Movimento de uma conta no resumo: entradas e saídas têm a mesma forma. */
interface Movement {
  accountId: string
  amount: number
}

export interface AccountResult {
  /** `owner:accountId`, como nos grupos por conta. */
  key: string
  owner: string
  accountId: string
  /** Quanto entrou na conta no período, em BRL. */
  incoming: number
  /** Quanto saiu da conta no período, em BRL. */
  outgoing: number
  /** `incoming - outgoing`. */
  result: number
}

export interface PeriodResult {
  /** Soma dos resultados das contas: sempre igual à soma das linhas. */
  total: number
  /** Contas com movimento, pelo resultado decrescente. */
  accounts: AccountResult[]
}

/**
 * Resultado do período por conta: entradas menos saídas. A soma é em centavos. As contas
 * ficam pelo maior resultado. No empate vale a ordem de chegada: primeiro as contas na
 * ordem das entradas, depois as que só têm saídas.
 */
export function periodResult(
  incomes: Record<string, Movement[]>,
  outflows: Record<string, Movement[]>,
): PeriodResult {
  const byKey = new Map<string, { owner: string; accountId: string; inCents: number; outCents: number }>()

  const add = (detail: Record<string, Movement[]>, side: 'inCents' | 'outCents') => {
    for (const [owner, items] of Object.entries(detail)) {
      for (const item of items) {
        const key = `${owner}:${item.accountId}`
        let entry = byKey.get(key)
        if (!entry) {
          entry = { owner, accountId: item.accountId, inCents: 0, outCents: 0 }
          byKey.set(key, entry)
        }
        entry[side] += toCents(item.amount)
      }
    }
  }
  add(incomes, 'inCents')
  add(outflows, 'outCents')

  const rows = [...byKey.entries()]
    .map(([key, entry]) => ({ key, ...entry, resultCents: entry.inCents - entry.outCents }))
    .sort((a, b) => b.resultCents - a.resultCents)

  const totalCents = rows.reduce((sum, row) => sum + row.resultCents, 0)
  return {
    total: totalCents / 100,
    accounts: rows.map((row) => ({
      key: row.key,
      owner: row.owner,
      accountId: row.accountId,
      incoming: row.inCents / 100,
      outgoing: row.outCents / 100,
      result: row.resultCents / 100,
    })),
  }
}
