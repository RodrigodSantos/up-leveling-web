import { useEffect, useState } from 'react'
import { prefersReducedMotion } from './motion'

/**
 * Texto que aparece letra por letra, como num terminal.
 * O leitor de tela recebe a frase inteira de uma vez (sr-only); a versão animada fica escondida dele.
 */
export function Typewriter({ text, delay = 400, speed = 30 }: { text: string; delay?: number; speed?: number }) {
  const [shown, setShown] = useState(() => (prefersReducedMotion() ? text.length : 0))

  useEffect(() => {
    if (prefersReducedMotion()) return
    let timer: number
    // Primeiro espera o card abrir; depois soma uma letra a cada "speed" milissegundos
    const start = window.setTimeout(() => {
      timer = window.setInterval(() => {
        setShown((count) => {
          if (count >= text.length) {
            window.clearInterval(timer)
            return count
          }
          return count + 1
        })
      }, speed)
    }, delay)
    // Limpeza: se a tela fechar no meio, os timers param (senão continuariam rodando à toa)
    return () => {
      window.clearTimeout(start)
      window.clearInterval(timer)
    }
  }, [text, delay, speed])

  const typing = shown < text.length
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {text.slice(0, shown)}
        {typing && (
          <span
            data-motion
            className="bg-brand ml-0.5 inline-block h-[1em] w-[2px] animate-[system-caret_1s_steps(1)_infinite] align-middle"
          />
        )}
        {/* Reserva o espaço do texto que falta: o card não muda de altura enquanto digita */}
        <span className="invisible">{text.slice(shown)}</span>
      </span>
    </>
  )
}
