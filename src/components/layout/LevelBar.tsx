import { useQuery } from '@tanstack/react-query'
import { Progress } from '@/components/ui/progress'
import { fetchProgress, queryKeys } from '@/features/today/api'

/** Nível e barra de XP do cabeçalho. Atualiza sozinha após cada check-in (mesma chave de cache). */
export function LevelBar() {
  const { data: progress } = useQuery({ queryKey: queryKeys.progress, queryFn: fetchProgress })
  if (!progress) return null

  return (
    <div className="flex min-w-48 items-center gap-3">
      <div className="border-brand flex size-10 shrink-0 flex-col items-center justify-center rounded-md border leading-none">
        <span className="text-muted-foreground text-[9px]">NÍVEL</span>
        <span className="text-brand text-lg font-medium">{progress.level}</span>
      </div>
      <div className="flex-1">
        <p className="text-muted-foreground mb-1 text-right text-xs tabular-nums">
          {progress.totalXp} / {progress.nextLevelXp} XP
        </p>
        <Progress value={progress.progressPercent} className="h-1.5" aria-label="Progresso até o próximo nível" />
      </div>
    </div>
  )
}
