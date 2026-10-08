import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from './auth-context'

interface FromState {
  from?: string
}

/** "Porteiro" das telas logadas: sem sessão, manda para o login lembrando de onde a pessoa veio. */
export function RequireAuth() {
  const { session } = useAuth()
  const location = useLocation()

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname } satisfies FromState} />
  }
  return <Outlet />
}

/**
 * O contrário: quem já está logado não vê /login nem /cadastro.
 * É também o que leva a pessoa para o app logo depois do login (para a tela que ela tentou abrir antes).
 */
export function RedirectIfAuthenticated() {
  const { session } = useAuth()
  const location = useLocation()
  const from = (location.state as FromState | null)?.from

  return session ? <Navigate to={from ?? '/'} replace /> : <Outlet />
}
