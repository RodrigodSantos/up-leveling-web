import { useCallback, useEffect, useRef, useState } from 'react'
import type { TokenResponse } from '@/lib/api/types'
import { useAuth } from '@/lib/auth/auth-context'
import { prefersReducedMotion } from './motion'

/** Quanto tempo a mensagem "Acesso concedido" fica na tela antes de entrar no app */
export const ACCESS_GRANTED_MS = 700

/**
 * Login com a transição "[ SISTEMA ] Acesso concedido": em vez de entrar na hora, mostra a mensagem,
 * fecha a janela e só então guarda o token (o RedirectIfAuthenticated leva para o app nesse momento).
 */
export function useAccessGranted() {
  const { signIn } = useAuth()
  const [granted, setGranted] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  // Se a tela for fechada antes do fim da transição, o timer não pode disparar depois
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const grant = useCallback(
    (token: TokenResponse) => {
      if (prefersReducedMotion()) {
        signIn(token)
        return
      }
      setGranted(true)
      timer.current = window.setTimeout(() => signIn(token), ACCESS_GRANTED_MS)
    },
    [signIn],
  )

  return { granted, grant }
}
