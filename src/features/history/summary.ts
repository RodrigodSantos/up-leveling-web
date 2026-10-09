import type { DailyXp } from '@/lib/api/types'

/** Números do período: soma, média por dia e o melhor dia (o primeiro, em caso de empate). */
export function summarize(days: DailyXp[]) {
  const total = days.reduce((sum, day) => sum + day.xp, 0)
  const best = days.reduce<DailyXp | null>((top, day) => (day.xp > (top?.xp ?? 0) ? day : top), null)
  return { total, average: days.length > 0 ? Math.round(total / days.length) : 0, best }
}
