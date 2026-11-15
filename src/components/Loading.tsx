export function Loading({ label = 'Carregando...' }: { label?: string }) {
  return (
    <p role="status" className="text-slate-500 dark:text-slate-400">
      {label}
    </p>
  )
}
