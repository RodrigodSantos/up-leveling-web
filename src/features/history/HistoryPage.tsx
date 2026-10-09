import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useSearchParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { fetchHabits, habitKeys } from '@/features/habits/api'
import { formatLongDate } from '@/lib/dates'
import { fetchDailyCheckIns, fetchXpHistory, historyKeys, PERIODS, type Period } from './api'
import { summarize } from './summary'
import { XpChart } from './XpChart'

/**
 * Lê os filtros da URL (?periodo=7&habito=3&pagina=2), com valores padrão para o que faltar ou vier inválido.
 * Assim o F5, o voltar do navegador e um link compartilhado abrem a tela do mesmo jeito.
 */
function readParams(searchParams: URLSearchParams) {
  const period = Number(searchParams.get('periodo'))
  const habitId = Number(searchParams.get('habito'))
  const page = Number(searchParams.get('pagina'))
  return {
    period: (PERIODS as readonly number[]).includes(period) ? (period as Period) : 30,
    habitId: Number.isInteger(habitId) && habitId > 0 ? habitId : undefined,
    page: Number.isInteger(page) && page > 1 ? page : 1,
  }
}

/** Tela de histórico: gráfico de XP por dia e a lista paginada de check-ins, com filtro por hábito. */
export function HistoryPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { period, habitId, page } = readParams(searchParams)

  /** Troca só os parâmetros informados e mantém os outros; null tira o parâmetro da URL. */
  function updateParams(changes: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(changes)) {
      if (value === null) {
        next.delete(key)
      } else {
        next.set(key, value)
      }
    }
    setSearchParams(next)
  }

  const xpHistory = useQuery({ queryKey: historyKeys.xp(period), queryFn: () => fetchXpHistory(period) })
  const habits = useQuery({ queryKey: habitKeys.list('todos'), queryFn: () => fetchHabits('todos') })
  const checkIns = useQuery({
    queryKey: historyKeys.checkIns(habitId, page),
    queryFn: () => fetchDailyCheckIns(habitId, page),
    // Ao trocar de página, a página anterior continua na tela até a nova chegar (sem "piscar" o carregando)
    placeholderData: keepPreviousData,
  })

  const summary = xpHistory.data ? summarize(xpHistory.data) : null
  const totalPages = checkIns.data?.page.totalPages ?? 0

  return (
    <section className="space-y-6">
      <header>
        <p className="text-muted-foreground text-sm">Cada check-in fica registrado aqui</p>
        <h1 className="text-2xl font-medium">Histórico</h1>
      </header>

      <div className="bg-card space-y-4 rounded-lg border p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-medium">XP por dia</h2>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            spacing={1}
            aria-label="Período do gráfico"
            value={String(period)}
            // Clicar no período já marcado devolve "": nesse caso, nada muda
            onValueChange={(value) => value && updateParams({ periodo: value === '30' ? null : value })}
          >
            {PERIODS.map((days) => (
              <ToggleGroupItem
                key={days}
                value={String(days)}
                className="data-[state=on]:border-brand data-[state=on]:bg-brand/15 data-[state=on]:text-brand px-3"
              >
                {days} dias
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        {xpHistory.isPending && <Skeleton className="h-72" aria-label="Carregando gráfico" />}
        {xpHistory.isError && (
          <ErrorBox
            message={`Não foi possível carregar o gráfico. ${xpHistory.error.message}`}
            retry={xpHistory.refetch}
          />
        )}
        {xpHistory.data && summary && (
          <>
            <dl className="grid grid-cols-3 gap-3">
              <Stat label="XP no período" value={`+${summary.total}`} />
              <Stat label="Média por dia" value={`${summary.average} XP`} />
              <Stat label="Melhor dia" value={summary.best ? `+${summary.best.xp}` : '—'} />
            </dl>
            <XpChart days={xpHistory.data} />
          </>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-medium">Check-ins</h2>
          <Select
            value={habitId === undefined ? 'todos' : String(habitId)}
            // Trocar o filtro volta para a página 1 (a página 4 de "todos" pode não existir no filtro novo)
            onValueChange={(value) => updateParams({ habito: value === 'todos' ? null : value, pagina: null })}
          >
            <SelectTrigger size="sm" className="w-56" aria-label="Filtrar por hábito">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os hábitos</SelectItem>
              {habits.data?.map((habit) => (
                <SelectItem key={habit.id} value={String(habit.id)}>
                  {habit.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {checkIns.isPending && (
          <div className="space-y-2" aria-label="Carregando check-ins">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        )}
        {checkIns.isError && (
          <ErrorBox
            message={`Não foi possível carregar os check-ins. ${checkIns.error.message}`}
            retry={checkIns.refetch}
          />
        )}

        {checkIns.data &&
          (checkIns.data.content.length === 0 ? (
            <div className="space-y-3 rounded-lg border border-dashed p-8 text-center">
              <p className="font-medium">{page > 1 ? 'Esta página não existe' : 'Nenhum check-in ainda'}</p>
              {page > 1 ? (
                <Button variant="outline" size="sm" onClick={() => updateParams({ pagina: null })}>
                  Ir para a primeira página
                </Button>
              ) : (
                <p className="text-muted-foreground text-sm">Os check-ins feitos em Missões diárias aparecem aqui.</p>
              )}
            </div>
          ) : (
            // Enquanto a próxima página carrega, a atual fica meio apagada
            <div className={checkIns.isPlaceholderData ? 'opacity-60' : undefined}>
              {/* A API já manda cada dia inteiro, com os check-ins do mesmo hábito somados */}
              {checkIns.data.content.map((day) => (
                <section key={day.date} className="mb-4" aria-label={formatLongDate(day.date)}>
                  <h3 className="text-muted-foreground mb-2 flex justify-between text-sm">
                    <span>{formatLongDate(day.date)}</span>
                    <span className="tabular-nums">+{day.xp} XP no dia</span>
                  </h3>
                  <ul className="bg-card divide-y rounded-lg border">
                    {day.habits.map((row) => (
                      <li key={row.habitId} className="flex items-center justify-between gap-3 px-3 py-2">
                        <span className="min-w-0 truncate">
                          {row.habitName}
                          {/* Só mostra a quantidade quando o hábito teve mais de um check-in no dia */}
                          {row.count > 1 && (
                            <span className="text-muted-foreground ml-2 text-sm tabular-nums">
                              <span aria-hidden>×{row.count}</span>
                              <span className="sr-only">{row.count} check-ins</span>
                            </span>
                          )}
                        </span>
                        <span className="shrink-0 text-sm tabular-nums">
                          <span className="text-brand">+{row.xp} XP</span>
                          {row.bonusXp > 0 && <span className="text-streak ml-2">+{row.bonusXp} bônus</span>}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          ))}

        {totalPages > 1 && (
          <nav className="flex items-center justify-between gap-3" aria-label="Paginação">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => updateParams({ pagina: page - 1 === 1 ? null : String(page - 1) })}
            >
              <ChevronLeft aria-hidden />
              Anterior
            </Button>
            <span className="text-muted-foreground text-sm tabular-nums">
              Página {page} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || checkIns.isPlaceholderData}
              onClick={() => updateParams({ pagina: String(page + 1) })}
            >
              Próxima
              <ChevronRight aria-hidden />
            </Button>
          </nav>
        )}
      </div>
    </section>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-lg font-medium tabular-nums">{value}</dd>
    </div>
  )
}

function ErrorBox({ message, retry }: { message: string; retry: () => void }) {
  return (
    <div role="alert" className="border-destructive/50 space-y-3 rounded-lg border p-4">
      <p>{message}</p>
      <Button variant="outline" size="sm" onClick={() => retry()}>
        Tentar de novo
      </Button>
    </div>
  )
}
