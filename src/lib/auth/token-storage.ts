// Guarda o token JWT no navegador (localStorage), junto com a data em que ele expira.
// A API devolve as duas coisas no login: { token, type, expiresAt }.

const STORAGE_KEY = 'up-leveling.session'

export interface Session {
  token: string
  expiresAt: string // ISO 8601, ex.: "2026-10-08T15:00:00Z"
}

export function saveSession(session: Session): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

/** Devolve a sessão só se ela ainda não expirou; um token vencido é apagado. */
export function getSession(): Session | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null

  const session = JSON.parse(raw) as Session
  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    clearSession()
    return null
  }
  return session
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY)
}
