import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { DailyCheckIns, DailyXp, HabitResponse, PageResponse, ProgressResponse } from '@/lib/api/types'
import { loginAs, mockApi, renderApp } from '@/test/render-app'
import { daysAgo } from './api'
import { summarize } from './summary'

const me = { id: 1, name: 'Rodrigo', email: 'rodrigo@mail.com', createdAt: '2026-10-08T10:00:00' }
const progress: ProgressResponse = {
  totalXp: 270,
  level: 2,
  currentLevelXp: 100,
  nextLevelXp: 300,
  progressPercent: 85,
}
const ler: HabitResponse = {
  id: 1,
  name: 'Ler 20 páginas',
  xpReward: 30,
  dailyTarget: 1,
  status: 'ACTIVE',
  days: [],
  createdAt: '2026-10-01T10:00:00',
}
const agua: HabitResponse = { ...ler, id: 2, name: 'Beber água', xpReward: 5, dailyTarget: 8 }

/** 30 dias de XP: 0 em todos, menos três dias com valores conhecidos (total 120, melhor dia 60). */
function xpDays(): DailyXp[] {
  return Array.from({ length: 30 }, (_, i) => {
    const date = daysAgo(29 - i)
    const xp = i === 5 ? 20 : i === 10 ? 60 : i === 29 ? 40 : 0
    return { date, xp }
  })
}

function page(content: DailyCheckIns[], number = 0, totalPages = 1): PageResponse<DailyCheckIns> {
  return { content, page: { size: 7, number, totalElements: content.length, totalPages } }
}

// Como a API manda: dia 8 com 3 copos de água somados + leitura com bônus; dia 7 só a leitura
const checkIns: DailyCheckIns[] = [
  {
    date: '2026-10-08',
    xp: 15 + 30 + 5,
    habits: [
      { habitId: 2, habitName: 'Beber água', count: 3, xp: 15, bonusXp: 0 },
      { habitId: 1, habitName: 'Ler 20 páginas', count: 1, xp: 30, bonusXp: 5 },
    ],
  },
  { date: '2026-10-07', xp: 30, habits: [{ habitId: 1, habitName: 'Ler 20 páginas', count: 1, xp: 30, bonusXp: 0 }] },
]

function routes(history: PageResponse<DailyCheckIns> = page(checkIns)) {
  return [
    { method: 'GET', path: '/api/me', status: 200, body: me },
    { method: 'GET', path: '/api/me/progress', status: 200, body: progress },
    { method: 'GET', path: '/api/habits', status: 200, body: [agua, ler] },
    { method: 'GET', path: '/api/me/xp-history', status: 200, body: xpDays() },
    { method: 'GET', path: '/api/check-ins/daily', status: 200, body: history },
  ]
}

/** URLs chamadas para aquele caminho (com a query), na ordem. */
function urlsFor(api: ReturnType<typeof mockApi>, path: string): URL[] {
  return api.mock.calls.map(([url]) => new URL(String(url))).filter((url) => url.pathname === path)
}

// A rota /historico é carregada sob demanda (lazy). Importar a tela antes deixa o módulo pronto,
// para o primeiro teste não gastar o tempo de espera do findBy carregando o Recharts.
beforeAll(async () => {
  await import('./HistoryPage')
})

