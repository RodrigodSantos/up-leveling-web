// Datas da API chegam como "2026-10-08" (sem hora). São lidas em UTC para o dia não "voltar" por causa do fuso.

function format(isoDate: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('pt-BR', { ...options, timeZone: 'UTC' }).format(new Date(`${isoDate}T00:00:00Z`))
}

/** "2026-10-08" → "Quinta-feira, 8 de outubro" */
export function formatLongDate(isoDate: string): string {
  const text = format(isoDate, { weekday: 'long', day: 'numeric', month: 'long' })
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** "2026-10-08" → "8/10" (eixo do gráfico) */
export function formatShortDate(isoDate: string): string {
  return format(isoDate, { day: 'numeric', month: 'numeric' })
}

/** "2026-10-08" (ou "2026-10-08T10:00:00") → "8 de outubro de 2026" */
export function formatFullDate(isoDate: string): string {
  return format(isoDate.slice(0, 10), { day: 'numeric', month: 'long', year: 'numeric' })
}
