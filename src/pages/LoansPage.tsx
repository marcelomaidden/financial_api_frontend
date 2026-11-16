import { useQuery } from '@tanstack/react-query'
import { fetchLoans } from '../api/endpoints'
import type { Loan } from '../api/types'
import { ErrorMessage } from '../components/ErrorMessage'
import { Loading } from '../components/Loading'
import { OwnerAvatar } from '../components/OwnerAvatar'
import { PartialWarning } from '../components/PartialWarning'
import { formatDate, formatMoney } from '../lib/format'

const KIND_LABELS: Record<string, string> = {
  LOAN: 'Empréstimo',
  FINANCING: 'Financiamento',
  INVOICE_FINANCING: 'Financiamento de fatura',
  UNARRANGED_ACCOUNT_OVERDRAFT: 'Cheque especial',
}

function kindLabel(kind: string): string {
  return KIND_LABELS[kind] ?? 'Outro'
}

function installmentsText(installments: NonNullable<Loan['installments']>): string | null {
  const { total, paid, remaining } = installments
  if (paid !== null && remaining !== null) return `${paid} pagas, ${remaining} restantes`
  if (paid !== null) return `${paid} pagas`
  if (remaining !== null) return `${remaining} restantes`
  if (total !== null) return `${total} parcelas`
  return null
}

function LoanItem({ owner, loan }: { owner: string; loan: Loan }) {
  const rows: { label: string; value: string }[] = []
  if (loan.outstandingBalance !== null) {
    rows.push({ label: 'Saldo para quitar', value: formatMoney(loan.outstandingBalance, loan.currencyCode) })
  }
  if (loan.contractAmount !== null) {
    rows.push({ label: 'Valor contratado', value: formatMoney(loan.contractAmount, loan.currencyCode) })
  }
  const installments = loan.installments ? installmentsText(loan.installments) : null
  if (installments) rows.push({ label: 'Parcelas', value: installments })
  if (loan.dueDate) rows.push({ label: 'Fim do contrato', value: formatDate(loan.dueDate) })
  const payment = loan.lastPayment
  if (payment && (payment.paidDate !== null || payment.paidAmount !== null)) {
    const parts = [
      payment.paidDate !== null ? formatDate(payment.paidDate) : null,
      payment.paidAmount !== null ? formatMoney(payment.paidAmount, loan.currencyCode) : null,
    ].filter((part) => part !== null)
    rows.push({ label: 'Último pagamento', value: parts.join(' - ') })
  }
  const pastDue = loan.installments?.pastDue ?? 0

  return (
    <li className="rounded border bg-white p-3 dark:bg-slate-800">
      <div className="flex flex-wrap items-center gap-2">
        <OwnerAvatar owner={owner} showName />
        <span className="font-medium">{loan.productName}</span>
        <span className="text-sm text-slate-500 dark:text-slate-400">{kindLabel(loan.kind)}</span>
      </div>
      {rows.length > 0 && (
        <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
          {rows.map((row) => (
            <div key={row.label} className="flex justify-between gap-2">
              <dt className="text-slate-500 dark:text-slate-400">{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {pastDue > 0 && (
        <p className="mt-2 text-sm font-medium text-red-700 dark:text-red-400">
          {pastDue} {pastDue === 1 ? 'parcela em atraso' : 'parcelas em atraso'}
        </p>
      )}
    </li>
  )
}

export function LoansPage() {
  const query = useQuery({ queryKey: ['loans'], queryFn: ({ signal }) => fetchLoans(signal) })

  const owners = query.data?.owners ?? []
  const loans = owners.flatMap((entry) => entry.loans.map((loan) => ({ owner: entry.owner, loan })))
  const ownerErrors = owners.flatMap((entry) => (entry.error ? [`${entry.owner}: ${entry.error.message}`] : []))

  return (
    <>
      <h1 className="text-xl font-semibold">Empréstimos</h1>
      <PartialWarning title="Falha ao consultar alguns donos" messages={ownerErrors} />
      {query.isPending && <Loading />}
      {query.isError && <ErrorMessage message={query.error.message} onRetry={() => void query.refetch()} />}
      {query.data && loans.length === 0 && (
        <p className="text-sm text-slate-500 dark:text-slate-400">Nenhum empréstimo.</p>
      )}
      <ul className="space-y-2">
        {loans.map(({ owner, loan }) => (
          <LoanItem key={`${owner}:${loan.id}`} owner={owner} loan={loan} />
        ))}
      </ul>
    </>
  )
}
