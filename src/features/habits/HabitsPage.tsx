import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { HabitResponse } from '@/lib/api/types'
import { fetchHabits, habitKeys, type HabitFilter } from './api'
import { HabitFormDialog } from './HabitFormDialog'
import { HabitRow } from './HabitRow'
import { useHabitMutations } from './use-habit-mutations'

const filters: { value: HabitFilter; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'ativos', label: 'Ativos' },
  { value: 'pausados', label: 'Pausados' },
]

const emptyMessages: Record<HabitFilter, string> = {
  todos: 'Você ainda não tem hábitos',
  ativos: 'Nenhum hábito ativo',
  pausados: 'Nenhum hábito pausado',
}

function parseFilter(value: string | null): HabitFilter {
  return value === 'ativos' || value === 'pausados' ? value : 'todos'
}

/** Tela de hábitos: lista com filtro, criar, editar, pausar/reativar e excluir. */
export function HabitsPage() {
  // O filtro fica na URL (?status=pausados), como o ?dia=ontem da tela de missões
  const [searchParams, setSearchParams] = useSearchParams()
  const filter = parseFilter(searchParams.get('status'))

  const habits = useQuery({ queryKey: habitKeys.list(filter), queryFn: () => fetchHabits(filter) })
  const { toggleStatus, remove } = useHabitMutations()

  // Qual janela está aberta: o formulário (com o hábito a editar, ou null para criar) ou a confirmação de exclusão
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<HabitResponse | null>(null)
  const [toDelete, setToDelete] = useState<HabitResponse | null>(null)

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(habit: HabitResponse) {
    setEditing(habit)
    setFormOpen(true)
  }

  function changeFilter(value: string) {
    // No ToggleGroup "single", clicar no item já marcado devolve "": nesse caso, o filtro fica como está
    if (value) {
      setSearchParams(value === 'todos' ? {} : { status: value })
    }
  }

  const isBusy = (habit: HabitResponse) =>
    (toggleStatus.isPending && toggleStatus.variables?.id === habit.id) ||
    (remove.isPending && remove.variables?.id === habit.id)

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-sm">Defina as missões que se repetem</p>
          <h1 className="text-2xl font-medium">Hábitos</h1>
        </div>
        <Button onClick={openCreate}>
          <Plus aria-hidden />
          Criar hábito
        </Button>
      </header>

      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        spacing={1}
        aria-label="Filtrar hábitos"
        value={filter}
        onValueChange={changeFilter}
      >
        {filters.map((item) => (
          <ToggleGroupItem
            key={item.value}
            value={item.value}
            className="data-[state=on]:border-brand data-[state=on]:bg-brand/15 data-[state=on]:text-brand px-3"
          >
            {item.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      {habits.isPending && (
        <div className="space-y-2" aria-label="Carregando hábitos">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      )}

      {habits.isError && (
        <div role="alert" className="border-destructive/50 space-y-3 rounded-lg border p-4">
          <p>Não foi possível carregar seus hábitos. {habits.error.message}</p>
          <Button variant="outline" size="sm" onClick={() => habits.refetch()}>
            Tentar de novo
          </Button>
        </div>
      )}

      {habits.data &&
        (habits.data.length === 0 ? (
          <div className="space-y-3 rounded-lg border border-dashed p-8 text-center">
            <p className="font-medium">{emptyMessages[filter]}</p>
            {filter === 'todos' && (
              <>
                <p className="text-muted-foreground text-sm">
                  Crie o primeiro e ele aparece nas missões diárias a partir de hoje.
                </p>
                <Button variant="outline" size="sm" onClick={openCreate}>
                  Criar hábito
                </Button>
              </>
            )}
          </div>
        ) : (
          <ul className="space-y-2" aria-label="Hábitos">
            {habits.data.map((habit) => (
              <HabitRow
                key={habit.id}
                habit={habit}
                busy={isBusy(habit)}
                onEdit={openEdit}
                onToggleStatus={(h) => toggleStatus.mutate(h)}
                onDelete={setToDelete}
              />
            ))}
          </ul>
        ))}

      <HabitFormDialog open={formOpen} onOpenChange={setFormOpen} habit={editing} />

      {/* Exclusão pede confirmação: open depende de haver um hábito escolhido */}
      <AlertDialog open={toDelete !== null} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir “{toDelete?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Ele sai da lista e das missões do dia. O histórico de check-ins e o XP já ganho continuam.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => toDelete && remove.mutate(toDelete)}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
