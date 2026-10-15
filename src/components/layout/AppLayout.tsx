import { useQuery } from '@tanstack/react-query'
import { ChartColumn, ListChecks, LogOut, Swords, TrendingUp, UserRound } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { NavLink, Outlet, useLocation, useNavigation } from 'react-router'
import { Button } from '@/components/ui/button'
import { fetchMe } from '@/features/auth/api'
import { useAuth } from '@/lib/auth/auth-context'
import { cn } from '@/lib/utils'
import { LevelBar } from './LevelBar'

const links = [
  { to: '/', label: 'Hoje', icon: Swords },
  { to: '/habitos', label: 'Hábitos', icon: ListChecks },
  { to: '/historico', label: 'Histórico', icon: ChartColumn },
  { to: '/perfil', label: 'Perfil', icon: UserRound },
]

/**
 * Moldura das telas logadas: cabeçalho, menu e a tela da rota atual no <Outlet />.
 * No celular (abaixo de 640px, o "sm" do Tailwind) o menu vira uma barra fixa no rodapé, ao alcance do polegar,
 * e o cabeçalho fica com uma linha só. É o mesmo <nav>, só muda o CSS: os links não aparecem duas vezes.
 *
 * Acessibilidade: link "Pular para o conteúdo" (primeiro Tab) e, ao trocar de tela, o foco vai para o <h1> da
 * tela nova. Sem isso, o foco fica no link clicado e quem usa leitor de tela não percebe que a tela mudou.
 */
export function AppLayout() {
  const { signOut } = useAuth()
  // useQuery: busca (e guarda em cache) os dados de quem está logado; "me" é a chave do cache
  const me = useQuery({ queryKey: ['me'], queryFn: fetchMe })
  // "loading" enquanto o arquivo da próxima tela é baixado (as telas são carregadas sob demanda)
  const navigation = useNavigation()
  const { pathname } = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  const lastPathname = useRef(pathname)

  useEffect(() => {
    // Só quando a tela muda: na abertura do app o foco fica onde o navegador colocou.
    // Compara com o caminho anterior (e não com "primeira execução") porque o StrictMode roda o efeito duas vezes.
    if (lastPathname.current === pathname) return
    lastPathname.current = pathname
    const heading = mainRef.current?.querySelector('h1')
    if (heading) {
      heading.tabIndex = -1 // -1: dá para receber foco pelo código, mas o Tab continua pulando o título
      heading.focus()
    }
  }, [pathname])

  return (
    <div className="min-h-svh">
      <a
        href="#conteudo"
        className="bg-background sr-only z-50 rounded-md border px-3 py-2 text-sm focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Pular para o conteúdo
      </a>
      {navigation.state === 'loading' && (
        <div
          role="progressbar"
          aria-label="Carregando a tela"
          className="fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden"
        >
          <div data-motion className="system-loading bg-brand h-full w-1/3" />
        </div>
      )}
      <header className="border-b">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3 sm:flex-wrap sm:gap-4">
          <span className="flex shrink-0 items-center gap-2 font-medium">
            <TrendingUp className="text-brand size-5" aria-hidden />
            Up Leveling
          </span>
          <nav
            aria-label="Menu principal"
            className={cn(
              'bg-background fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t pb-[env(safe-area-inset-bottom)]',
              'sm:static sm:z-auto sm:flex sm:gap-1 sm:border-0 sm:bg-transparent sm:pb-0',
            )}
          >
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'text-muted-foreground hover:text-foreground flex flex-col items-center gap-1 py-2 text-xs',
                    'sm:rounded-md sm:px-3 sm:py-1.5 sm:text-sm',
                    isActive && 'text-brand sm:bg-brand/15 font-medium',
                  )
                }
              >
                <link.icon className="size-5 sm:hidden" aria-hidden />
                {link.label}
              </NavLink>
            ))}
          </nav>
          <LevelBar />
          <div className="flex shrink-0 items-center gap-2 sm:ml-auto">
            {me.data && <span className="text-muted-foreground hidden text-sm sm:inline">Olá, {me.data.name}</span>}
            {/* No celular, 44px de área de toque (o mínimo recomendado para dedo) */}
            <Button variant="ghost" size="sm" className="max-sm:size-11" onClick={signOut}>
              <LogOut aria-hidden />
              {/* No celular fica só o ícone; o texto continua para o leitor de tela */}
              <span className="max-sm:sr-only">Sair</span>
            </Button>
          </div>
        </div>
      </header>
      {/* Espaço embaixo para a barra do menu não cobrir o fim da tela no celular */}
      <main
        id="conteudo"
        ref={mainRef}
        tabIndex={-1}
        className="mx-auto max-w-4xl px-4 pt-6 pb-[calc(5rem+env(safe-area-inset-bottom))] outline-none sm:pb-6"
      >
        <Outlet />
      </main>
    </div>
  )
}
