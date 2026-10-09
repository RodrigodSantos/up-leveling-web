import { createBrowserRouter, Link } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { ComingSoon } from '@/components/layout/ComingSoon'
import { LoginPage } from '@/features/auth/LoginPage'
import { RegisterPage } from '@/features/auth/RegisterPage'
import { HabitsPage } from '@/features/habits/HabitsPage'
import { TodayPage } from '@/features/today/TodayPage'
import { RedirectIfAuthenticated, RequireAuth } from '@/lib/auth/route-guards'

/**
 * Mapa das telas (equivalente aos @RequestMapping do backend).
 * - RedirectIfAuthenticated: telas de entrada, só para quem NÃO está logado.
 * - RequireAuth + AppLayout: telas do app, só para quem está logado, com cabeçalho e menu.
 */
export const routes = [
  {
    element: <RedirectIfAuthenticated />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/cadastro', element: <RegisterPage /> },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <TodayPage /> },
          { path: '/habitos', element: <HabitsPage /> },
          {
            path: '/historico',
            // Carregada sob demanda: o gráfico (Recharts) é pesado e só esta tela usa.
            // O Vite separa o arquivo dela, que só é baixado quando a pessoa abre o Histórico.
            lazy: () => import('@/features/history/HistoryPage').then((module) => ({ Component: module.HistoryPage })),
          },
          { path: '/perfil', element: <ComingSoon title="Perfil" stage="F4" /> },
        ],
      },
    ],
  },
  {
    path: '*',
    element: (
      <section className="mx-auto max-w-md space-y-2 px-4 py-16 text-center">
        <h1 className="text-2xl font-medium">Página não encontrada</h1>
        <Link to="/" className="text-brand underline">
          Voltar para o início
        </Link>
      </section>
    ),
  },
]

export const router = createBrowserRouter(routes)
