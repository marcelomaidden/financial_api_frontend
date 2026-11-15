export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'theme'

export function applyTheme(theme: Theme, persist = false) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  if (persist) {
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // Sem persistência: o tema vale só para esta sessão.
    }
  }
}
