import { useSlowHint } from './use-slow-hint'

/** Aviso que só aparece se a API demorar (o plano gratuito "acorda" em até 1 minuto). */
export function SlowServerHint({ loading }: { loading: boolean }) {
  const slow = useSlowHint(loading)
  if (!slow) return null
  return (
    <p role="status" className="text-muted-foreground text-center text-sm">
      O servidor está acordando, isso pode levar até 1 minuto.
    </p>
  )
}
