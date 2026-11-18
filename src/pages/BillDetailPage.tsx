import { useQuery } from '@tanstack/react-query'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { fetchBillDetail } from '../api/endpoints'
import type { BillDetail, BillTransaction } from '../api/types'
import { ErrorMessage } from '../components/ErrorMessage'
import { Loading } from '../components/Loading'
import { OwnerAvatar } from '../components/OwnerAvatar'
import { TransactionRow } from '../components/TransactionRow'
import { formatDate, formatMoney } from '../lib/format'

const MUTED = 'text-slate-500 dark:text-slate-400'
const CARD = 'rounded border bg-white p-4 dark:bg-slate-800'
const SECTION_TITLE = 'mb-1 text-sm font-medium text-slate-500 dark:text-slate-400'

function Summary({ bill }: { bill: BillDetail }) {
  return (
    <section aria-label="Resumo da fatura" className={CARD}>
      <h2 className={SECTION_TITLE}>Resumo da fatura</h2>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <dt className={MUTED}>Vencimento</dt>
        <dd>{formatDate(bill.dueDate)}</dd>
        <dt className={MUTED}>Fechamento</dt>
        <dd>{formatDate(bill.closingDate)}</dd>
        <dt className={MUTED}>Total</dt>
        <dd className="font-medium">{formatMoney(bill.totalAmount, bill.currencyCode)}</dd>
        <dt className={MUTED}>Pagamento mínimo</dt>
        <dd>{bill.minimumPaymentAmount === null ? '-' : formatMoney(bill.minimumPaymentAmount, bill.currencyCode)}</dd>
        {bill.allowsInstallments !== null && (
          <>
            <dt className={MUTED}>Aceita parcelamento</dt>
            <dd>{bill.allowsInstallments ? 'Sim' : 'Não'}</dd>
          </>
        )}
      </dl>
    </section>
  )
}

function Charges({ bill }: { bill: BillDetail }) {
  return (
    <section aria-label="Encargos" className={CARD}>
      <h2 className={SECTION_TITLE}>Encargos</h2>
      {bill.financeCharges.length === 0 ? (
        <p className={`text-sm ${MUTED}`}>Nenhum encargo.</p>
      ) : (
        <ul className="divide-y text-sm">
          {bill.financeCharges.map((charge) => (
            <li key={charge.id} className="flex justify-between gap-2 py-1">
              <span>
                {charge.type}
                {charge.additionalInfo && <span className={`ml-2 text-xs ${MUTED}`}>{charge.additionalInfo}</span>}
              </span>
              <span>{formatMoney(charge.amount, charge.currencyCode)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function Payments({ bill }: { bill: BillDetail }) {
  return (
    <section aria-label="Pagamentos" className={CARD}>
      <h2 className={SECTION_TITLE}>Pagamentos</h2>
      {bill.payments.length === 0 ? (
        <p className={`text-sm ${MUTED}`}>Nenhum pagamento.</p>
      ) : (
        <ul className="divide-y text-sm">
          {bill.payments.map((payment) => (
            <li key={payment.id} className="flex justify-between gap-2 py-1">
              <span>
                {payment.valueType} em {formatDate(payment.paymentDate)}
                {payment.paymentMode && <span className={`ml-2 text-xs ${MUTED}`}>{payment.paymentMode}</span>}
              </span>
              <span>{formatMoney(payment.amount, payment.currencyCode)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function PurchaseRow({ transaction }: { transaction: BillTransaction }) {
  return (
    <TransactionRow
      income={transaction.type === 'CREDIT'}
      description={
        <>
          {transaction.description}
          {transaction.installment && (
            <span className={`ml-1 text-xs ${MUTED}`}>
              {transaction.installment.number}/{transaction.installment.total}
            </span>
          )}
        </>
      }
      detail={transaction.category ? `${formatDate(transaction.date)} · ${transaction.category}` : formatDate(transaction.date)}
      amount={formatMoney(Math.abs(transaction.amount), transaction.currencyCode)}
    />
  )
}

function Purchases({ transactions }: { transactions: BillTransaction[] }) {
  return (
    <section aria-label="Compras">
      <h2 className={SECTION_TITLE}>Compras</h2>
      {transactions.length === 0 ? (
        <p className={`text-sm ${MUTED}`}>Nenhuma compra nesta fatura.</p>
      ) : (
        <ul className="divide-y rounded bg-white text-sm dark:bg-slate-800">
          {transactions.map((transaction) => (
            <PurchaseRow key={transaction.id} transaction={transaction} />
          ))}
        </ul>
      )}
    </section>
  )
}

export function BillDetailPage() {
  const { id = '' } = useParams()
  const [searchParams] = useSearchParams()
  const owner = searchParams.get('owner')?.trim() ?? ''
  const accountId = searchParams.get('accountId')?.trim() ?? ''
  const hasContext = owner !== '' && accountId !== ''

  const query = useQuery({
    queryKey: ['bill-detail', owner, accountId, id],
    enabled: hasContext,
    queryFn: ({ signal }) => fetchBillDetail(owner, accountId, id, signal),
  })

  return (
    <>
      <Link to="/accounts" className="text-sm text-blue-700 dark:text-blue-400">
        ← Voltar para Contas
      </Link>
      <h1 className="flex items-center gap-2 text-xl font-semibold">
        Fatura
        {query.data && <OwnerAvatar owner={query.data.owner} showName />}
      </h1>

      {!hasContext && (
        <ErrorMessage message="Faltam dados da fatura (dono ou conta). Volte para Contas e abra a fatura de novo." />
      )}
      {hasContext && query.isPending && <Loading label="Carregando fatura..." />}
      {query.isError && <ErrorMessage message={query.error.message} onRetry={() => void query.refetch()} />}

      {query.data && (
        <div className="space-y-4">
          <Summary bill={query.data.bill} />
          <Charges bill={query.data.bill} />
          <Payments bill={query.data.bill} />
          <Purchases transactions={query.data.transactions} />
        </div>
      )}
    </>
  )
}
