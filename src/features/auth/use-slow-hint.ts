import { useEffect, useState } from 'react'

/**
 * true quando algo está carregando há mais de `delayMs`.
 * A API no plano gratuito "dorme" e leva até 1 minuto para acordar: sem um aviso, parece que o app travou.
 */
export function useSlowHint(loading: boolean, delayMs = 4000): boolean {
  const [slow, setSlow] = useState(false)

  useEffect(() => {
    if (!loading) return
    const timer = setTimeout(() => setSlow(true), delayMs)
    // Quando termina (ou o componente sai da tela): cancela o timer e zera o aviso para a próxima vez
    return () => {
      clearTimeout(timer)
      setSlow(false)
    }
  }, [loading, delayMs])

  return loading && slow
}
