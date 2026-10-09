import { api } from '@/lib/api/client'
import type { DailyCheckIns, DailyXp, PageResponse } from '@/lib/api/types'

/** Períodos do gráfico, em dias (a API aceita até 366). */
export const PERIODS = [7, 30, 90] as const
export type Period = (typeof PERIODS)[number]

/** Dias por página na lista de check-ins: uma semana (a API aceita até 31). */
export const DAYS_PER_PAGE = 7

/**
 * Chaves do cache. Cada combinação de filtro e página é guardada separadamente:
 * voltar para uma página já vista mostra na hora o que está no cache.
 */
export const historyKeys = {
  xp: (period: Period) => ['xp-history', period] as const,
  checkIns: (habitId: number | undefined, page: number) => ['check-ins', habitId ?? 'todos', page] as const,
}

/** Data no formato da API (yyyy-MM-dd), N dias atrás, no fuso de quem usa o app. */
export function daysAgo(days: number): string {
  // 'sv-SE' formata como 2026-10-09, que é exatamente o formato ISO
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toLocaleDateString('sv-SE')
}

/** XP por dia dos últimos N dias, hoje incluído (a API completa com 0 os dias sem check-in). */
export function fetchXpHistory(period: Period): Promise<DailyXp[]> {
  const params = new URLSearchParams({ from: daysAgo(period - 1), to: daysAgo(0) })
  return api<DailyXp[]>(`/api/me/xp-history?${params}`)
}

/**
 * Uma página do histórico agrupado: cada item é um dia inteiro, com os check-ins somados por hábito.
 * page começa em 1 na tela e em 0 na API.
 */
export function fetchDailyCheckIns(habitId: number | undefined, page: number): Promise<PageResponse<DailyCheckIns>> {
  const params = new URLSearchParams({ page: String(page - 1), size: String(DAYS_PER_PAGE) })
  if (habitId !== undefined) {
    params.set('habitId', String(habitId))
  }
  return api<PageResponse<DailyCheckIns>>(`/api/check-ins/daily?${params}`)
}
