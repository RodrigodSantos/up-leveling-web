import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ApiError } from '@/lib/api/api-error'
import type { CheckInResponse, TodayHabit } from '@/lib/api/types'
import { checkIn, undoCheckIn, queryKeys, type Day } from './api'

interface Options {
  day: Day
  /** Chamado quando um check-in faz o usuário subir de nível (a tela mostra a janela de comemoração). */
  onLevelUp: (level: number) => void
}

/**
 * Check-in e desfazer de um hábito. Depois de cada um:
 * 1. a barra de XP do cabeçalho atualiza NA HORA com o "progress" que já veio na resposta (sem nova chamada);
 * 2. o resumo do dia é marcado como desatualizado e buscado de novo (contadores, streak, placar).
 */
export function useCheckIn({ day, onLevelUp }: Options) {
  const queryClient = useQueryClient()

  function updateScreen(response: CheckInResponse) {
    queryClient.setQueryData(queryKeys.progress, response.progress)
    return queryClient.invalidateQueries({ queryKey: ['today'] })
  }

  function showError(error: unknown) {
    toast.error(error instanceof ApiError ? error.message : 'Não foi possível concluir. Tente de novo.')
  }

  const doCheckIn = useMutation({
    mutationFn: (habit: TodayHabit) => checkIn(habit.id, day),
    onSuccess: async (response, habit) => {
      await updateScreen(response)
      toast.success(checkInMessage(response, habit))
      if (response.leveledUp) {
        onLevelUp(response.progress.level)
      }
    },
    onError: showError,
  })

  const undo = useMutation({
    mutationFn: (habit: TodayHabit) => undoCheckIn(habit.id, day),
    onSuccess: async (response) => {
      await updateScreen(response)
      toast(`Check-in desfeito. ${response.xpChange} XP`)
    },
    onError: showError,
  })

  return { doCheckIn, undo }
}

/** "[ SISTEMA ] Missão concluída. +30 XP", ou o andamento da meta diária (4/8). */
export function checkInMessage(response: CheckInResponse, habit: TodayHabit): string {
  const bonus = response.bonusXp > 0 ? ` (bônus de sequência: +${response.bonusXp})` : ''
  if (response.dayCompleted) {
    return `[ SISTEMA ] Missão concluída: ${habit.name}. +${response.xpChange} XP${bonus}`
  }
  return `${habit.name}: ${response.dayCount}/${response.dailyTarget}. +${response.xpChange} XP`
}