beforeEach(() => {
  localStorage.clear()
  loginAs()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('summarize', () => {
  it('soma o período, tira a média e acha o melhor dia', () => {
    expect(summarize(xpDays())).toEqual({ total: 120, average: 4, best: { date: daysAgo(19), xp: 60 } })
  })

  it('período sem XP não tem melhor dia', () => {
    expect(summarize([{ date: '2026-10-08', xp: 0 }])).toEqual({ total: 0, average: 0, best: null })
  })
})

describe('Histórico', () => {
  it('mostra o resumo dos últimos 30 dias e pede o período certo à API', async () => {
    const api = mockApi(...routes())
    renderApp('/historico')

    expect(await screen.findByText('+120')).toBeInTheDocument() // XP no período
    expect(screen.getByText('4 XP')).toBeInTheDocument() // média
    expect(screen.getByText('+60')).toBeInTheDocument() // melhor dia
    expect(screen.getByRole('radio', { name: '30 dias' })).toHaveAttribute('aria-checked', 'true')

    const [url] = urlsFor(api, '/api/me/xp-history')
    expect(url.searchParams.get('from')).toBe(daysAgo(29))
    expect(url.searchParams.get('to')).toBe(daysAgo(0))
  })

  it('trocar o período vai para a URL e busca de novo', async () => {
    const api = mockApi(...routes())
    const { router } = renderApp('/historico')

    await userEvent.click(await screen.findByRole('radio', { name: '7 dias' }))

    expect(router.state.location.search).toBe('?periodo=7')
    await vi.waitFor(() =>
      expect(urlsFor(api, '/api/me/xp-history').some((url) => url.searchParams.get('from') === daysAgo(6))).toBe(true),
    )
  })

  it('lista cada dia com o total e o mesmo hábito numa linha só, com a quantidade', async () => {
    mockApi(...routes())
    renderApp('/historico')

    const quinta = await screen.findByRole('region', { name: 'Quinta-feira, 8 de outubro' })
    expect(within(quinta).getByText('+50 XP no dia')).toBeInTheDocument()
    const [agua, leitura] = within(quinta).getAllByRole('listitem')
    expect(agua).toHaveTextContent('Beber água×33 check-ins+15 XP') // 3 copos de +5
    expect(leitura).toHaveTextContent('Ler 20 páginas+30 XP+5 bônus')
    expect(within(leitura).queryByText(/check-ins/)).not.toBeInTheDocument() // 1 só: sem quantidade
    const quarta = screen.getByRole('region', { name: 'Quarta-feira, 7 de outubro' })
    expect(within(quarta).getByText('Ler 20 páginas')).toBeInTheDocument()
    expect(within(quarta).queryByText(/bônus/)).not.toBeInTheDocument()
    // Uma página só: sem paginação
    expect(screen.queryByRole('navigation', { name: 'Paginação' })).not.toBeInTheDocument()
  })

  it('paginação: "Próxima" põe ?pagina=2 na URL e pede a página 1 (base 0) à API', async () => {
    const api = mockApi(...routes(page(checkIns, 0, 3)))
    const { router } = renderApp('/historico')

    const pagination = await screen.findByRole('navigation', { name: 'Paginação' })
    expect(within(pagination).getByText('Página 1 de 3')).toBeInTheDocument()
    expect(within(pagination).getByRole('button', { name: 'Anterior' })).toBeDisabled()

    await userEvent.click(within(pagination).getByRole('button', { name: 'Próxima' }))

    expect(router.state.location.search).toBe('?pagina=2')
    expect(await within(pagination).findByText('Página 2 de 3')).toBeInTheDocument()
    const last = urlsFor(api, '/api/check-ins/daily').at(-1)
    expect(last?.searchParams.get('page')).toBe('1')
    expect(last?.searchParams.get('size')).toBe('7')
  })

  it('filtrar por hábito manda o habitId e volta para a página 1', async () => {
    const api = mockApi(...routes(page(checkIns, 1, 3)))
    const { router } = renderApp('/historico?pagina=2&periodo=7')

    await userEvent.click(await screen.findByRole('combobox', { name: 'Filtrar por hábito' }))
    await userEvent.click(await screen.findByRole('option', { name: 'Beber água' }))

    expect(router.state.location.search).toBe('?periodo=7&habito=2')
    await vi.waitFor(() =>
      expect(urlsFor(api, '/api/check-ins/daily').some((url) => url.searchParams.get('habitId') === '2')).toBe(true),
    )
    const last = urlsFor(api, '/api/check-ins/daily').at(-1)
    expect(last?.searchParams.get('page')).toBe('0')
  })

  it('valores inválidos na URL viram o padrão', async () => {
    const api = mockApi(...routes())
    renderApp('/historico?periodo=15&pagina=abc&habito=x')

    expect(await screen.findByRole('radio', { name: '30 dias' })).toHaveAttribute('aria-checked', 'true')
    await vi.waitFor(() => expect(urlsFor(api, '/api/check-ins/daily')).toHaveLength(1))
    const [url] = urlsFor(api, '/api/check-ins/daily')
    expect(url.searchParams.get('page')).toBe('0')
    expect(url.searchParams.has('habitId')).toBe(false)
  })

  it('sem check-ins, explica de onde eles vêm', async () => {
    mockApi(...routes(page([], 0, 0)))
    renderApp('/historico')

    expect(await screen.findByText('Nenhum check-in ainda')).toBeInTheDocument()
  })

  it('página que não existe oferece voltar para a primeira', async () => {
    mockApi(...routes(page([], 9, 3)))
    const { router } = renderApp('/historico?pagina=10')

    await userEvent.click(await screen.findByRole('button', { name: 'Ir para a primeira página' }))

    expect(router.state.location.search).toBe('')
  })
})
