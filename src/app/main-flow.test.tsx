import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type {
  CheckInResponse,
  DailyCheckIns,
  HabitRequest,
  HabitResponse,
  ProgressResponse,
  TodayResponse,
  UserResponse,
} from '@/lib/api/types'
import { renderApp } from '@/test/render-app'

/**
 * API falsa com estado: diferente do mockApi (uma resposta fixa por rota), ela guarda a conta, os hábitos
 * e os check-ins criados durante o teste, como o backend de verdade. Assim dá para seguir a pessoa de uma
 * tela para a outra e conferir que o que ela fez numa aparece na seguinte.
 * Regras simplificadas: 100 XP por nível, todo hábito vale todos os dias e não há bônus de sequência.
 */
function fakeBackend() {
  const today = new Date().toLocaleDateString('sv-SE')
  let user: UserResponse | null = null
  const habits: HabitResponse[] = []
  const checkIns: { habitId: number; date: string; xp: number }[] = []

  const totalXp = () => checkIns.reduce((sum, c) => sum + c.xp, 0)
  const progress = (): ProgressResponse => {
    const xp = totalXp()
    const level = Math.floor(xp / 100) + 1
    return {
      totalXp: xp,
      level,
      currentLevelXp: (level - 1) * 100,
      nextLevelXp: level * 100,
      progressPercent: xp % 100,
    }
  }
  const countToday = (habitId: number) => checkIns.filter((c) => c.habitId === habitId && c.date === today).length

  const handlers: Record<string, (url: URL, body: unknown) => [number, unknown]> = {
    'POST /api/auth/register': (_, body) => {
      const { name, email } = body as { name: string; email: string }
      user = { id: 1, name, email, createdAt: `${today}T08:00:00` }
      return [201, user]
    },
    'POST /api/auth/login': () => [200, { token: 'token-novo', type: 'Bearer', expiresAt: '2099-01-01T00:00:00Z' }],
    'GET /api/me': () => [200, user],
    'GET /api/me/progress': () => [200, progress()],
    'GET /api/habits': () => [200, habits],
    'POST /api/habits': (_, body) => {
      const habit: HabitResponse = {
        id: habits.length + 1,
        ...(body as HabitRequest),
        status: 'ACTIVE',
        createdAt: `${today}T08:00:00`,
      }
      habits.push(habit)
      return [201, habit]
    },
    'GET /api/today': () => {
      const list = habits.map((h) => {
        const count = countToday(h.id)
        return { ...h, count, completed: count >= h.dailyTarget, streak: count > 0 ? 1 : 0 }
      })
      const response: TodayResponse = {
        date: today,
        dayOfWeek: 'WEDNESDAY',
        habits: list,
        completedCount: list.filter((h) => h.completed).length,
        totalCount: list.length,
        xpEarnedToday: checkIns.filter((c) => c.date === today).reduce((sum, c) => sum + c.xp, 0),
        progress: progress(),
      }
      return [200, response]
    },
    'POST /api/habits/1/check-ins': () => {
      const habit = habits[0]
      const before = progress().level
      checkIns.push({ habitId: habit.id, date: today, xp: habit.xpReward })
      const dayCount = countToday(habit.id)
      const response: CheckInResponse = {
        habitId: habit.id,
        date: today,
        xpChange: habit.xpReward,
        bonusXp: 0,
        dayCount,
        dailyTarget: habit.dailyTarget,
        dayCompleted: dayCount >= habit.dailyTarget,
        streak: 1,
        leveledUp: progress().level > before,
        progress: progress(),
      }
      return [201, response]
    },
    'GET /api/me/xp-history': () => [200, [{ date: today, xp: totalXp() }]],
    'GET /api/check-ins/daily': () => {
      const day: DailyCheckIns = {
        date: today,
        xp: totalXp(),
        habits: habits
          .filter((h) => countToday(h.id) > 0)
          .map((h) => ({
            habitId: h.id,
            habitName: h.name,
            count: countToday(h.id),
            xp: countToday(h.id) * h.xpReward,
            bonusXp: 0,
          })),
      }
      const content = day.habits.length > 0 ? [day] : []
      return [200, { content, page: { size: 7, number: 0, totalElements: content.length, totalPages: 1 } }]
    },
  }

  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(input.toString())
    const method = init?.method ?? 'GET'
    const handler = handlers[`${method} ${url.pathname}`]
    if (!handler) {
      const problem = { title: 'Não simulado', detail: `${method} ${url.pathname}` }
      return new Response(JSON.stringify(problem), {
        status: 404,
        headers: { 'Content-Type': 'application/problem+json' },
      })
    }
    const [status, body] = handler(url, init?.body ? JSON.parse(String(init.body)) : undefined)
    return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
  })
  vi.stubGlobal('fetch', fetchMock)
}

