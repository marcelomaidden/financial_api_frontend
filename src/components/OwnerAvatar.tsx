// Cor fixa por dono, sem verde nem vermelho (reservados a entrada e saída). Dono sem cor usa a neutra.
const OWNER_COLORS: Record<string, string> = {
  marcelo: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  luana: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
}
const NEUTRAL_COLOR = 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'

function ownerColor(owner: string): string {
  return OWNER_COLORS[owner.toLowerCase()] ?? NEUTRAL_COLOR
}

interface OwnerAvatarProps {
  owner: string
  /** Escreve o nome ao lado do avatar. Sem isso, o nome fica só no rótulo acessível e no hover. */
  showName?: boolean
}

export function OwnerAvatar({ owner, showName = false }: OwnerAvatarProps) {
  const initial = owner.trim().charAt(0).toLocaleUpperCase('pt-BR')
  const circle = (
    <span
      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${ownerColor(owner)}`}
      {...(showName ? { 'aria-hidden': true } : { role: 'img', 'aria-label': owner, title: owner })}
    >
      {showName ? initial : <span aria-hidden="true">{initial}</span>}
    </span>
  )
  if (!showName) return circle
  return (
    <span className="inline-flex items-center gap-1.5">
      {circle}
      <span className="text-sm capitalize">{owner}</span>
    </span>
  )
}
