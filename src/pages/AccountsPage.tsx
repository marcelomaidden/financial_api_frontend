import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { fetchAccounts, fetchBills, fetchCreditCards } from '../api/endpoints'
import type { CreditCard } from '../api/types'
import { ErrorMessage } from '../components/ErrorMessage'
import { Loading } from '../components/Loading'
import { OwnerBadge } from '../components/OwnerBadge'
import { PartialWarning } from '../components/PartialWarning'
import { formatDate, formatMoney } from '../lib/format'

const BILLS_PAGE_SIZE = 12

function BillsPanel({ owner, accountId }: { owner: string; accountId: string }) {
  const [page, setPage] = useState(1)
  const query = useQuery({
    queryKey: ['bills', owner, accountId, page],
    queryFn: ({ signal }) => fetchBills(owner, accountId, page, BILLS_PAGE_SIZE, signal),
  })

  if (query.isPending) return <Loading label="Carregando faturas..." />
  if (query.isError) return <ErrorMessage message={query.error.message} onRetry={() => void query.refetch()} />

  const { bills, totalPages } = query.data
  return (
    <div className="mt-2 text-sm">
      {bills.length === 0 ? (
        <p className="text-slate-500 dark:text-slate-400">Nenhuma fatura.</p>
      ) : (
        <ul className="divide-y">
          {bills.map((bill) => (
            <li key={bill.id} className="flex justify-between py-1">
              <span>Vencimento {formatDate(bill.dueDate)}</span>
              <span>{formatMoney(bill.totalAmount, bill.currencyCode)}</span>
            </li>
          ))}
        </ul>
      )}
      {totalPages !== null && totalPages > 1 && (
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="rounded border px-2 py-1 disabled:opacity-50"
          >
            Página anterior
          </button>
          <span>
            Página {page} de {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="rounded border px-2 py-1 disabled:opacity-50"
          >
            Próxima página
          </button>
        </div>
      )}
    </div>
  )
}

function CreditCardItem({ owner, card }: { owner: string; card: CreditCard }) {
  const [open, setOpen] = useState(false)
  return (
    <li className="rounded border bg-white dark:bg-slate-800 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <OwnerBadge owner={owner} />
          <span className="font-medium">{card.name}</span>
          {card.number && <span className="text-slate-500 dark:text-slate-400">final {card.number}</span>}
        </span>
        <span className="text-right text-sm">
          {card.balance !== null && <span>Fatura aberta {formatMoney(card.balance, card.currencyCode)}</span>}
          {card.availableCreditLimit !== null && (
            <span className="block text-slate-500 dark:text-slate-400">
              Limite disponível {formatMoney(card.availableCreditLimit, card.currencyCode)}
            </span>
          )}
        </span>
      </div>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="mt-2 text-sm text-blue-700 dark:text-blue-400"
      >
        {open ? 'Ocultar faturas' : 'Ver faturas'}
        <span className="sr-only"> de {card.name}</span>
      </button>
      {open && <BillsPanel owner={owner} accountId={card.id} />}
    </li>
  )
}

export function AccountsPage() {
  const accountsQuery = useQuery({ queryKey: ['accounts'], queryFn: ({ signal }) => fetchAccounts(signal) })
  const cardsQuery = useQuery({ queryKey: ['credit-cards'], queryFn: ({ signal }) => fetchCreditCards(signal) })

  const cardIds = new Set(
    (cardsQuery.data?.owners ?? []).flatMap((entry) => entry.creditCards.map((card) => card.id)),
  )
  const accounts = (accountsQuery.data?.owners ?? []).flatMap((entry) =>
    entry.accounts.filter((account) => !cardIds.has(account.id)).map((account) => ({ owner: entry.owner, account })),
  )
  const cards = (cardsQuery.data?.owners ?? []).flatMap((entry) =>
    entry.creditCards.map((card) => ({ owner: entry.owner, card })),
  )

  const ownerErrors = [
    ...new Set(
      [...(accountsQuery.data?.owners ?? []), ...(cardsQuery.data?.owners ?? [])].flatMap((entry) =>
        entry.error ? [`${entry.owner}: ${entry.error.message}`] : [],
      ),
    ),
  ]

  return (
    <>
      <h1 className="text-xl font-semibold">Contas</h1>
      <PartialWarning title="Falha ao consultar alguns donos" messages={ownerErrors} />

      <section aria-label="Contas bancárias" className="space-y-2">
        <h2 className="font-medium">Contas bancárias</h2>
        {accountsQuery.isPending && <Loading />}
        {accountsQuery.isError && (
          <ErrorMessage message={accountsQuery.error.message} onRetry={() => void accountsQuery.refetch()} />
        )}
        {accountsQuery.data && accounts.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">Nenhuma conta.</p>}
        <ul className="space-y-2">
          {accounts.map(({ owner, account }) => (
            <li key={`${owner}:${account.id}`} className="flex items-center justify-between rounded border bg-white dark:bg-slate-800 p-3">
              <span className="flex items-center gap-2">
                <OwnerBadge owner={owner} />
                <span className="font-medium">{account.name}</span>
                {account.number && <span className="text-slate-500 dark:text-slate-400">{account.number}</span>}
              </span>
              <span>{formatMoney(account.balance, account.currencyCode)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Cartões de crédito" className="space-y-2">
        <h2 className="font-medium">Cartões de crédito</h2>
        {cardsQuery.isPending && <Loading />}
        {cardsQuery.isError && (
          <ErrorMessage message={cardsQuery.error.message} onRetry={() => void cardsQuery.refetch()} />
        )}
        {cardsQuery.data && cards.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">Nenhum cartão.</p>}
        <ul className="space-y-2">
          {cards.map(({ owner, card }) => (
            <CreditCardItem key={`${owner}:${card.id}`} owner={owner} card={card} />
          ))}
        </ul>
      </section>
    </>
  )
}