/**
 * Clica num item do menu principal (o mesmo <nav> no celular e no desktop) e espera o título da tela nova.
 * Limite de 10 s (como no renderApp): cada tela é baixada sob demanda, e a primeira vez num teste passa do 1 s
 * padrão; o Histórico, que traz o Recharts, é o mais lento.
 */
async function goTo(label: string, heading: string) {
  const menu = screen.getByRole('navigation', { name: 'Menu principal' })
  await userEvent.click(within(menu).getByRole('link', { name: label }))
  await screen.findByRole('heading', { level: 1, name: heading }, { timeout: 10_000 })
}

beforeEach(() => {
  localStorage.clear()
  fakeBackend()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('fluxo principal', () => {
  it('cria a conta, cria um hábito, faz o check-in e vê o XP no cabeçalho e no histórico', async () => {
    // 1. Cadastro: entra sozinho e cai nas missões do dia, ainda vazias
    await renderApp('/cadastro')
    await userEvent.type(screen.getByLabelText('Nome'), 'Rodrigo')
    await userEvent.type(screen.getByLabelText('E-mail'), 'rodrigo@mail.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'senha-forte-123')
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(await screen.findByText('Nenhuma missão para este dia')).toBeInTheDocument()
    expect(await screen.findByText('Olá, Rodrigo')).toBeInTheDocument()
    expect(screen.getByText('0 / 100 XP')).toBeInTheDocument()

    // 2. Hábitos: cria um hábito que vale todos os dias (nenhum dia marcado)
    await goTo('Hábitos', 'Hábitos')
    // Com a lista vazia há dois "Criar hábito" (o do cabeçalho e o do convite): usa o do cabeçalho
    await userEvent.click((await screen.findAllByRole('button', { name: 'Criar hábito' }))[0])
    const dialog = await screen.findByRole('dialog')
    await userEvent.type(within(dialog).getByLabelText('Nome'), 'Ler 20 páginas')
    await userEvent.clear(within(dialog).getByLabelText('XP por check-in'))
    await userEvent.type(within(dialog).getByLabelText('XP por check-in'), '30')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Criar hábito' }))

    expect(await screen.findByText('Hábito criado: Ler 20 páginas')).toBeInTheDocument()
    expect(await screen.findByText('Todos os dias')).toBeInTheDocument()

    // 3. Hoje: o hábito novo virou missão; o check-in conclui e o XP sobe no cabeçalho
    await goTo('Hoje', 'Missões diárias')
    await userEvent.click(await screen.findByRole('button', { name: 'Fazer check-in: Ler 20 páginas' }))

    expect(await screen.findByRole('button', { name: 'Ler 20 páginas: concluída' })).toBeDisabled()
    expect(await screen.findByText('1 de 1')).toBeInTheDocument()
    expect(screen.getByText('30 / 100 XP')).toBeInTheDocument()

    // 4. Histórico: o check-in aparece no dia de hoje
    await goTo('Histórico', 'Histórico')
    expect(await screen.findByText('+30 XP no dia')).toBeInTheDocument()
    expect(screen.getByText('Ler 20 páginas')).toBeInTheDocument()
  }, 30_000) // a jornada passa por 4 telas: bem mais que os 5 s padrão de um teste
})
