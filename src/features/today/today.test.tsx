import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CheckInResponse, ProgressResponse, TodayHabit, TodayResponse } from '@/lib/api/types'
import { loginAs, mockApi, renderApp } from '@/test/render-app'

const me = { id: 1, name: 'Rodrigo', email: 'rodrigo@mail.com', createdAt: '2026-10-08T10:00:00' }
const progress: ProgressResponse = {
  totalXp: 270,
  level: 2,
  currentLevelXp: 100,
  nextLevelXp: 300,
  progressPercent: 85,
}

const ler: TodayHabit = {
  id: 1,
  name: 'Ler 20 páginas',
  xpReward: 30,
  dailyTarget: 1,
  count: 0,
  completed: false,
  streak: 4,
}
const agua: TodayHabit = {
  id: 2,
  name: 'Beber água',
  xpReward: 5,
  dailyTarget: 8,
  count: 3,
  completed: false,
  streak: 2,
}

function today(habits: TodayHabit[], overrides: Partial<TodayResponse> = {}): TodayResponse {
  return {
    date: '2026-10-08',
    dayOfWeek: 'THURSDAY',
    habits,
    completedCount: habits.filter((h) => h.completed).length,
    totalCount: habits.length,
    xpEarnedToday: 15,
    progress,
    ...overrides,
  }
}

function checkInResponse(overrides: Partial<CheckInResponse> = {}): CheckInResponse {
  return {
    habitId: 1,
    date: '2026-10-08',
    xpChange: 30,
    bonusXp: 0,
    dayCount: 1,
    dailyTarget: 1,
    dayCompleted: true,
    streak: 5,
    leveledUp: false,
    progress: { ...progress, totalXp: 300 - 0, level: 3, currentLevelXp: 300, nextLevelXp: 600, progressPercent: 0 },
    ...overrides,
  }
}

