import { useState } from 'react'
import { applyTheme, type Theme } from '../lib/theme'

export function ThemeToggle() {
  // O tema inicial já foi aplicado em <html> pelo script do index.html.
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light',
  )
  const next: Theme = theme === 'dark' ? 'light' : 'dark'

  return (
    <button
      type="button"
      onClick={() => {
        applyTheme(next, true)
        setTheme(next)
      }}
      className="ml-auto rounded border px-2 py-1 text-sm"
    >
      {theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
    </button>
  )
}
