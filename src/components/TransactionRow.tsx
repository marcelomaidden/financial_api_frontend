import type { ReactNode } from 'react'

interface TransactionRowProps {
  /** Entrada (ícone e valor verdes) ou saída (ícone e valor vermelhos, valor precedido de "−"). */
  income: boolean
  /** Conteúdo no lugar do ícone de direção, como o avatar do dono. */
  leading?: ReactNode
  /** Valor em cor neutra e sem "−", para o que não é entrada nem saída, como um saldo. */
  neutral?: boolean
  description: ReactNode
  /** Segunda linha, em tom apagado, sob a descrição. */
  detail?: ReactNode
  /** Conteúdo entre a descrição e o valor, como o dono e o nome da conta. */
  aside?: ReactNode
  /** Valor já formatado e sem sinal: o "−" das saídas é acrescentado aqui. */
  amount: string
  /** Linha em tom apagado sob o valor, como o valor original de uma compra em outra moeda. */
  amountNote?: ReactNode
}

const MUTED = 'text-slate-500 dark:text-slate-400'

/** Linha de uma transação: ícone de entrada ou saída, descrição e valor à direita. */
export function TransactionRow({
  income,
  leading,
  neutral = false,
  description,
  detail,
  aside,
  amount,
  amountNote,
}: TransactionRowProps) {
  return (
    <li className="flex items-center gap-3 p-2">
      {leading ?? (
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
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate">{description}</span>
        {detail && <span className={`block text-xs ${MUTED}`}>{detail}</span>}
      </span>
      {aside}
      <span className="flex w-32 flex-col items-end">
        <span
          className={`font-medium ${
            neutral ? '' : income ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}
        >
          {income || neutral ? '' : '− '}
          {amount}
        </span>
        {amountNote && <span className={`text-xs ${MUTED}`}>{amountNote}</span>}
      </span>
    </li>
  )
}
