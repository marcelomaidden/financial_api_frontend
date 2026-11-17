import { useQuery } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { fetchSummary } from '../api/endpoints'
import { fetchAccountNames } from '../api/transactions'
import type {
  ExpenseTransaction,
  IncomeAccount,
  IncomeTransaction,
  OwedBill,
  SummarySection,
} from '../api/types'
import { ErrorMessage } from '../components/ErrorMessage'
import { Loading } from '../components/Loading'
import { OwnerAvatar } from '../components/OwnerAvatar'
import { PartialWarning } from '../components/PartialWarning'
import { formatDate, formatMoney } from '../lib/format'
import { groupPurchases } from '../lib/purchases'

function flatten<T>(section: SummarySection<T>): { owner: string; item: T }[] {
  return Object.entries(section.detail).flatMap(([owner, items]) => items.map((item) => ({ owner, item })))
}

type SummaryCardProps<T> = {
  title: string
  note?: string
  section: SummarySection<T>
} & (
  | { renderItem: (item: T) => ReactNode; renderDetail?: never }
  /** Desenha o detalhe inteiro no lugar da lista de itens (a mensagem de lista vazia continua valendo). */
  | { renderDetail: (section: SummarySection<T>) => ReactNode; renderItem?: never }
)

function SummaryCard<T>({ title, note, section, renderItem, renderDetail }: SummaryCardProps<T>) {
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
        ) : renderDetail ? (
          renderDetail(section)
        ) : (
          <ul className="mt-2 divide-y text-sm">
            {rows.map(({ owner, item }, index) => (
              <li key={index} className="flex items-center justify-between gap-2 py-1">
                <span className="flex items-center gap-2">
                  <OwnerAvatar owner={owner} />
                  {renderItem!(item)}
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

function PurchasesByCard({
  section,
  nameOf,
}: {
  section: SummarySection<ExpenseTransaction>
  nameOf: (owner: string, accountId: string) => string
}) {
  const groups = groupPurchases(section.detail)
  return (
    <div className="mt-2 space-y-3 text-sm">
      {groups.map((group) => {
        const name = nameOf(group.owner, group.accountId)
        return (
          <div key={group.key} role="group" aria-label={name}>
            <div className="flex items-center justify-between gap-2 border-b py-1 font-medium">
              <span className="flex items-center gap-2">
                <OwnerAvatar owner={group.owner} />
                {name}
              </span>
              <span data-testid="group-subtotal">{formatMoney(group.subtotal, 'BRL')}</span>
            </div>
            {group.excludedCount > 0 && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {group.excludedCount === 1
                  ? '1 compra em outra moeda sem valor em BRL está fora do subtotal.'
                  : `${group.excludedCount} compras em outra moeda sem valor em BRL estão fora do subtotal.`}
              </p>
            )}
            <ul className="divide-y">
              {group.purchases.map((purchase) => (
                <li key={purchase.id} className="py-1">
                  <ExpenseTransactionItem item={purchase} />
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
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

  // Só os nomes dos cartões: não bloqueia o resumo e, se falhar, os grupos usam o accountId.
  const names = useQuery({
    queryKey: ['account-names'],
    queryFn: ({ signal }) => fetchAccountNames(signal),
  })
  const nameOf = (owner: string, accountId: string) => names.data?.get(`${owner}:${accountId}`) ?? accountId

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
              renderDetail={(section) => <PurchasesByCard section={section} nameOf={nameOf} />}
            />
          </div>
        </>
      )}
    </>
  )
}
