import { api } from '@/lib/api/client'
import type { HabitRequest, HabitResponse, HabitStatus } from '@/lib/api/types'

/** Filtro da tela, como aparece na URL (?status=ativos). "todos" não vai para a URL. */
export type HabitFilter = 'todos' | 'ativos' | 'pausados'

const statusByFilter: Record<HabitFilter, HabitStatus | undefined> = {
  todos: undefined,
  ativos: 'ACTIVE',
  pausados: 'PAUSED',
}

/**
 * Chaves do cache: ['habits', 'todos'], ['habits', 'ativos']...
 * Invalidar só ['habits'] marca todas as listas como desatualizadas de uma vez.
 */
export const habitKeys = {
  all: ['habits'] as const,
  list: (filter: HabitFilter) => ['habits', filter] as const,
}

export function fetchHabits(filter: HabitFilter): Promise<HabitResponse[]> {
  const status = statusByFilter[filter]
  return api<HabitResponse[]>(status ? `/api/habits?status=${status}` : '/api/habits')
}

export function createHabit(request: HabitRequest): Promise<HabitResponse> {
  return api<HabitResponse>('/api/habits', { method: 'POST', body: request })
}

export function updateHabit(id: number, request: HabitRequest): Promise<HabitResponse> {
  return api<HabitResponse>(`/api/habits/${id}`, { method: 'PUT', body: request })
}

export function changeHabitStatus(id: number, status: HabitStatus): Promise<HabitResponse> {
  return api<HabitResponse>(`/api/habits/${id}/status`, { method: 'PATCH', body: { status } })
}

export function deleteHabit(id: number): Promise<void> {
  return api<void>(`/api/habits/${id}`, { method: 'DELETE' })
}
