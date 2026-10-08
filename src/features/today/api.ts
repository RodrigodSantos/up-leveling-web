import { api } from '@/lib/api/client'
import type { CheckInResponse, ProgressResponse, TodayResponse } from '@/lib/api/types'

/**
 * Chaves do cache (TanStack Query). Cada dado guardado tem um "endereço":
 * - ['progress']: XP e nível (usado no cabeçalho de todas as telas)
 * - ['today', 'hoje' | 'ontem']: o resumo de cada dia, guardados separadamente
 */
export const queryKeys = {
  progress: ['progress'] as const,
  today: (day: Day) => ['today', day] as const,
}

export type Day = 'hoje' | 'ontem'

/** Data de ontem no formato da API (yyyy-MM-dd), no fuso de quem usa o app. */
export function yesterday(): string {
  // 'sv-SE' formata como 2026-10-07, que é exatamente o formato ISO
  return new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleDateString('sv-SE')
}

export function fetchToday(day: Day): Promise<TodayResponse> {
  return api<TodayResponse>(day === 'ontem' ? `/api/today?date=${yesterday()}` : '/api/today')
}

export function fetchProgress(): Promise<ProgressResponse> {
  return api<ProgressResponse>('/api/me/progress')
}

export function checkIn(habitId: number, day: Day): Promise<CheckInResponse> {
  return api<CheckInResponse>(`/api/habits/${habitId}/check-ins`, {
    method: 'POST',
    // Hoje: sem body (a API usa a data de hoje). Ontem: manda a data.
    body: day === 'ontem' ? { date: yesterday() } : undefined,
  })
}

export function undoCheckIn(habitId: number, day: Day): Promise<CheckInResponse> {
  const query = day === 'ontem' ? `?date=${yesterday()}` : ''
  return api<CheckInResponse>(`/api/habits/${habitId}/check-ins${query}`, { method: 'DELETE' })
}
