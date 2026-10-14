import { createBrowserRouter, Link } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { RedirectIfAuthenticated, RequireAuth } from '@/lib/auth/route-guards'

/**
 * Mapa das telas (equivalente aos @RequestMapping do backend).
 * - RedirectIfAuthenticated: telas de entrada, só para quem NÃO está logado.
 * - RequireAuth + AppLayout: telas do app, só para quem está logado, com cabeçalho e menu.
 *
 * Toda tela é carregada sob demanda (lazy): o Vite gera um arquivo para cada uma, baixado só quando a pessoa
 * abre a tela. Quem já está logado não baixa o código da entrada (animações, formulários), e o gráfico
 * (Recharts, a biblioteca mais pesada) só vem com o Histórico.
 */
export const routes = [
  {
    // Aparece enquanto o arquivo da primeira tela ainda está chegando (só na abertura do app)
    HydrateFallback: () => null,
    children: [
      {
        element: <RedirectIfAuthenticated />,
        children: [
          {
            path: '/login',
            lazy: () => import('@/features/auth/LoginPage').then((module) => ({ Component: module.LoginPage })),
          },
          {
            path: '/cadastro',
            lazy: () => import('@/features/auth/RegisterPage').then((module) => ({ Component: module.RegisterPage })),
          },
        ],
      },
      {
        element: <RequireAuth />,
        children: [
          {
            element: <AppLayout />,
            children: [
              {
                path: '/',
                lazy: () => import('@/features/today/TodayPage').then((module) => ({ Component: module.TodayPage })),
              },
              {
                path: '/habitos',
                lazy: () => import('@/features/habits/HabitsPage').then((module) => ({ Component: module.HabitsPage })),
              },
              {
                path: '/historico',
                lazy: () =>
                  import('@/features/history/HistoryPage').then((module) => ({ Component: module.HistoryPage })),
              },
              {
                path: '/perfil',
                lazy: () =>
                  import('@/features/profile/ProfilePage').then((module) => ({ Component: module.ProfilePage })),
              },
            ],
          },
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
