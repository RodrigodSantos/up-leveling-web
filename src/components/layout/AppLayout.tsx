import { useQuery } from '@tanstack/react-query'
import { LogOut, TrendingUp } from 'lucide-react'
import { NavLink, Outlet } from 'react-router'
import { Button } from '@/components/ui/button'
import { fetchMe } from '@/features/auth/api'
import { useAuth } from '@/lib/auth/auth-context'
import { cn } from '@/lib/utils'

const links = [
  { to: '/', label: 'Hoje' },
  { to: '/habitos', label: 'Hábitos' },
  { to: '/historico', label: 'Histórico' },
  { to: '/perfil', label: 'Perfil' },
]

/** Moldura das telas logadas: cabeçalho com o menu em cima, e a tela da rota atual no <Outlet />. */
export function AppLayout() {
  const { signOut } = useAuth()
  // useQuery: busca (e guarda em cache) os dados de quem está logado; "me" é a chave do cache
  const me = useQuery({ queryKey: ['me'], queryFn: fetchMe })

  return (
    <div className="min-h-svh">
      <header className="border-b">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-4 px-4 py-3">
          <span className="flex items-center gap-2 font-medium">
            <TrendingUp className="text-brand size-5" aria-hidden />
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
                    isActive && 'bg-brand/15 text-brand font-medium',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          {/* F2: nível e barra de XP */}
          <div className="ml-auto flex items-center gap-2">
            {me.data && <span className="text-muted-foreground text-sm">Olá, {me.data.name}</span>}
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut aria-hidden />
              Sair
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
