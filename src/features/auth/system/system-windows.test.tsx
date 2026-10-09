import { act, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SystemWindows } from './SystemWindows'

/**
 * Tela simulada: a largura (tela larga ou não) muda quando o teste quiser, avisando quem assinou o "change",
 * como o navegador faz ao redimensionar a janela. O "reduzir movimento" fica desligado aqui.
 */
function fakeScreen(initiallyWide: boolean) {
  let wide = initiallyWide
  const listeners = new Set<() => void>()
  window.matchMedia = ((query: string) => ({
    matches: query.includes('min-width') ? wide : false,
    media: query,
    addEventListener: (_: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
  })) as unknown as typeof window.matchMedia
  return {
    resize(nowWide: boolean) {
      wide = nowWide
      act(() => listeners.forEach((listener) => listener()))
    },
  }
}

/** Cada janela: a etiqueta e se está abrindo ou fechando (pela classe da animação) */
function windows(container: HTMLElement) {
  return [...container.querySelectorAll('.system-tag')].map((tag) => ({
    tag: tag.textContent,
    closing: tag.parentElement!.classList.contains('system-window-close'),
    delay: (tag.parentElement as HTMLElement).style.animationDelay,
  }))
}

const originalMatchMedia = window.matchMedia

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  window.matchMedia = originalMatchMedia
})

describe('janelas do Sistema', () => {
  it('em tela larga, as três abrem uma de cada vez', () => {
    fakeScreen(true)
    const { container } = render(<SystemWindows />)

    expect(windows(container)).toEqual([
      { tag: '[ STATUS ]', closing: false, delay: '0.3s' },
      { tag: '[ MISSÃO DIÁRIA ]', closing: false, delay: '0.7s' },
      { tag: '[ ALERTA ]', closing: false, delay: '1.1s' },
    ])
  })

  it('ao estreitar, fecham na ordem inversa e só depois saem da página', () => {
    const screen = fakeScreen(true)
    const { container } = render(<SystemWindows />)

    screen.resize(false)

    // A última que abriu (Alerta) fecha primeiro
    expect(windows(container)).toEqual([
      { tag: '[ STATUS ]', closing: true, delay: '0.24s' },
      { tag: '[ MISSÃO DIÁRIA ]', closing: true, delay: '0.12s' },
      { tag: '[ ALERTA ]', closing: true, delay: '0s' },
    ])

    act(() => vi.advanceTimersByTime(700)) // 0,24 s de espera + 0,45 s de animação
    expect(windows(container)).toEqual([])
  })

  it('ao alargar de novo, reabrem mais rápido', () => {
    const screen = fakeScreen(true)
    const { container } = render(<SystemWindows />)
    screen.resize(false)
    act(() => vi.advanceTimersByTime(700))

    screen.resize(true)

    expect(windows(container).map((w) => w.delay)).toEqual(['0s', '0.15s', '0.3s'])
  })

  it('alargar no meio do fechamento cancela a saída e elas reabrem', () => {
    const screen = fakeScreen(true)
    const { container } = render(<SystemWindows />)
    screen.resize(false)
    act(() => vi.advanceTimersByTime(300))

    screen.resize(true)
    act(() => vi.advanceTimersByTime(1000))

    expect(windows(container).every((w) => !w.closing)).toBe(true)
    expect(windows(container)).toHaveLength(3)
  })

  it('carregando já estreita, não mostra nada; ao alargar, abre com o ritmo da primeira vez', () => {
    const screen = fakeScreen(false)
    const { container } = render(<SystemWindows />)
    expect(windows(container)).toEqual([])

    screen.resize(true)

    expect(windows(container).map((w) => w.delay)).toEqual(['0.3s', '0.7s', '1.1s'])
  })
})
