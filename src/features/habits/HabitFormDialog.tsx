import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { showApiError } from '@/components/form/form-errors'
import { FormField } from '@/components/form/FormField'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { DayOfWeek, HabitResponse } from '@/lib/api/types'
import { WEEK_DAYS } from './days'
import { habitSchema, type HabitForm } from './schemas'
import { useHabitMutations } from './use-habit-mutations'

interface HabitFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** null = criar um hábito novo; com valor = editar aquele hábito */
  habit: HabitResponse | null
}

const emptyForm: HabitForm = { name: '', xpReward: 10, dailyTarget: 1, days: [] }

/** Valores iniciais do formulário: em branco para criar, ou os dados atuais do hábito para editar. */
function toFormValues(habit: HabitResponse | null): HabitForm {
  if (!habit) {
    return emptyForm
  }
  return { name: habit.name, xpReward: habit.xpReward, dailyTarget: habit.dailyTarget, days: habit.days }
}

/** Janela de criar/editar hábito: o mesmo formulário serve para os dois casos. */
export function HabitFormDialog({ open, onOpenChange, habit }: HabitFormDialogProps) {
  const isEditing = habit !== null
  const { save } = useHabitMutations()
  const form = useForm<HabitForm>({ resolver: zodResolver(habitSchema), defaultValues: emptyForm })
  const { errors } = form.formState

  // A janela fica montada o tempo todo; a cada abertura, o reset() troca os valores
  // (e limpa os erros) para os do hábito escolhido, ou deixa em branco para um novo.
  // resetForm e resetSave são funções estáveis (não mudam entre renderizações): na prática, o efeito
  // roda só ao abrir a janela ou trocar de hábito.
  const resetForm = form.reset
  const resetSave = save.reset
  useEffect(() => {
    if (open) {
      resetForm(toFormValues(habit))
      resetSave()
    }
  }, [open, habit, resetForm, resetSave])

  function onSubmit(data: HabitForm) {
    save.mutate(
      { id: habit?.id, request: data },
      {
        onSuccess: () => onOpenChange(false),
        // 409 = já existe um hábito com esse nome: a mensagem vai para o campo nome
        onError: (error) => showApiError(error, form.setError, { 409: 'name' }),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar hábito' : 'Criar hábito'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'As mudanças valem daqui para frente; o XP já ganho continua.'
              : 'Cada check-in vale XP. Escolha os dias em que ele vira missão.'}
          </DialogDescription>
        </DialogHeader>

        <form id="habit-form" onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
          <FormField
            id="habit-name"
            label="Nome"
            placeholder="Ler 20 páginas"
            maxLength={100}
            error={errors.name?.message}
            {...form.register('name')}
          />
          <div className="grid grid-cols-2 gap-3">
            {/* valueAsNumber: o input entrega número (e NaN quando vazio), não texto */}
            <FormField
              id="habit-xp"
              label="XP por check-in"
              type="number"
              inputMode="numeric"
              min={1}
              max={100}
              error={errors.xpReward?.message}
              {...form.register('xpReward', { valueAsNumber: true })}
            />
            <FormField
              id="habit-target"
              label="Meta por dia"
              type="number"
              inputMode="numeric"
              min={1}
              max={20}
              error={errors.dailyTarget?.message}
              {...form.register('dailyTarget', { valueAsNumber: true })}
            />
          </div>

          {/* Os dias não são um input comum: o Controller liga o ToggleGroup ao formulário (value + onChange) */}
          <div className="space-y-2">
            <Label id="habit-days-label">Dias da semana</Label>
            <Controller
              control={form.control}
              name="days"
              render={({ field }) => (
                <ToggleGroup
                  type="multiple"
                  variant="outline"
                  size="sm"
                  spacing={1}
                  className="flex-wrap"
                  aria-labelledby="habit-days-label"
                  value={field.value}
                  onValueChange={(value) => field.onChange(value as DayOfWeek[])}
                >
                  {WEEK_DAYS.map((day) => (
                    <ToggleGroupItem
                      key={day.value}
                      value={day.value}
                      aria-label={day.name}
                      className="data-[state=on]:border-brand data-[state=on]:bg-brand/15 data-[state=on]:text-brand"
                    >
                      {day.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              )}
            />
            <p className="text-muted-foreground text-xs">Nenhum dia marcado = todos os dias.</p>
          </div>

          {errors.root && (
            <p role="alert" className="text-destructive text-sm">
              {errors.root.message}
            </p>
          )}
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" form="habit-form" disabled={save.isPending}>
            {save.isPending ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar hábito'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
