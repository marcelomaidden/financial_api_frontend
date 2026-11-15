import { NavLink, Outlet } from 'react-router-dom'
import { ThemeToggle } from './ThemeToggle'

const links = [
  { to: '/', label: 'Visão geral', end: true },
  { to: '/accounts', label: 'Contas', end: false },
  { to: '/transactions', label: 'Transações', end: false },
]

export function Layout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b bg-white dark:bg-slate-900">
        <nav aria-label="Principal" className="mx-auto flex max-w-5xl items-center gap-4 p-4">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                isActive
                  ? 'font-semibold text-blue-700 dark:text-blue-400'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }
            >
              {link.label}
            </NavLink>
          ))}
          <ThemeToggle />
        </nav>
      </header>
      <main className="mx-auto max-w-5xl space-y-4 p-4">
        <Outlet />
      </main>
    </div>
  )
}
