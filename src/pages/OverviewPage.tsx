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
import { AccountGroup } from '../components/AccountGroup'
import { ErrorMessage } from '../components/ErrorMessage'
import { Loading } from '../components/Loading'
import { OwnerAvatar } from '../components/OwnerAvatar'
import { PartialWarning } from '../components/PartialWarning'
import { TransactionRow } from '../components/TransactionRow'
import { formatDate, formatMoney } from '../lib/format'
import { groupByAccount, toCents } from '../lib/groupByAccount'
import { accountsByBalance, flattenDetail, owedBillsByDueDate } from '../lib/orderRows'
import { groupPurchases } from '../lib/purchases'

interface SummaryCardProps<T> {
  title: string
  note?: string
  section: SummarySection<T>
  /** Desenha o detalhe do card (a mensagem de lista vazia fica por conta do card). */
  renderDetail: (section: SummarySection<T>) => ReactNode
}

function SummaryCard<T>({ title, note, section, renderDetail }: SummaryCardProps<T>) {
  const count = flattenDetail(section.detail).length
  return (
    <section aria-label={title} className="rounded border bg-white dark:bg-slate-800 p-4">
      <h2 className="text-sm text-slate-500 dark:text-slate-400">{title}</h2>
      <p data-testid="total" className="text-2xl font-semibold">{formatMoney(section.total.value, section.total.currencyCode)}</p>
      {note && <p className="text-xs text-slate-500 dark:text-slate-400">{note}</p>}
      <details className="mt-2">
        <summary className="cursor-pointer text-sm text-blue-700 dark:text-blue-400">Ver detalhe ({count})</summary>
        {count === 0 ? (
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Nenhum item.</p>
        ) : (
          renderDetail(section)
        )}
      </details>
    </section>
  )
}

function IncomeRow({ income }: { income: IncomeTransaction }) {
  return (
    <TransactionRow
      income
      description={income.description}
      detail={formatDate(income.date)}
      amount={formatMoney(income.amount, income.currencyCode)}
    />
  )
}

function IncomesByAccount({
  section,
  nameOf,
}: {
  section: SummarySection<IncomeTransaction>
  nameOf: (owner: string, accountId: string) => string
}) {
  const groups = groupByAccount(section.detail, {
    accountId: (income) => income.accountId,
    date: (income) => income.date,
    cents: (income) => toCents(income.amount),
  })
  return (
    <div className="mt-2 space-y-3 text-sm">
      {groups.map((group) => (
        <AccountGroup
          key={group.key}
          owner={group.owner}
          name={nameOf(group.owner, group.accountId)}
          subtotal={group.subtotal}
        >
          {group.items.map((income) => (
            <IncomeRow key={income.id} income={income} />
          ))}
        </AccountGroup>
      ))}
    </div>
  )
}

function AccountBalances({ section }: { section: SummarySection<IncomeAccount> }) {
  return (
    <ul className="mt-2 divide-y text-sm">
      {accountsByBalance(section.detail).map(({ owner, item: account }) => (
        <TransactionRow
          key={`${owner}:${account.id}`}
          income={false}
          neutral
          leading={<OwnerAvatar owner={owner} />}
          description={account.name}
          amount={formatMoney(account.balance, account.currencyCode)}
        />
      ))}
    </ul>
  )
}

function OwedBills({ section }: { section: SummarySection<OwedBill> }) {
  return (
    <ul className="mt-2 divide-y text-sm">
      {owedBillsByDueDate(section.detail).map(({ owner, item: bill }) => (
        <TransactionRow
          key={`${owner}:${bill.id}`}
          income={false}
          description={bill.name}
          detail={`vence em ${formatDate(bill.dueDate)}`}
          aside={<OwnerAvatar owner={owner} />}
          amount={formatMoney(bill.totalAmount, bill.currencyCode)}
        />
      ))}
    </ul>
  )
}

function PurchaseRow({ purchase }: { purchase: ExpenseTransaction }) {
  const inAccountCurrency = purchase.amountInAccountCurrency !== undefined
  const original = formatMoney(purchase.amount, purchase.currencyCode)
  return (
    <TransactionRow
      income={false}
      description={
        <>
          {purchase.description}
          {purchase.installment && (
            <span className="ml-1 text-xs text-slate-500 dark:text-slate-400">
              {purchase.installment.number}/{purchase.installment.total}
            </span>
          )}
        </>
      }
      detail={formatDate(purchase.date)}
      amount={inAccountCurrency ? formatMoney(purchase.amountInAccountCurrency!, 'BRL') : original}
      amountNote={inAccountCurrency && purchase.currencyCode !== 'BRL' ? original : undefined}
    />
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
      {groups.map((group) => (
        <AccountGroup
          key={group.key}
          owner={group.owner}
          name={nameOf(group.owner, group.accountId)}
          subtotal={group.subtotal}
          note={
            group.excludedCount > 0
              ? group.excludedCount === 1
                ? '1 compra em outra moeda sem valor em BRL está fora do subtotal.'
                : `${group.excludedCount} compras em outra moeda sem valor em BRL estão fora do subtotal.`
              : undefined
          }
        >
          {group.items.map((purchase) => (
            <PurchaseRow key={purchase.id} purchase={purchase} />
          ))}
        </AccountGroup>
      ))}
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
              renderDetail={(section) => <AccountBalances section={section} />}
            />
            <SummaryCard<IncomeTransaction>
              title="Entradas no período"
              section={summary.incomes.transactions}
              renderDetail={(section) => <IncomesByAccount section={section} nameOf={nameOf} />}
            />
            <SummaryCard<OwedBill>
              title="Faturas a pagar"
              section={summary.expenses.owed}
              renderDetail={(section) => <OwedBills section={section} />}
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
