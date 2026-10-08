import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { TodayHabit } from '@/lib/api/types'
import { fetchToday, queryKeys, type Day } from './api'
import { HabitCard } from './HabitCard'
import { LevelUpDialog } from './LevelUpDialog'
import { useCheckIn } from './use-check-in'

/** "2026-10-08" → "Quinta-feira, 8 de outubro" (lido em UTC para o dia não "voltar" por causa do fuso) */
function formatDate(isoDate: string): string {
  const text = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(new Date(`${isoDate}T00:00:00Z`))
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** Tela principal: as missões (hábitos) do dia, com check-in, andamento e streak. */
export function TodayPage() {
  // O dia fica na URL (?dia=ontem): o F5 e o botão voltar do navegador respeitam a escolha
  const [searchParams, setSearchParams] = useSearchParams()
  const day: Day = searchParams.get('dia') === 'ontem' ? 'ontem' : 'hoje'
  const [levelUp, setLevelUp] = useState<number | null>(null)

  // useQuery: busca o resumo do dia e guarda em cache com a chave ['today', dia]
  const today = useQuery({ queryKey: queryKeys.today(day), queryFn: () => fetchToday(day) })
  const { doCheckIn, undo } = useCheckIn({ day, onLevelUp: setLevelUp })

  const isBusy = (habit: TodayHabit) =>
    (doCheckIn.isPending && doCheckIn.variables?.id === habit.id) || (undo.isPending && undo.variables?.id === habit.id)

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-sm">
            {today.data ? formatDate(today.data.date) : ' '}
            {day === 'ontem' && ' (ontem)'}
          </p>
          <h1 className="text-2xl font-medium">Missões diárias</h1>
        </div>
        {day === 'hoje' ? (
          <Button variant="outline" size="sm" onClick={() => setSearchParams({ dia: 'ontem' })}>
            <ArrowLeft aria-hidden />
            Ver ontem
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setSearchParams({})}>
            Voltar para hoje
            <ArrowRight aria-hidden />
          </Button>
        )}
      </header>

      {today.isPending && <LoadingState />}

      {today.isError && (
        <div role="alert" className="border-destructive/50 space-y-3 rounded-lg border p-4">
          <p>Não foi possível carregar suas missões. {today.error.message}</p>
          <Button variant="outline" size="sm" onClick={() => today.refetch()}>
            Tentar de novo
          </Button>
        </div>
      )}

      {today.data && (
        <>
          <dl className="grid grid-cols-3 gap-3">
            <Stat label="Concluídas" value={`${today.data.completedCount} de ${today.data.totalCount}`} />
            <Stat label="XP no dia" value={`+${today.data.xpEarnedToday}`} />
            <Stat label="Maior sequência" value={`${Math.max(0, ...today.data.habits.map((h) => h.streak))} dias`} />
          </dl>

          {today.data.habits.length === 0 ? (
            <div className="space-y-3 rounded-lg border border-dashed p-8 text-center">
              <p className="font-medium">Nenhuma missão para este dia</p>
              <p className="text-muted-foreground text-sm">
                Crie hábitos e escolha os dias da semana em que eles valem.
              </p>
              <Button asChild variant="outline" size="sm">
                <Link to="/habitos">Ir para Hábitos</Link>
              </Button>
            </div>
          ) : (
            <ul className="space-y-2" aria-label="Missões do dia">
              {/* key = id do hábito: depois de um check-in, o React atualiza só o card que mudou */}
              {today.data.habits.map((habit) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  busy={isBusy(habit)}
                  onCheckIn={(h) => doCheckIn.mutate(h)}
                  onUndo={(h) => undo.mutate(h)}
                />
              ))}
            </ul>
          )}
        </>
      )}

      <LevelUpDialog level={levelUp} onClose={() => setLevelUp(null)} />
    </section>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card rounded-lg border p-3">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-lg font-medium tabular-nums">{value}</dd>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="space-y-3" aria-label="Carregando missões">
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-16" />
      ))}
    </div>
  )
}
