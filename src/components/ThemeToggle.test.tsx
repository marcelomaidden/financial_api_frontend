import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeToggle } from './ThemeToggle'

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  it('alterna para o tema escuro, aplica a classe em <html> e salva a escolha', async () => {
    render(<ThemeToggle />)
    await userEvent.click(screen.getByRole('button', { name: 'Tema escuro' }))
    expect(document.documentElement).toHaveClass('dark')
    expect(localStorage.getItem('theme')).toBe('dark')
    expect(screen.getByRole('button', { name: 'Tema claro' })).toBeInTheDocument()
  })

  it('volta para o tema claro', async () => {
    document.documentElement.classList.add('dark')
    render(<ThemeToggle />)
    await userEvent.click(screen.getByRole('button', { name: 'Tema claro' }))
    expect(document.documentElement).not.toHaveClass('dark')
    expect(localStorage.getItem('theme')).toBe('light')
  })
})
