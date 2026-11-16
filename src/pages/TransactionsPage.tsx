import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { fetchCombinedTransactions } from '../api/transactions'
import { ErrorMessage } from '../components/ErrorMessage'
import { Loading } from '../components/Loading'
import { OwnerBadge } from '../components/OwnerBadge'
import { PartialWarning } from '../components/PartialWarning'
import { formatDate, formatMoney } from '../lib/format'

function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function currentMonth(): { from: string; to: string } {
  const now = new Date()
  return {
    from: toIsoDate(new Date(now.getFullYear(), now.getMonth(), 1)),
    to: toIsoDate(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  }
}

// As linhas já chegam ordenadas por data, então agrupar linhas consecutivas basta.
function groupByDate<T extends { transaction: { date: string } }>(rows: T[]): { label: string; rows: T[] }[] {
  const groups: { label: string; rows: T[] }[] = []
  for (const row of rows) {
    const label = formatDate(row.transaction.date)
    const last = groups.at(-1)
    if (last && last.label === label) last.rows.push(row)
    else groups.push({ label, rows: [row] })
  }
  return groups
}

export function TransactionsPage() {
  const [initial] = useState(currentMonth)
  const [dateFrom, setDateFrom] = useState(initial.from)
  const [dateTo, setDateTo] = useState(initial.to)

  const ready = dateFrom !== '' && dateTo !== ''
  const query = useQuery({
    queryKey: ['transactions', dateFrom, dateTo],
    enabled: ready,
    queryFn: ({ signal }) => fetchCombinedTransactions({ dateFrom, dateTo }, signal),
  })

  const data = query.data
  const warnings =
    data?.warnings.map((warning) =>
      warning.accountName === null
        ? `Contas de ${warning.owner} não carregadas: ${warning.message}`
        : `${warning.owner} · ${warning.accountName}: ${warning.message}`,
    ) ?? []

  return (
    <>
      <h1 className="text-xl font-semibold">Transações</h1>

      <form className="flex flex-wrap items-end gap-3" onSubmit={(event) => event.preventDefault()}>
        <label className="text-sm">
          De
          <input
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
            className="ml-2 rounded border bg-white px-2 py-1 dark:bg-slate-800"
          />
        </label>
        <label className="text-sm">
          Até
          <input
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
            className="ml-2 rounded border bg-white px-2 py-1 dark:bg-slate-800"
          />
        </label>
      </form>

      {!ready && <p className="text-sm text-slate-500 dark:text-slate-400">Informe as duas datas para consultar.</p>}
      {ready && query.isPending && <Loading label="Carregando transações..." />}
      {query.isError && <ErrorMessage message={query.error.message} onRetry={() => void query.refetch()} />}

      {data && (
        <>
          <PartialWarning title="Dados incompletos" messages={warnings} />
          {data.rows.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Nenhuma transação no período.</p>
          ) : (
            <div className="space-y-4">
              {groupByDate(data.rows).map(({ label, rows }) => (
                <section key={label} aria-label={label}>
                  <h2 className="mb-1 text-sm font-medium text-slate-500 dark:text-slate-400">{label}</h2>
                  <ul className="divide-y rounded bg-white text-sm dark:bg-slate-800">
                    {rows.map(({ owner, accountId, accountName, transaction }) => {
                      const income = transaction.type === 'CREDIT'
                      const money = formatMoney(Math.abs(transaction.amount), transaction.currencyCode)
                      return (
                        <li
                          key={`${owner}:${accountId}:${transaction.id}`}
                          className="flex items-center gap-3 p-2"
                        >
                          <span
                            role="img"
                            aria-label={income ? 'Entrada' : 'Saída'}
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                              income
                                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                            }`}
                          >
                            {income ? '↓' : '↑'}
                          </span>
                          <span className="min-w-0 flex-1 truncate">{transaction.description}</span>
                          <OwnerBadge owner={owner} />
                          <span className="text-slate-500 dark:text-slate-400">{accountName}</span>
                          <span
                            className={`w-32 text-right font-medium ${
                              income ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                            }`}
                          >
                            {income ? '' : '− '}
                            {money}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </>
  )
}
