import { useQuery } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { fetchSummary } from '../api/endpoints'
import type {
  ExpenseTransaction,
  IncomeAccount,
  IncomeTransaction,
  OwedBill,
  SummarySection,
} from '../api/types'
import { ErrorMessage } from '../components/ErrorMessage'
import { Loading } from '../components/Loading'
import { OwnerBadge } from '../components/OwnerBadge'
import { PartialWarning } from '../components/PartialWarning'
import { formatDate, formatMoney } from '../lib/format'

function flatten<T>(section: SummarySection<T>): { owner: string; item: T }[] {
  return Object.entries(section.detail).flatMap(([owner, items]) => items.map((item) => ({ owner, item })))
}

function SummaryCard<T>({
  title,
  note,
  section,
  renderItem,
}: {
  title: string
  note?: string
  section: SummarySection<T>
  renderItem: (item: T) => ReactNode
}) {
  const rows = flatten(section)
  return (
    <section aria-label={title} className="rounded border bg-white dark:bg-slate-800 p-4">
      <h2 className="text-sm text-slate-500 dark:text-slate-400">{title}</h2>
      <p data-testid="total" className="text-2xl font-semibold">{formatMoney(section.total.value, section.total.currencyCode)}</p>
      {note && <p className="text-xs text-slate-500 dark:text-slate-400">{note}</p>}
      <details className="mt-2">
        <summary className="cursor-pointer text-sm text-blue-700 dark:text-blue-400">Ver detalhe ({rows.length})</summary>
        {rows.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Nenhum item.</p>
        ) : (
          <ul className="mt-2 divide-y text-sm">
            {rows.map(({ owner, item }, index) => (
              <li key={index} className="flex items-center justify-between gap-2 py-1">
                <span className="flex items-center gap-2">
                  <OwnerBadge owner={owner} />
                  {renderItem(item)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </details>
    </section>
  )
}

function ExpenseTransactionItem({ item }: { item: ExpenseTransaction }) {
  const foreign = item.amountInAccountCurrency !== undefined
  return (
    <span>
      {item.description}
      {item.installment && ` (${item.installment.number}/${item.installment.total})`} ·{' '}
      {formatDate(item.date)} ·{' '}
      {foreign ? (
        <>
          {formatMoney(item.amount, item.currencyCode)} → {formatMoney(item.amountInAccountCurrency!, 'BRL')}
        </>
      ) : (
        formatMoney(item.amount, item.currencyCode)
      )}
    </span>
  )
}

export function OverviewPage() {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const query = useQuery({
    queryKey: ['summary', dateFrom, dateTo],
    queryFn: ({ signal }) =>
      fetchSummary({ dateFrom: dateFrom || undefined, dateTo: dateTo || undefined }, signal),
  })

  const summary = query.data

  return (
    <>
      <h1 className="text-xl font-semibold">Visão geral</h1>

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
        <button
          type="button"
          className="rounded border px-3 py-1 text-sm"
          onClick={() => {
            setDateFrom('')
            setDateTo('')
          }}
        >
          Mês corrente
        </button>
      </form>

      {query.isPending && <Loading />}
      {query.isError && <ErrorMessage message={query.error.message} onRetry={() => void query.refetch()} />}

      {summary && (
        <>
          {summary.partial && (
            <PartialWarning
              title="Dados incompletos"
              messages={summary.errors.map((error) => `Dados de ${error.owner} incompletos: ${error.message}`)}
            />
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <SummaryCard<IncomeAccount>
              title="Saldo disponível"
              section={summary.incomes.available}
              renderItem={(item) => (
                <span>
                  {item.name} · {formatMoney(item.balance, item.currencyCode)}
                </span>
              )}
            />
            <SummaryCard<IncomeTransaction>
              title="Entradas no período"
              section={summary.incomes.transactions}
              renderItem={(item) => (
                <span>
                  {item.description} · {formatDate(item.date)} · {formatMoney(item.amount, item.currencyCode)}
                </span>
              )}
            />
            <SummaryCard<OwedBill>
              title="Faturas a pagar"
              section={summary.expenses.owed}
              renderItem={(item) => (
                <span>
                  {item.name} · vence em {formatDate(item.dueDate)} ·{' '}
                  {formatMoney(item.totalAmount, item.currencyCode)}
                </span>
              )}
            />
            <SummaryCard<ExpenseTransaction>
              title="Compras do cartão sem fatura"
              note="Estado atual: não depende do período."
              section={summary.expenses.transactions}
              renderItem={(item) => <ExpenseTransactionItem item={item} />}
            />
          </div>
        </>
      )}
    </>
  )
}
