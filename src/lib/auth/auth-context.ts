import { createContext, useContext } from 'react'
import type { TokenResponse } from '@/lib/api/types'
import type { Session } from './token-storage'

export interface AuthContextValue {
  /** Sessão atual, ou null se ninguém está logado. */
  session: Session | null
  /** Guarda o token recebido no login e marca o usuário como logado. */
  signIn: (token: TokenResponse) => void
  /** Sai: apaga o token e o cache dos dados do usuário. */
  signOut: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

/** Quem está logado, e como entrar e sair. Funciona em qualquer componente dentro do <AuthProvider>. */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth precisa estar dentro de um <AuthProvider>')
  }
  return context
}