beforeEach(() => {
  localStorage.clear()
  loginAs()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Missões diárias', () => {
  it('mostra o resumo do dia, os cards e o nível no cabeçalho', async () => {
    mockApi(
      { method: 'GET', path: '/api/me', status: 200, body: me },
      { method: 'GET', path: '/api/me/progress', status: 200, body: progress },
      { method: 'GET', path: '/api/today', status: 200, body: today([ler, agua]) },
    )
    renderApp('/')

    expect(await screen.findByText('Quinta-feira, 8 de outubro')).toBeInTheDocument()
    expect(screen.getByText('0 de 2')).toBeInTheDocument()
    expect(screen.getByText('4 dias')).toBeInTheDocument() // maior sequência
    expect(screen.getByText('3/8')).toBeInTheDocument() // meta parcial da água
    expect(screen.getByLabelText('Sequência de 4 dias')).toBeInTheDocument()
    expect(await screen.findByText('270 / 300 XP')).toBeInTheDocument()
  })

  it('check-in chama a API, avisa e atualiza a tela', async () => {
    let lerFeito = false
    const api = mockApi(
      { method: 'GET', path: '/api/me', status: 200, body: me },
      { method: 'GET', path: '/api/me/progress', status: 200, body: progress },
      {
        method: 'GET',
        path: '/api/today',
        status: 200,
        // Antes do check-in, "Ler" está pendente; depois, concluído
        body: () => today([lerFeito ? { ...ler, count: 1, completed: true, streak: 5 } : ler]),
      },
      {
        method: 'POST',
        path: '/api/habits/1/check-ins',
        status: 201,
        body: () => {
          lerFeito = true
          return checkInResponse({ progress: { ...progress, totalXp: 300 - 0 } })
        },
      },
    )
    renderApp('/')

    await userEvent.click(await screen.findByRole('button', { name: 'Fazer check-in: Ler 20 páginas' }))

    expect(await screen.findByText('[ SISTEMA ] Missão concluída: Ler 20 páginas. +30 XP')).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: 'Ler 20 páginas: concluída' })).toBeDisabled()
    expect(screen.getByText('1 de 1')).toBeInTheDocument()
    expect(
      api.mock.calls.some(([url, init]) => String(url).endsWith('/api/habits/1/check-ins') && init?.method === 'POST'),
    ).toBe(true)
  })

  it('a barra de XP muda na hora com o progresso da resposta do check-in', async () => {
    mockApi(
      { method: 'GET', path: '/api/me', status: 200, body: me },
      { method: 'GET', path: '/api/me/progress', status: 200, body: progress },
      { method: 'GET', path: '/api/today', status: 200, body: today([ler]) },
      {
        method: 'POST',
        path: '/api/habits/1/check-ins',
        status: 201,
        body: checkInResponse({ progress: { ...progress, totalXp: 290, progressPercent: 95 } }),
      },
    )
    renderApp('/')
    expect(await screen.findByText('270 / 300 XP')).toBeInTheDocument()

    await userEvent.click(await screen.findByRole('button', { name: 'Fazer check-in: Ler 20 páginas' }))

    expect(await screen.findByText('290 / 300 XP')).toBeInTheDocument()
  })

  it('subir de nível abre a janela do Sistema', async () => {
    mockApi(
      { method: 'GET', path: '/api/me', status: 200, body: me },
      { method: 'GET', path: '/api/me/progress', status: 200, body: progress },
      { method: 'GET', path: '/api/today', status: 200, body: today([ler]) },
      { method: 'POST', path: '/api/habits/1/check-ins', status: 201, body: checkInResponse({ leveledUp: true }) },
    )
    renderApp('/')

    await userEvent.click(await screen.findByRole('button', { name: 'Fazer check-in: Ler 20 páginas' }))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Você subiu para o nível 3!')).toBeInTheDocument()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Continuar' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('desfazer devolve o XP', async () => {
    mockApi(
      { method: 'GET', path: '/api/me', status: 200, body: me },
      { method: 'GET', path: '/api/me/progress', status: 200, body: progress },
      { method: 'GET', path: '/api/today', status: 200, body: today([agua]) },
      {
        method: 'DELETE',
        path: '/api/habits/2/check-ins',
        status: 200,
        body: checkInResponse({ habitId: 2, xpChange: -5, dayCount: 2, dailyTarget: 8, dayCompleted: false }),
      },
    )
    renderApp('/')

    await userEvent.click(await screen.findByRole('button', { name: 'Desfazer check-in: Beber água' }))

    expect(await screen.findByText('Check-in desfeito. -5 XP')).toBeInTheDocument()
  })

  it('erro da API no check-in aparece como aviso', async () => {
    mockApi(
      { method: 'GET', path: '/api/me', status: 200, body: me },
      { method: 'GET', path: '/api/me/progress', status: 200, body: progress },
      { method: 'GET', path: '/api/today', status: 200, body: today([ler]) },
      {
        method: 'POST',
        path: '/api/habits/1/check-ins',
        status: 422,
        body: { title: 'Regra de negócio violada', detail: 'Meta do dia já atingida (1/1)' },
      },
    )
    renderApp('/')

    await userEvent.click(await screen.findByRole('button', { name: 'Fazer check-in: Ler 20 páginas' }))

    expect(await screen.findByText('Meta do dia já atingida (1/1)')).toBeInTheDocument()
  })

  it('sem missões no dia, convida a criar hábitos', async () => {
    mockApi(
      { method: 'GET', path: '/api/me', status: 200, body: me },
      { method: 'GET', path: '/api/me/progress', status: 200, body: progress },
      { method: 'GET', path: '/api/today', status: 200, body: today([]) },
    )
    renderApp('/')

    expect(await screen.findByText('Nenhuma missão para este dia')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ir para Hábitos' })).toHaveAttribute('href', '/habitos')
  })

  it('"Ver ontem" busca o dia anterior e põe ?dia=ontem na URL', async () => {
    const api = mockApi(
      { method: 'GET', path: '/api/me', status: 200, body: me },
      { method: 'GET', path: '/api/me/progress', status: 200, body: progress },
      { method: 'GET', path: '/api/today', status: 200, body: today([ler]) },
    )
    const { router } = renderApp('/')

    await userEvent.click(await screen.findByRole('button', { name: 'Ver ontem' }))

    expect(await screen.findByRole('button', { name: 'Voltar para hoje' })).toBeInTheDocument()
    expect(router.state.location.search).toBe('?dia=ontem')
    expect(api.mock.calls.some(([url]) => String(url).includes('/api/today?date='))).toBe(true)
  })
})
