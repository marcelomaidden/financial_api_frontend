interface Props {
  title?: string
  messages: string[]
}

/** Aviso de dados incompletos. Não renderiza nada quando não há mensagens. */
export function PartialWarning({ title = 'Dados incompletos', messages }: Props) {
  if (messages.length === 0) return null
  return (
    <div role="alert" className="rounded border border-amber-300 bg-amber-50 p-4 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
      <p className="font-medium">{title}</p>
      <ul className="list-disc pl-5">
        {messages.map((message) => (
          <li key={message}>{message}</li>
        ))}
      </ul>
    </div>
  )
}
