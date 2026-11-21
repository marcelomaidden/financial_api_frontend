import { useQuery } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { fetchSummary } from '../api/endpoints'
import { fetchAccountNames } from '../api/transactions'
import type {
  AccountDebit,
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
import { periodResult, type PeriodResult } from '../lib/periodResult'
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
      <h3 className="text-sm text-slate-500 dark:text-slate-400">{title}</h3>
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

/** Entrada ou saída de conta: as duas têm o mesmo formato e só mudam o sentido da linha. */
type AccountTransaction = IncomeTransaction | AccountDebit

function AccountTransactionRow({ transaction, income }: { transaction: AccountTransaction; income: boolean }) {
  return (
    <TransactionRow
      income={income}
      description={transaction.description}
      detail={formatDate(transaction.date)}
      amount={formatMoney(transaction.amount, transaction.currencyCode)}
    />
  )
}

function TransactionsByAccount({
  section,
  income,
  nameOf,
}: {
  section: SummarySection<AccountTransaction>
  income: boolean
  nameOf: (owner: string, accountId: string) => string
}) {
  const groups = groupByAccount(section.detail, {
    accountId: (transaction) => transaction.accountId,
    date: (transaction) => transaction.date,
    cents: (transaction) => toCents(transaction.amount),
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
          {group.items.map((transaction) => (
            <AccountTransactionRow key={transaction.id} transaction={transaction} income={income} />
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

const MUTED = 'text-slate-500 dark:text-slate-400'

/** Valor com sinal: positivo na cor de entrada, negativo na cor de saída com "−", zero neutro. */
function SignedAmount({ value }: { value: number }) {
  const color = value > 0 ? 'text-green-600 dark:text-green-400' : value < 0 ? 'text-red-600 dark:text-red-400' : ''
  return (
    <span className={color}>
      {value < 0 ? '− ' : ''}
      {formatMoney(Math.abs(value), 'BRL')}
    </span>
  )
}

/** Entradas menos saídas do período, com o resultado de cada conta no detalhe. */
function PeriodResultCard({
  result,
  nameOf,
}: {
  result: PeriodResult
  nameOf: (owner: string, accountId: string) => string
}) {
  const count = result.accounts.length
  return (
    <section aria-labelledby="overview-result" className="rounded border bg-white dark:bg-slate-800 p-4">
      <h2 id="overview-result" className={`text-sm ${MUTED}`}>
        Resultado do período
      </h2>
      <p data-testid="total" className="text-2xl font-semibold">
        <SignedAmount value={result.total} />
      </p>
      <details className="mt-2">
        <summary className="cursor-pointer text-sm text-blue-700 dark:text-blue-400">Ver detalhe ({count})</summary>
        {count === 0 ? (
          <p className={`mt-2 text-sm ${MUTED}`}>Nenhum item.</p>
        ) : (
          <ul className="mt-2 divide-y text-sm">
            {result.accounts.map((account) => (
              <li key={account.key} data-testid="result-account" className="flex items-center gap-3 p-2">
                <OwnerAvatar owner={account.owner} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{nameOf(account.owner, account.accountId)}</span>
                  <span className={`block text-xs ${MUTED}`}>
                    entrou {formatMoney(account.incoming, 'BRL')} · saiu {formatMoney(account.outgoing, 'BRL')}
                  </span>
                </span>
                <span data-testid="result-amount" className="font-medium">
                  <SignedAmount value={account.result} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </details>
    </section>
  )
}

/** Grupo de cards com título (Entradas ou Despesas). */
function CardGroup({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="space-y-3">
      <h2 id={id} className="text-lg font-semibold">
        {title}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
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
          <PeriodResultCard
            result={periodResult(summary.incomes.transactions.detail, summary.expenses.accountDebits.detail)}
            nameOf={nameOf}
          />
          <CardGroup id="overview-incomes" title="Entradas">
            <SummaryCard<IncomeAccount>
              title="Saldo disponível"
              section={summary.incomes.available}
              renderDetail={(section) => <AccountBalances section={section} />}
            />
            <SummaryCard<IncomeTransaction>
              title="Entradas no período"
              section={summary.incomes.transactions}
              renderDetail={(section) => <TransactionsByAccount section={section} income nameOf={nameOf} />}
            />
          </CardGroup>
          <CardGroup id="overview-expenses" title="Despesas">
            <SummaryCard<AccountDebit>
              title="Saídas no período"
              note="Inclui pagamentos de fatura e transferências entre contas próprias. As transferências se anulam no resultado do período."
              section={summary.expenses.accountDebits}
              renderDetail={(section) => <TransactionsByAccount section={section} income={false} nameOf={nameOf} />}
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
          </CardGroup>
        </>
      )}
    </>
  )
}
