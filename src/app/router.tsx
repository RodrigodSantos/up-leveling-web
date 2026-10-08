import { createBrowserRouter, Link } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { ComingSoon } from '@/components/layout/ComingSoon'
import { LoginPage } from '@/features/auth/LoginPage'
import { RegisterPage } from '@/features/auth/RegisterPage'
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
          { path: '/', element: <ComingSoon title="Seus hábitos de hoje" stage="F2" /> },
          { path: '/habitos', element: <ComingSoon title="Hábitos" stage="F3" /> },
          { path: '/historico', element: <ComingSoon title="Histórico" stage="F4" /> },
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
