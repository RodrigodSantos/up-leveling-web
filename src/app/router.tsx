import { createBrowserRouter, Link } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { ComingSoon } from '@/components/layout/ComingSoon'

/**
 * Mapa das telas (equivalente aos @RequestMapping do backend).
 * As rotas dentro de AppLayout aparecem com o cabeçalho e o menu.
 */
export const routes = [
  { path: '/login', element: <ComingSoon title="Entrar" stage="F1" /> },
  { path: '/cadastro', element: <ComingSoon title="Criar conta" stage="F1" /> },
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <ComingSoon title="Seus hábitos de hoje" stage="F2" /> },
      { path: '/habitos', element: <ComingSoon title="Hábitos" stage="F3" /> },
      { path: '/historico', element: <ComingSoon title="Histórico" stage="F4" /> },
      { path: '/perfil', element: <ComingSoon title="Perfil" stage="F4" /> },
    ],
  },
  {
    path: '*',
    element: (
      <section className="mx-auto max-w-md space-y-2 px-4 py-16 text-center">
        <h1 className="text-2xl font-medium">Página não encontrada</h1>
        <Link to="/" className="text-blue-600 underline">
          Voltar para o início
        </Link>
      </section>
    ),
  },
]

export const router = createBrowserRouter(routes)
