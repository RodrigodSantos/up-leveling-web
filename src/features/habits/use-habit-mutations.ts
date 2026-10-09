import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ApiError } from '@/lib/api/api-error'
import type { HabitRequest, HabitResponse } from '@/lib/api/types'
import { changeHabitStatus, createHabit, deleteHabit, habitKeys, updateHabit } from './api'

/**
 * Tudo que altera hábitos. Depois de cada mudança, duas partes do cache ficam desatualizadas:
 * - ['habits']: as listas desta tela (todos, ativos, pausados);
 * - ['today']: as missões do dia, porque criar, pausar ou excluir muda quais hábitos aparecem lá.
 * Invalidar = marcar como "velho"; o que estiver na tela é buscado de novo na hora, o resto quando for aberto.
 */
export function useHabitMutations() {
  const queryClient = useQueryClient()

  function refresh() {
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: habitKeys.all }),
      queryClient.invalidateQueries({ queryKey: ['today'] }),
    ])
  }

  function showError(error: unknown) {
    toast.error(error instanceof ApiError ? error.message : 'Não foi possível concluir. Tente de novo.')
  }

  // Criar e editar usam o mesmo formulário: com id é PUT, sem id é POST.
  // Os erros (ex.: 409 do nome repetido) são tratados no próprio formulário, não aqui.
  const save = useMutation({
    mutationFn: ({ id, request }: { id?: number; request: HabitRequest }) =>
      id === undefined ? createHabit(request) : updateHabit(id, request),
    onSuccess: async (habit, { id }) => {
      await refresh()
      toast.success(id === undefined ? `Hábito criado: ${habit.name}` : `Hábito atualizado: ${habit.name}`)
    },
  })

  const toggleStatus = useMutation({
    mutationFn: (habit: HabitResponse) => changeHabitStatus(habit.id, habit.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'),
    onSuccess: async (habit) => {
      await refresh()
      if (habit.status === 'PAUSED') {
        toast(`${habit.name} pausado. Ele sai das missões do dia até ser reativado.`)
      } else {
        toast.success(`${habit.name} reativado. Ele volta para as missões do dia.`)
      }
    },
    onError: showError,
  })

  const remove = useMutation({
    mutationFn: (habit: HabitResponse) => deleteHabit(habit.id),
    onSuccess: async (_, habit) => {
      await refresh()
      toast(`Hábito excluído: ${habit.name}`)
    },
    onError: showError,
  })

  return { save, toggleStatus, remove }
}
