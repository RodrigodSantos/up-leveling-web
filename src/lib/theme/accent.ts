// Cor de destaque escolhida pelo usuário (o modo claro/escuro fica com o next-themes).
// Fica no <html> como data-accent; as cores de cada uma estão no index.css.

export const ACCENTS = ['blue', 'red', 'yellow', 'purple', 'green'] as const
export type Accent = (typeof ACCENTS)[number]

export const ACCENT_LABELS: Record<Accent, string> = {
  blue: 'Azul',
  red: 'Vermelho',
  yellow: 'Amarelo',
  purple: 'Roxo',
  green: 'Verde',
}

/** Mesma chave lida pelo script do index.html, que aplica o tema antes da página aparecer. */
export const ACCENT_STORAGE_KEY = 'up-leveling.accent'

export function getAccent(): Accent {
  const saved = localStorage.getItem(ACCENT_STORAGE_KEY)
  return ACCENTS.includes(saved as Accent) ? (saved as Accent) : 'blue'
}

export function setAccent(accent: Accent): void {
  localStorage.setItem(ACCENT_STORAGE_KEY, accent)
  document.documentElement.dataset.accent = accent
}
