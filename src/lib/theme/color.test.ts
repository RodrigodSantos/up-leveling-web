import { describe, expect, it } from 'vitest'
import { accentPalette, contrast } from './color'

const LIGHT_BACKGROUND = '#f4f7fc'
const DARK_CARD = '#0d1424'
const allHues = Array.from({ length: 360 }, (_, hue) => hue)

describe('accentPalette', () => {
  it('em qualquer matiz, o destaque e o texto do botão têm pelo menos 4,5:1 de contraste, nos dois modos', () => {
    for (const hue of allHues) {
      const { light, dark } = accentPalette(hue)
      expect(contrast(light.brand, LIGHT_BACKGROUND), `claro, ${hue}°`).toBeGreaterThanOrEqual(4.5)
      expect(contrast(light.foreground, light.brand), `botão claro, ${hue}°`).toBeGreaterThanOrEqual(4.5)
      expect(contrast(dark.brand, DARK_CARD), `escuro, ${hue}°`).toBeGreaterThanOrEqual(4.5)
      expect(contrast(dark.foreground, dark.brand), `botão escuro, ${hue}°`).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('nas matizes das 5 cores originais, o modo escuro sai igual (ou quase) ao que era feito à mão', () => {
    // Diferença de no máximo 10 em cada canal (de 0 a 255): imperceptível. O amarelo é o que mais muda
    // (#fec646 x #ffc53d), porque a cor original está no limite do sRGB
    const original: [number, string][] = [
      [251, '#3b9eff'],
      [18, '#ff5c6c'],
      [84, '#ffc53d'],
      [294, '#a78bfa'],
      [163, '#34d399'],
    ]
    for (const [hue, hex] of original) {
      const got = accentPalette(hue).dark.brand
      for (const i of [1, 3, 5]) {
        expect(
          Math.abs(parseInt(got.slice(i, i + 2), 16) - parseInt(hex.slice(i, i + 2), 16)),
          `${hue}°`,
        ).toBeLessThanOrEqual(10)
      }
    }
  })

  it('com destaque vermelho ou laranja, o erro vira magenta; nas outras matizes, fica o vermelho padrão', () => {
    const magenta = { light: '#b4236b', dark: '#ff6fa8' }
    expect(accentPalette(18).destructive).toEqual(magenta) // o vermelho original
    expect(accentPalette(45).destructive).toEqual(magenta)
    expect(accentPalette(0).destructive).toBeUndefined() // rosa: o magenta ficaria igual a ele
    expect(accentPalette(251).destructive).toBeUndefined()
  })

  it('aceita matiz fora de 0–359 (dá a volta no círculo)', () => {
    expect(accentPalette(360)).toEqual(accentPalette(0))
    expect(accentPalette(-109)).toEqual(accentPalette(251))
  })
})
