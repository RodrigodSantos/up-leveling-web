// Cor de destaque escolhida pelo usuário (o modo claro/escuro fica com o next-themes).
// O usuário escolhe só a matiz (0–359°); as cores de cada modo saem de accentPalette (color.ts) e vão para
// variáveis CSS no <html>. O index.css usa --accent-light no modo claro e --accent-dark no escuro.

import { accentPalette } from './color'

/** Atalhos: as 5 cores originais, agora como matizes. */
export const ACCENT_PRESETS = [
  { name: 'Azul', hue: 251 },
  { name: 'Vermelho', hue: 18 },
  { name: 'Amarelo', hue: 84 },
  { name: 'Roxo', hue: 294 },
  { name: 'Verde', hue: 163 },
] as const

export const DEFAULT_HUE = 251

/** Mesmas chaves lidas pelo script do index.html, que aplica o tema antes da página aparecer. */
export const ACCENT_STORAGE_KEY = 'up-leveling.accent'
export const ACCENT_VARS_STORAGE_KEY = 'up-leveling.accent-vars'

/** Antes, a cor era salva pelo nome: quem já tinha escolhido uma continua com ela. */
const LEGACY_NAMES: Record<string, number> = { blue: 251, red: 18, yellow: 84, purple: 294, green: 163 }

export function getAccentHue(): number {
  const saved = localStorage.getItem(ACCENT_STORAGE_KEY)
  if (saved === null) return DEFAULT_HUE
  if (saved in LEGACY_NAMES) return LEGACY_NAMES[saved]
  const hue = Number(saved)
  return Number.isInteger(hue) && hue >= 0 && hue < 360 ? hue : DEFAULT_HUE
}

/** Variáveis CSS da matiz: o destaque e o texto dele nos dois modos e, perto do vermelho, a cor de erro. */
export function accentVars(hue: number): Record<string, string> {
  const palette = accentPalette(hue)
  const vars: Record<string, string> = {
    '--accent-light': palette.light.brand,
    '--accent-light-foreground': palette.light.foreground,
    '--accent-dark': palette.dark.brand,
    '--accent-dark-foreground': palette.dark.foreground,
  }
  if (palette.destructive) {
    vars['--accent-destructive-light'] = palette.destructive.light
    vars['--accent-destructive-dark'] = palette.destructive.dark
  }
  return vars
}

const VAR_NAMES = [
  '--accent-light',
  '--accent-light-foreground',
  '--accent-dark',
  '--accent-dark-foreground',
  '--accent-destructive-light',
  '--accent-destructive-dark',
]

/** Aplica a matiz no <html> (o app inteiro muda na hora) e salva neste navegador. */
export function setAccentHue(hue: number): void {
  const vars = accentVars(hue)
  const style = document.documentElement.style
  for (const name of VAR_NAMES) {
    if (vars[name]) {
      style.setProperty(name, vars[name])
    } else {
      style.removeProperty(name) // ex.: a cor de erro só existe perto do vermelho
    }
  }
  localStorage.setItem(ACCENT_STORAGE_KEY, String(hue))
  // As cores prontas também ficam salvas: o index.html só as aplica, sem precisar refazer o cálculo
  localStorage.setItem(ACCENT_VARS_STORAGE_KEY, JSON.stringify(vars))
}
