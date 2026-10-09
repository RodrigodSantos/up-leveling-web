import { TrendingUp } from 'lucide-react'
import type { ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { SystemBackground } from './system/SystemBackground'
import { SystemWindows } from './system/SystemWindows'
import { Typewriter } from './system/Typewriter'

interface AuthLayoutProps {
  title: string
  description: string
  children: ReactNode
  footer: ReactNode
  /** Login aceito: mostra "Acesso concedido" e fecha a janela antes de entrar no app */
  granted?: boolean
}

/**
 * Moldura das telas de entrada no estilo "janela do Sistema": fundo com grade e partículas,
 * janelas flutuando em volta (telas largas) e o card abrindo como uma janela.
 */
export function AuthLayout({ title, description, children, footer, granted = false }: AuthLayoutProps) {
  return (
    <main className="relative isolate flex min-h-svh flex-col items-center justify-center gap-6 overflow-hidden px-4 py-10">
      <SystemBackground />
      <SystemWindows />

      <div className="flex items-center gap-2 text-lg font-medium">
        <TrendingUp className="text-brand size-6" aria-hidden />
        Up Leveling
      </div>

      <div className="relative w-full max-w-sm">
        {/* A animação de abrir/fechar fica nesta camada, que leva junto o card e os cantos */}
        <div
          className={cn(
            'relative',
            // Ao entrar: espera a mensagem aparecer e fecha (vira uma linha e some)
            granted ? 'system-window-close [animation-delay:200ms]' : 'system-window-open',
          )}
        >
          {/* Cantos em colchete um pouco para fora do card (dentro, a borda arredondada cortaria) */}
          <div aria-hidden className="system-corners pointer-events-none absolute -inset-1.5" />
          <Card className="system-panel bg-card/85 relative overflow-hidden backdrop-blur-sm">
            {/* Linha de varredura: só enfeite */}
            <div
              aria-hidden
              data-motion
              className="via-brand/60 pointer-events-none absolute inset-x-0 h-px bg-gradient-to-r from-transparent to-transparent"
              style={{ top: '-10%', animation: 'system-scan 7s linear 1s infinite' }}
            />

            <CardHeader>
              <span className="system-tag w-fit">[ SISTEMA ]</span>
              <CardTitle>
                <h1 className="mt-2 text-xl">{title}</h1>
              </CardTitle>
              <CardDescription>
                <Typewriter text={description} />
              </CardDescription>
            </CardHeader>
            <CardContent>{children}</CardContent>
            <CardFooter className="text-muted-foreground justify-center text-sm">{footer}</CardFooter>
          </Card>
        </div>

        {granted && (
          <div role="status" className="absolute inset-0 flex items-center justify-center">
            <p className="system-window-open system-panel bg-card rounded-md px-5 py-3 text-center">
              <span className="system-tag">[ SISTEMA ]</span>
              <span className="text-brand mt-2 block text-lg font-medium tracking-wide">Acesso concedido</span>
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
