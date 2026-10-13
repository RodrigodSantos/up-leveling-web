import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '@/components/system/motion'
import { Typewriter } from '@/components/system/Typewriter'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

/** Duração do system-window-close no CSS: a janela só sai da tela depois de fechar */
export const LEVEL_UP_CLOSE_MS = 450

interface LevelUpDialogProps {
  /** Nível alcançado; null = janela fechada. */
  level: number | null
  onClose: () => void
}

/**
 * A janela do Sistema anunciando o novo nível, com as mesmas animações do card de login:
 * abre como janela (linha de luz que se expande), digita a mensagem e fecha virando uma linha.
 */
export function LevelUpDialog({ level, onClose }: LevelUpDialogProps) {
  const [closing, setClosing] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  // Um novo nível chegou: a janela abre do zero. Ajustar o estado durante a renderização (e não num efeito)
  // é o padrão que o React recomenda para "mudou uma entrada, ajusta o estado" (o mesmo do SystemWindows).
  const [shownLevel, setShownLevel] = useState(level)
  if (level !== shownLevel) {
    setShownLevel(level)
    setClosing(false)
  }

  // Se a tela for fechada no meio da animação, o timer não pode disparar depois
  useEffect(() => () => window.clearTimeout(timer.current), [])

  /**
   * O Radix tira a janela da tela assim que ela fecha, sem esperar a nossa animação.
   * Por isso "Continuar", Esc e clique fora passam por aqui: primeiro toca o fechamento, depois avisa a tela.
   */
  function close() {
    if (closing) return
    if (prefersReducedMotion()) {
      onClose()
      return
    }
    setClosing(true)
    timer.current = window.setTimeout(onClose, LEVEL_UP_CLOSE_MS)
  }

  return (
    <Dialog open={level !== null} onOpenChange={(open) => !open && close()}>
      {/*
        O DialogContent só segura a posição (ele se centraliza com transform: translate).
        A animação de abrir/fechar também usa transform, então fica numa camada de dentro;
        no mesmo elemento, uma apagaria a outra e a janela sairia do centro.
      */}
      <DialogContent
        showCloseButton={false}
        className="gap-0 bg-transparent p-0 ring-0 data-closed:animate-none data-open:animate-none sm:max-w-sm"
      >
        <div className={cn('relative', closing ? 'system-window-close' : 'system-window-open')}>
          {/* Cantos em colchete um pouco para fora do painel, como no card de login */}
          <div aria-hidden className="system-corners pointer-events-none absolute -inset-1.5" />
          <div className="system-panel bg-popover text-popover-foreground relative grid gap-4 overflow-hidden rounded-xl p-4 text-center text-sm">
            {/* Linha de varredura: só enfeite */}
            <div
              aria-hidden
              data-motion
              className="via-brand/60 pointer-events-none absolute inset-x-0 h-px bg-gradient-to-r from-transparent to-transparent"
              style={{ top: '-10%', animation: 'system-scan 7s linear 1s infinite' }}
            />

            <DialogHeader className="items-center">
              <span className="system-tag">[ SISTEMA ]</span>
              <DialogTitle className="mt-3 text-2xl">Você subiu para o nível {level}!</DialogTitle>
              <DialogDescription>
                {/* Começa a digitar quando a janela termina de abrir (650 ms) */}
                <Typewriter text="Continue cumprindo suas missões para ficar ainda mais forte." delay={700} />
              </DialogDescription>
            </DialogHeader>

            <div className="mx-auto w-24">
              {/* O quadro acende (cresce com brilho e assenta) logo depois que a janela abre */}
              <div
                data-motion
                className="border-brand text-brand flex size-24 flex-col items-center justify-center rounded-xl border-2 leading-none"
                style={{ animation: 'system-glow 900ms ease-out 550ms both' }}
              >
                <span className="text-muted-foreground text-xs">NÍVEL</span>
                <span className="text-5xl font-medium">{level}</span>
              </div>
              {/* Barra enchendo, como a da janela [ STATUS ] do login */}
              <div aria-hidden className="bg-muted mt-3 h-1.5 overflow-hidden rounded-full">
                <div
                  data-motion
                  className="bg-brand h-full w-full rounded-full shadow-[0_0_6px_var(--brand)]"
                  style={{ animation: 'system-fill 1.2s ease-out 900ms both' }}
                />
              </div>
            </div>

            <DialogFooter className="sm:justify-center">
              <Button onClick={close}>Continuar</Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
