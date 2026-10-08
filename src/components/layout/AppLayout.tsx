import { TrendingUp } from 'lucide-react'
import { NavLink, Outlet } from 'react-router'
import { cn } from '@/lib/utils'

const links = [
  { to: '/', label: 'Hoje' },
  { to: '/habitos', label: 'Hábitos' },
  { to: '/historico', label: 'Histórico' },
  { to: '/perfil', label: 'Perfil' },
]

/** Moldura das telas logadas: cabeçalho com o menu em cima, e a tela da rota atual no <Outlet />. */
export function AppLayout() {
  return (
    <div className="min-h-svh">
      <header className="border-b">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-3">
          <span className="flex items-center gap-2 font-medium">
            <TrendingUp className="size-5 text-blue-600" aria-hidden />
            Up Leveling
          </span>
          <nav className="flex gap-1">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'text-muted-foreground hover:text-foreground rounded-md px-3 py-1.5 text-sm',
                    isActive && 'bg-muted text-foreground font-medium',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          {/* F2: nível e barra de XP */}
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
