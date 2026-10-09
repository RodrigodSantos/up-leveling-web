import { useQuery } from '@tanstack/react-query'
import { Info } from 'lucide-react'
import type { ReactNode } from 'react'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { fetchMe } from '@/features/auth/api'
import { fetchProgress, queryKeys } from '@/features/today/api'
import type { ProgressResponse, UserResponse } from '@/lib/api/types'
import { formatFullDate } from '@/lib/dates'
import { isDemoAccount, meKey } from './api'
import { AppearanceSettings } from './AppearanceSettings'
import { PasswordForm } from './PasswordForm'
import { ProfileDataForm } from './ProfileDataForm'

/** Tela de perfil: nível, dados da conta, troca de senha e aparência. */
export function ProfilePage() {
  // As duas consultas já estão no cache (o cabeçalho usa as mesmas chaves): a tela abre sem esperar
  const me = useQuery({ queryKey: meKey, queryFn: fetchMe })
  const progress = useQuery({ queryKey: queryKeys.progress, queryFn: fetchProgress })
  const demo = me.data ? isDemoAccount(me.data) : false

  return (
    <section className="space-y-6">
      <header>
        <p className="text-muted-foreground text-sm">Status do Jogador</p>
        <h1 className="text-2xl font-medium">Perfil</h1>
      </header>

      {me.isError && (
        <p role="alert" className="border-destructive/50 rounded-lg border p-4">
          Não foi possível carregar seus dados. {me.error.message}
        </p>
      )}

      {me.data && progress.data ? (
        <LevelSummary user={me.data} progress={progress.data} />
      ) : (
        <Skeleton className="h-28" aria-label="Carregando nível" />
      )}

      {demo && (
        <p className="bg-brand/10 border-brand/40 flex gap-2 rounded-lg border p-3 text-sm">
          <Info className="text-brand mt-0.5 size-4 shrink-0" aria-hidden />
          Esta é a conta de demonstração, usada por todos os visitantes: os dados e a senha não podem ser alterados.
          Crie a sua conta para personalizar tudo.
        </p>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Panel title="Dados da conta">
          {me.data ? <ProfileDataForm user={me.data} locked={demo} /> : <Skeleton className="h-40" />}
        </Panel>
        <Panel title="Trocar senha">
          <PasswordForm locked={demo} />
        </Panel>
      </div>

      <Panel title="Aparência" description="Salva neste navegador.">
        <AppearanceSettings />
      </Panel>
    </section>
  )
}

function LevelSummary({ user, progress }: { user: UserResponse; progress: ProgressResponse }) {
  const missing = progress.nextLevelXp - progress.totalXp

  return (
    <div className="system-panel bg-card flex flex-wrap items-center gap-4 rounded-lg p-4">
      <div className="border-brand flex size-16 shrink-0 flex-col items-center justify-center rounded-lg border leading-none">
        <span className="text-muted-foreground text-[10px]">NÍVEL</span>
        <span className="text-brand text-3xl font-medium">{progress.level}</span>
      </div>
      <div className="min-w-48 flex-1 space-y-2">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <p className="font-medium">{user.name}</p>
          <p className="text-muted-foreground text-xs">Jogador desde {formatFullDate(user.createdAt)}</p>
        </div>
        <Progress value={progress.progressPercent} className="h-2" aria-label="Progresso até o próximo nível" />
        <p className="text-muted-foreground flex flex-wrap justify-between gap-x-3 text-sm tabular-nums">
          <span>{progress.totalXp} XP no total</span>
          <span>
            Faltam {missing} XP para o nível {progress.level + 1}
          </span>
        </p>
      </div>
    </div>
  )
}

function Panel({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="bg-card space-y-4 rounded-lg border p-4" aria-label={title}>
      <div>
        <h2 className="font-medium">{title}</h2>
        {description && <p className="text-muted-foreground text-sm">{description}</p>}
      </div>
      {children}
    </section>
  )
}
