/**
 * Cálculo da cor de destaque a partir de uma matiz (0–359°), em OKLCH.
 *
 * OKLCH descreve a cor como L (luminosidade, 0–1), C (saturação) e H (matiz, o ângulo no arco-íris).
 * Diferente do HSL, o mesmo L parece igualmente claro em qualquer matiz, o que facilita manter o contraste.
 *
 * Mesmo assim, uma fórmula única não serve: amarelo só parece amarelo bem claro, e o azul fica lavado se for
 * claro demais. Por isso as 5 cores feitas à mão viram pontos de referência, e qualquer matiz entre elas é
 * interpolada. Depois, duas correções garantem o resultado:
 * 1. gama: se a cor não existe na tela (fora do sRGB), a saturação baixa até caber;
 * 2. contraste: a luminosidade se ajusta até o texto ter pelo menos 4,5:1 (o mínimo da WCAG para texto).
 */

interface Tone {
  l: number
  c: number
}

/** As 5 cores originais, medidas em OKLCH: matiz → tom no modo claro e no escuro. */
const ANCHORS: { hue: number; light: Tone; dark: Tone }[] = [
  { hue: 18, light: { l: 0.568, c: 0.203 }, dark: { l: 0.694, c: 0.198 } }, // vermelho
  { hue: 84, light: { l: 0.554, c: 0.117 }, dark: { l: 0.854, c: 0.157 } }, // amarelo
  { hue: 163, light: { l: 0.561, c: 0.119 }, dark: { l: 0.773, c: 0.153 } }, // verde
  { hue: 251, light: { l: 0.531, c: 0.191 }, dark: { l: 0.688, c: 0.169 } }, // azul
  { hue: 294, light: { l: 0.521, c: 0.228 }, dark: { l: 0.709, c: 0.159 } }, // roxo
]

/** Fundos em que o destaque aparece como texto (o pior caso de cada modo). */
const LIGHT_BACKGROUND = '#f4f7fc'
const DARK_CARD = '#0d1424'
const MIN_CONTRAST = 4.5

export interface AccentPalette {
  light: { brand: string; foreground: string }
  dark: { brand: string; foreground: string }
  /** Só nas matizes perto do vermelho: o erro vira magenta para não se confundir com o destaque */
  destructive?: { light: string; dark: string }
}

/** Tom de referência para a matiz: mistura os dois pontos de referência vizinhos, proporcional à distância. */
function interpolate(hue: number, mode: 'light' | 'dark'): Tone {
  for (let i = 0; i < ANCHORS.length; i++) {
    const from = ANCHORS[i]
    const to = ANCHORS[(i + 1) % ANCHORS.length]
    // O último trecho dá a volta no círculo (do roxo, 294°, ao vermelho, 18° + 360°)
    const start = from.hue
    const end = to.hue > from.hue ? to.hue : to.hue + 360
    const h = hue < start ? hue + 360 : hue
    if (h >= start && h <= end) {
      const t = (h - start) / (end - start)
      return {
        l: from[mode].l + (to[mode].l - from[mode].l) * t,
        c: from[mode].c + (to[mode].c - from[mode].c) * t,
      }
    }
  }
  return ANCHORS[0][mode]
}

/** OKLCH → sRGB linear (fórmulas de Björn Ottosson, criador do OKLab). */
function oklchToLinearRgb(l: number, c: number, hue: number): [number, number, number] {
  const a = c * Math.cos((hue * Math.PI) / 180)
  const b = c * Math.sin((hue * Math.PI) / 180)
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ]
}

function inGamut(rgb: number[]): boolean {
  return rgb.every((channel) => channel >= -0.0001 && channel <= 1.0001)
}

/** Linear → sRGB com a curva de gama da tela, em hexadecimal (#rrggbb). */
function linearToHex(rgb: number[]): string {
  return (
    '#' +
    rgb
      .map((channel) => {
        const v = Math.min(1, Math.max(0, channel))
        const srgb = v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055
        return Math.round(srgb * 255)
          .toString(16)
          .padStart(2, '0')
      })
      .join('')
  )
}

/** Luminância relativa da WCAG (0 = preto, 1 = branco). */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Contraste da WCAG entre duas cores: de 1:1 (iguais) a 21:1 (preto no branco). */
export function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (light + 0.05) / (dark + 0.05)
}

/** Cor em hex, com a saturação reduzida até caber no sRGB. */
function toHex(l: number, c: number, hue: number): string {
  let chroma = c
  while (chroma > 0 && !inGamut(oklchToLinearRgb(l, chroma, hue))) {
    chroma -= 0.005
  }
  return linearToHex(oklchToLinearRgb(l, Math.max(0, chroma), hue))
}

/**
 * Cor de destaque de um modo, com o contraste garantido contra o fundo.
 * No claro, escurece até contrastar com o fundo claro; no escuro, clareia até contrastar com o card.
 */
function brandFor(hue: number, mode: 'light' | 'dark'): string {
  const { c } = interpolate(hue, mode)
  let { l } = interpolate(hue, mode)
  const background = mode === 'light' ? LIGHT_BACKGROUND : DARK_CARD
  const step = mode === 'light' ? -0.01 : 0.01
  let color = toHex(l, c, hue)
  while (contrast(color, background) < MIN_CONTRAST && l > 0.05 && l < 0.95) {
    l += step
    color = toHex(l, c, hue)
  }
  return color
}

/** Distância entre duas matizes no círculo (de 0 a 180°). */
function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360
  return d > 180 ? 360 - d : d
}

/** Todas as cores derivadas de uma matiz, para os dois modos. */
export function accentPalette(hue: number): AccentPalette {
  const h = ((Math.round(hue) % 360) + 360) % 360
  const light = brandFor(h, 'light')
  const dark = brandFor(h, 'dark')
  return {
    // Texto do botão: branco no claro (o destaque é escuro); no escuro, um tom bem escuro da mesma matiz
    light: { brand: light, foreground: '#ffffff' },
    dark: { brand: dark, foreground: toHex(0.18, 0.04, h) },
    // O erro é vermelho (22°). Se o destaque estiver perto dele, o erro vira magenta (356°), como no tema
    // vermelho original, mas só se o magenta ficar mais longe do destaque (num rosa de 0°, o vermelho distingue melhor)
    destructive:
      hueDistance(h, 22) <= 30 && hueDistance(h, 356) > hueDistance(h, 22)
        ? { light: '#b4236b', dark: '#ff6fa8' }
        : undefined,
  }
}
