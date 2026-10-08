import { Check, Flame, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import type { TodayHabit } from '@/lib/api/types'
import { cn } from '@/lib/utils'

interface HabitCardProps {
  habit: TodayHabit
  busy: boolean
  onCheckIn: (habit: TodayHabit) => void
  onUndo: (habit: TodayHabit) => void
}

/** Um card da tela de missões: botão de check-in, andamento da meta, streak e desfazer. */
export function HabitCard({ habit, busy, onCheckIn, onUndo }: HabitCardProps) {
  const percent = Math.round((habit.count / habit.dailyTarget) * 100)

  return (
    <li
      className={cn(
        'bg-card flex items-center gap-3 rounded-lg border p-3',
        habit.completed ? 'border-success/40' : 'border-brand/50',
      )}
    >
      <Button
        size="icon"
        variant={habit.completed ? 'default' : 'outline'}
        className={cn(
          'size-10 shrink-0 rounded-full',
          habit.completed ? 'bg-success hover:bg-success text-black' : 'border-brand text-brand',
        )}
        disabled={habit.completed || busy}
        onClick={() => onCheckIn(habit)}
        aria-label={habit.completed ? `${habit.name}: concluída` : `Fazer check-in: ${habit.name}`}
      >
        {habit.completed ? <Check aria-hidden /> : <Plus aria-hidden />}
      </Button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className={cn('font-medium', habit.completed && 'text-success')}>{habit.name}</span>
          <span className="text-muted-foreground text-xs">+{habit.xpReward} XP</span>
        </div>
        {/* Barra só para hábitos com meta de mais de um check-in por dia */}
        {habit.dailyTarget > 1 && (
          <div className="mt-2 flex items-center gap-2">
            <Progress value={percent} className="h-1.5" aria-label={`Andamento de ${habit.name}`} />
            <span className="text-muted-foreground text-xs tabular-nums">
              {habit.count}/{habit.dailyTarget}
            </span>
          </div>
        )}
      </div>

      <span className="text-streak flex items-center gap-1 text-sm" title="Sequência de dias">
        <Flame className="size-4" aria-hidden />
        <span aria-label={`Sequência de ${habit.streak} dias`}>{habit.streak}</span>
      </span>

      {habit.count > 0 && (
        <Button
          variant="ghost"
          size="sm"
          disabled={busy}
          onClick={() => onUndo(habit)}
          aria-label={`Desfazer check-in: ${habit.name}`}
        >
          Desfazer
        </Button>
      )}
    </li>
  )
}
