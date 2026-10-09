import type { DayOfWeek } from '@/lib/api/types'

/** Os 7 dias na ordem da semana (segunda primeiro, igual à API), com o rótulo curto da tela. */
export const WEEK_DAYS: { value: DayOfWeek; label: string; name: string }[] = [
  { value: 'MONDAY', label: 'Seg', name: 'Segunda' },
  { value: 'TUESDAY', label: 'Ter', name: 'Terça' },
  { value: 'WEDNESDAY', label: 'Qua', name: 'Quarta' },
  { value: 'THURSDAY', label: 'Qui', name: 'Quinta' },
  { value: 'FRIDAY', label: 'Sex', name: 'Sexta' },
  { value: 'SATURDAY', label: 'Sáb', name: 'Sábado' },
  { value: 'SUNDAY', label: 'Dom', name: 'Domingo' },
]

/** ['MONDAY', 'FRIDAY'] → "Seg · Sex"; nenhum dia (ou os 7) → "Todos os dias". */
export function formatDays(days: DayOfWeek[]): string {
  if (days.length === 0 || days.length === WEEK_DAYS.length) {
    return 'Todos os dias'
  }
  return WEEK_DAYS.filter((day) => days.includes(day.value))
    .map((day) => day.label)
    .join(' · ')
}
