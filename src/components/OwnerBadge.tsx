export function OwnerBadge({ owner }: { owner: string }) {
  return (
    <span className="rounded bg-slate-200 px-2 py-0.5 text-xs font-medium capitalize text-slate-700 dark:bg-slate-700 dark:text-slate-200">{owner}</span>
  )
}
