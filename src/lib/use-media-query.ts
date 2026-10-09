import { useSyncExternalStore } from 'react'

/**
 * Acompanha uma media query do CSS (ex.: '(min-width: 1024px)') e renderiza de novo quando ela muda,
 * como ao redimensionar a janela. useSyncExternalStore é o jeito do React de "assinar" algo de fora dele.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query)
      media.addEventListener('change', onChange)
      return () => media.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
  )
}
