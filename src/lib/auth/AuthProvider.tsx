import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { SESSION_EXPIRED_EVENT } from '@/lib/api/client'
import type { TokenResponse } from '@/lib/api/types'
import { AuthContext } from './auth-context'
import { clearSession, getSession, saveSession, type Session } from './token-storage'

/**
 * Guarda "quem está logado" num lugar só, para qualquer tela consultar com useAuth().
 * Começa com a sessão salva no navegador (se ainda não venceu), então um F5 não desloga.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [session, setSession] = useState<Session | null>(() => getSession())

  const signIn = useCallback((token: TokenResponse) => {
    const newSession = { token: token.token, expiresAt: token.expiresAt }
    saveSession(newSession)
    setSession(newSession)
  }, [])

  const signOut = useCallback(() => {
    clearSession()
    setSession(null)
    // Sem isto, o próximo usuário a entrar veria por um instante os dados do anterior
    queryClient.clear()
  }, [queryClient])

  // O cliente da API avisa quando o token venceu; aqui a tela reage (volta para o login)
  useEffect(() => {
    function onExpired() {
      setSession(null)
      queryClient.clear()
      toast.info('Sua sessão expirou. Entre de novo.')
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired)
  }, [queryClient])

  const value = useMemo(() => ({ session, signIn, signOut }), [session, signIn, signOut])
  return <AuthContext value={value}>{children}</AuthContext>
}
