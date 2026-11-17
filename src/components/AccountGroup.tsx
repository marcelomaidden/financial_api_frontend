import type { ReactNode } from 'react'
import { formatMoney } from '../lib/format'
import { OwnerAvatar } from './OwnerAvatar'

interface AccountGroupProps {
  owner: string
  /** Nome da conta ou do cartão: também é o nome acessível do grupo. */
  name: string
  /** Subtotal em BRL do grupo. */
  subtotal: number
  /** Aviso sob o cabeçalho, como itens que ficaram fora do subtotal. */
  note?: ReactNode
  /** As linhas (`<li>`) do grupo. */
  children: ReactNode
}

/** Grupo de linhas de uma conta: dono, nome e subtotal no cabeçalho, e as linhas embaixo. */
export function AccountGroup({ owner, name, subtotal, note, children }: AccountGroupProps) {
  return (
    <div role="group" aria-label={name}>
      <div className="flex items-center justify-between gap-2 border-b py-1 font-medium">
        <span className="flex items-center gap-2">
          <OwnerAvatar owner={owner} />
          {name}
        </span>
        <span data-testid="group-subtotal">{formatMoney(subtotal, 'BRL')}</span>
      </div>
      {note && <p className="text-xs text-slate-500 dark:text-slate-400">{note}</p>}
      <ul className="divide-y">{children}</ul>
    </div>
  )
}
