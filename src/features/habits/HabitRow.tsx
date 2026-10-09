import { EllipsisVertical, Pause, Pencil, Play, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { HabitResponse } from '@/lib/api/types'
import { cn } from '@/lib/utils'
import { formatDays } from './days'

interface HabitRowProps {
  habit: HabitResponse
  busy: boolean
  onEdit: (habit: HabitResponse) => void
  onToggleStatus: (habit: HabitResponse) => void
  onDelete: (habit: HabitResponse) => void
}

/** Uma linha da lista de hábitos: nome, XP, meta, dias, etiqueta de pausado e o menu de ações. */
export function HabitRow({ habit, busy, onEdit, onToggleStatus, onDelete }: HabitRowProps) {
  const paused = habit.status === 'PAUSED'

  return (
    <li className={cn('bg-card flex items-center gap-3 rounded-lg border p-3', paused && 'opacity-70')}>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-medium">{habit.name}</span>
          {paused && <Badge variant="secondary">Pausado</Badge>}
        </div>
        <p className="text-muted-foreground flex flex-wrap gap-x-3 text-xs">
          <span className="text-brand">+{habit.xpReward} XP</span>
          {habit.dailyTarget > 1 && <span>{habit.dailyTarget}x por dia</span>}
          <span>{formatDays(habit.days)}</span>
        </p>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" disabled={busy} aria-label={`Ações: ${habit.name}`}>
            <EllipsisVertical aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => onEdit(habit)}>
            <Pencil aria-hidden />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onToggleStatus(habit)}>
            {paused ? <Play aria-hidden /> : <Pause aria-hidden />}
            {paused ? 'Reativar' : 'Pausar'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => onDelete(habit)}>
            <Trash2 aria-hidden />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  )
}
