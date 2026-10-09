/** Quem pediu "reduzir movimento" no sistema operacional: as animações são puladas. */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
