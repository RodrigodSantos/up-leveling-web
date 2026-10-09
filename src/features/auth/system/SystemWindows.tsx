import { Check } from 'lucide-react'
import { createContext, use, useEffect, useState, type ReactNode } from 'react'
import { useMediaQuery } from '@/lib/use-media-query'
import { cn } from '@/lib/utils'
import { prefersReducedMotion } from './motion'

/** A partir desta largura há espaço para as janelas em volta do card (o "lg" do Tailwind) */
const WIDE_SCREEN = '(min-width: 1024px)'
const WINDOW_COUNT = 3
/** Duração da animação de fechar (a mesma do system-window-close no CSS), em segundos */
const CLOSE_SECONDS = 0.45
const CLOSE_STAGGER = 0.12

/** O que cada janela precisa saber: se está fechando e se é a primeira abertura (ao carregar a tela) */
const WindowsState = createContext({ closing: false, firstOpen: true })

interface SystemWindowProps {
  tag: string
  /** Posição na sequência: abrem na ordem 0, 1, 2 e fecham na ordem inversa */
  order: number
  className: string
  children: ReactNode
}

/**
 * Uma janela decorativa. São duas camadas porque cada animação usa o "transform":
 * a de fora flutua (sobe e desce) e a de dentro faz o efeito de abrir ou fechar.
 */
function SystemWindow({ tag, order, className, children }: SystemWindowProps) {
  const { closing, firstOpen } = use(WindowsState)
  // Ao carregar a tela, abrem com calma (uma a cada 0,4 s); ao reabrir depois de um redimensionamento, mais rápido
  const openDelay = firstOpen ? 0.3 + order * 0.4 : order * 0.15
  // Fecham na ordem contrária: a última que abriu é a primeira que fecha
  const closeDelay = (WINDOW_COUNT - 1 - order) * CLOSE_STAGGER

  return (
    <div className={cn('absolute w-56', className)}>
      <div className="system-float" style={{ animationDelay: `${openDelay + 0.8}s` }}>
        <div
          // Trocar a classe troca a animação, e o navegador a recomeça do zero
          className={cn(
            closing ? 'system-window-close' : 'system-window-open',
            'system-panel bg-card/70 rounded-md p-3 text-xs backdrop-blur-sm',
          )}
          style={{ animationDelay: `${closing ? closeDelay : openDelay}s` }}
        >
          <span className="system-tag mb-2">{tag}</span>
          {children}
        </div>
      </div>
    </div>
  )
}

/** Barra que enche quando a janela abre */
function Bar({ percent, delay }: { percent: number; delay: number }) {
  return (
    <div className="bg-muted mt-1 h-1.5 overflow-hidden rounded-full">
      <div
        data-motion
        className="bg-brand h-full rounded-full shadow-[0_0_6px_var(--brand)]"
        style={{ width: `${percent}%`, animation: `system-fill 1.2s ease-out ${delay}s both` }}
      />
    </div>
  )
}

/**
 * As janelas do Sistema em volta do card de login, com textos do próprio app.
 * Só em telas largas: no celular, ficariam por cima do formulário.
 *
 * Ao estreitar a tela, elas não somem de uma vez: fazem a animação de fechar e só depois saem da página.
 * Por isso a largura é acompanhada no React (useMediaQuery), e não só no CSS (hidden lg:block),
 * já que o CSS não consegue animar algo que está deixando de existir.
 */
export function SystemWindows() {
  const wide = useMediaQuery(WIDE_SCREEN)
  // mounted: as janelas ainda estão na página (durante o fechamento, wide já é false mas elas continuam)
  const [mounted, setMounted] = useState(wide)
  const [firstOpen, setFirstOpen] = useState(true)

  // Alargou: as janelas voltam na mesma renderização. Ajustar o estado aqui (e não num efeito) evita
  // um desenho a mais; o React recomenda este padrão para "mudou uma entrada, ajusta o estado".
  if (wide && !mounted) {
    setMounted(true)
  }

  useEffect(() => {
    // Só há o que fechar se as janelas estão na página (a tela pode ter carregado já estreita)
    if (wide || !mounted) return
    // Estreitou: espera a última janela terminar de fechar e então tira todas da página
    const closeMs = prefersReducedMotion() ? 0 : ((WINDOW_COUNT - 1) * CLOSE_STAGGER + CLOSE_SECONDS) * 1000
    const timer = window.setTimeout(() => {
      setMounted(false)
      setFirstOpen(false) // se a tela alargar de novo, a reabertura é mais rápida
    }, closeMs)
    // Se alargar no meio do fechamento, o timer é cancelado e as janelas reabrem de onde estão
    return () => window.clearTimeout(timer)
  }, [wide, mounted])

  if (!mounted) return null

  return (
    <WindowsState value={{ closing: !wide, firstOpen }}>
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {/* Os textos apresentam o app a quem ainda não entrou (a tela de login não tem dados de ninguém) */}
        <SystemWindow tag="[ STATUS ]" order={0} className="top-[14%] left-[8%]">
          <p className="text-brand text-sm leading-snug font-medium">Aumente seu nível a cada dia</p>
          <p className="text-muted-foreground mt-1 leading-relaxed">
            Cada check-in rende XP e enche a barra até o próximo nível.
          </p>
          <Bar percent={65} delay={1.1} />
        </SystemWindow>

        <SystemWindow tag="[ MISSÃO DIÁRIA ]" order={1} className="top-[52%] left-[6%]">
          <p className="text-brand text-sm leading-snug font-medium">Complete missões e suba de nível</p>
          <ul className="text-muted-foreground mt-2 space-y-1.5">
            {[
              'Crie hábitos com meta diária',
              'Marque cada check-in e ganhe XP',
              'Mantenha a sequência e ganhe bônus',
            ].map((text) => (
              <li key={text} className="flex items-start gap-1.5">
                <Check className="text-success mt-0.5 size-3.5 shrink-0" />
                {text}
              </li>
            ))}
          </ul>
        </SystemWindow>

        <SystemWindow tag="[ ALERTA ]" order={2} className="top-[30%] right-[7%]">
          <p className="leading-relaxed">Um novo Jogador foi detectado.</p>
          <p className="text-muted-foreground mt-1">Complete missões diárias para subir de nível.</p>
        </SystemWindow>
      </div>
    </WindowsState>
  )
}
