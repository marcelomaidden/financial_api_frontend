interface Props {
  message: string
  onRetry?: () => void
}

export function ErrorMessage({ message, onRetry }: Props) {
  return (
    <div role="alert" className="rounded border border-red-300 bg-red-50 p-4 text-red-800 dark:border-red-700 dark:bg-red-950 dark:text-red-200">
      <p>{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 rounded bg-red-700 px-3 py-1 text-white hover:bg-red-800"
        >
          Tentar de novo
        </button>
      )}
    </div>
  )
}
