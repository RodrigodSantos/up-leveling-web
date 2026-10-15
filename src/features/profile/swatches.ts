import type { CSSProperties } from 'react'
import { accentPalette } from '@/lib/theme/color'

/**
 * Cores de uma bolinha de amostra nos dois modos: o CSS escolhe a do modo atual
 * (classes "bg-(--swatch-light) dark:bg-(--swatch-dark)").
 */
export function swatchStyle(hue: number): CSSProperties {
  const palette = accentPalette(hue)
  return { '--swatch-light': palette.light.brand, '--swatch-dark': palette.dark.brand } as CSSProperties
}

/** Arco-íris do controle de matiz, nos dois modos: um ponto a cada 15°, e o navegador faz a transição. */
export function rainbowStyle(): CSSProperties {
  const stops = Array.from({ length: 25 }, (_, i) => accentPalette(i * 15))
  return {
    '--rainbow-light': `linear-gradient(to right, ${stops.map((p) => p.light.brand).join(', ')})`,
    '--rainbow-dark': `linear-gradient(to right, ${stops.map((p) => p.dark.brand).join(', ')})`,
  } as CSSProperties
}
