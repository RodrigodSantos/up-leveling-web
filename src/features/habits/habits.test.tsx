import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { HabitResponse, ProgressResponse } from '@/lib/api/types'
import { loginAs, mockApi, renderApp, sentBody } from '@/test/render-app'

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
  createdAt: '2026-10-08T10:00:00',
}
const agua: HabitResponse = {
  id: 2,
  name: 'Beber água',
  xpReward: 5,
  dailyTarget: 8,
  status: 'ACTIVE',
  days: ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
  createdAt: '2026-10-08T10:00:00',
}
const academia: HabitResponse = {
  id: 3,
  name: 'Academia',
  xpReward: 50,
  dailyTarget: 1,
  status: 'PAUSED',
  days: ['TUESDAY', 'THURSDAY'],
  createdAt: '2026-10-08T10:00:00',
}

/** Rotas que toda tela logada chama (cabeçalho) + a lista de hábitos. */
const baseRoutes = (habits: HabitResponse[] | (() => HabitResponse[])) => [
  { method: 'GET', path: '/api/me', status: 200, body: me },
  { method: 'GET', path: '/api/me/progress', status: 200, body: progress },
  { method: 'GET', path: '/api/habits', status: 200, body: habits },
]

/** Quantas vezes a API recebeu aquele método + caminho (a query, como ?status=, é ignorada). */
function callsTo(api: ReturnType<typeof mockApi>, method: string, path: string) {
  return api.mock.calls.filter(
    ([url, init]) => new URL(String(url)).pathname === path && (init?.method ?? 'GET') === method,
  ).length
}

async function openActions(habitName: string) {
  await userEvent.click(await screen.findByRole('button', { name: `Ações: ${habitName}` }))
}

beforeEach(() => {
  localStorage.clear()
  loginAs()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Hábitos', () => {
  it('lista os hábitos com XP, meta, dias e a etiqueta de pausado', async () => {
    mockApi(...baseRoutes([academia, agua, ler]))
    renderApp('/habitos')

    const list = await screen.findByRole('list', { name: 'Hábitos' })
    const rows = within(list).getAllByRole('listitem')
    expect(rows).toHaveLength(3)

    const aguaRow = rows[1]
    expect(within(aguaRow).getByText('+5 XP')).toBeInTheDocument()
    expect(within(aguaRow).getByText('8x por dia')).toBeInTheDocument()
    expect(within(aguaRow).getByText('Seg · Qua · Sex')).toBeInTheDocument()

    expect(within(rows[2]).getByText('Todos os dias')).toBeInTheDocument()
    expect(within(rows[2]).queryByText(/x por dia/)).not.toBeInTheDocument() // meta 1 não aparece
    expect(within(rows[0]).getByText('Pausado')).toBeInTheDocument()
    expect(within(rows[1]).queryByText('Pausado')).not.toBeInTheDocument()
  })

  it('cria um hábito com os dias escolhidos e atualiza a lista', async () => {
    let created = false
    const novo: HabitResponse = {
      ...agua,
      id: 4,
      name: 'Meditar',
      xpReward: 20,
      dailyTarget: 2,
      days: ['MONDAY', 'FRIDAY'],
    }
    const api = mockApi(...baseRoutes(() => (created ? [novo] : [])), {
      method: 'POST',
      path: '/api/habits',
      status: 201,
      body: () => {
        created = true
        return novo
      },
    })
    renderApp('/habitos')

    await userEvent.click(await screen.findByRole('button', { name: 'Criar hábito' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.type(within(dialog).getByLabelText('Nome'), 'Meditar')
    await userEvent.clear(within(dialog).getByLabelText('XP por check-in'))
    await userEvent.type(within(dialog).getByLabelText('XP por check-in'), '20')
    await userEvent.clear(within(dialog).getByLabelText('Meta por dia'))
    await userEvent.type(within(dialog).getByLabelText('Meta por dia'), '2')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Segunda' }))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Sexta' }))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Criar hábito' }))

    expect(await screen.findByText('Hábito criado: Meditar')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(await screen.findByText('Seg · Sex')).toBeInTheDocument() // a lista foi buscada de novo

    const postIndex = api.mock.calls.findIndex(([, init]) => init?.method === 'POST')
    expect(sentBody(api, postIndex)).toEqual({
      name: 'Meditar',
      xpReward: 20,
      dailyTarget: 2,
      days: ['MONDAY', 'FRIDAY'],
    })
  })

  it('valida no navegador antes de enviar', async () => {
    const api = mockApi(...baseRoutes([ler]))
    renderApp('/habitos')

    await userEvent.click(await screen.findByRole('button', { name: 'Criar hábito' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.clear(within(dialog).getByLabelText('XP por check-in'))
    await userEvent.type(within(dialog).getByLabelText('XP por check-in'), '150')
    await userEvent.clear(within(dialog).getByLabelText('Meta por dia'))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Criar hábito' }))

    expect(await within(dialog).findByText('Informe o nome do hábito')).toBeInTheDocument()
    expect(within(dialog).getByText('Use um valor entre 1 e 100')).toBeInTheDocument()
    expect(within(dialog).getByText('Informe a meta diária')).toBeInTheDocument()
    expect(callsTo(api, 'POST', '/api/habits')).toBe(0)
  })

  it('nome repetido (409) aparece no campo nome', async () => {
    mockApi(...baseRoutes([ler]), {
      method: 'POST',
      path: '/api/habits',
      status: 409,
      body: { title: 'Conflito', detail: "Você já tem um hábito chamado 'Ler 20 páginas'" },
    })
    renderApp('/habitos')

    await userEvent.click(await screen.findByRole('button', { name: 'Criar hábito' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.type(within(dialog).getByLabelText('Nome'), 'Ler 20 páginas')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Criar hábito' }))

    expect(await within(dialog).findByText("Você já tem um hábito chamado 'Ler 20 páginas'")).toBeInTheDocument()
    expect(within(dialog).getByLabelText('Nome')).toHaveAttribute('aria-invalid', 'true')
  })

  it('editar abre o formulário preenchido e envia um PUT', async () => {
    const api = mockApi(...baseRoutes([agua]), {
      method: 'PUT',
      path: '/api/habits/2',
      status: 200,
      body: { ...agua, xpReward: 10 },
    })
    renderApp('/habitos')

    await openActions('Beber água')
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Editar' }))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Editar hábito')).toBeInTheDocument()
    expect(within(dialog).getByLabelText('Nome')).toHaveValue('Beber água')
    expect(within(dialog).getByLabelText('Meta por dia')).toHaveValue(8)
    expect(within(dialog).getByRole('button', { name: 'Quarta' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(dialog).getByRole('button', { name: 'Terça' })).toHaveAttribute('aria-pressed', 'false')

    await userEvent.clear(within(dialog).getByLabelText('XP por check-in'))
    await userEvent.type(within(dialog).getByLabelText('XP por check-in'), '10')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText('Hábito atualizado: Beber água')).toBeInTheDocument()
    const putIndex = api.mock.calls.findIndex(([, init]) => init?.method === 'PUT')
    expect(sentBody(api, putIndex)).toEqual({
      name: 'Beber água',
      xpReward: 10,
      dailyTarget: 8,
      days: ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
    })
  })

  it('pausar envia o novo status e avisa que sai das missões', async () => {
    const api = mockApi(...baseRoutes([ler]), {
      method: 'PATCH',
      path: '/api/habits/1/status',
      status: 200,
      body: { ...ler, status: 'PAUSED' },
    })
    renderApp('/habitos')

    await openActions('Ler 20 páginas')
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Pausar' }))

    expect(
      await screen.findByText('Ler 20 páginas pausado. Ele sai das missões do dia até ser reativado.'),
    ).toBeInTheDocument()
    const patchIndex = api.mock.calls.findIndex(([, init]) => init?.method === 'PATCH')
    expect(sentBody(api, patchIndex)).toEqual({ status: 'PAUSED' })
  })

  it('pausado mostra "Reativar" no menu', async () => {
    mockApi(...baseRoutes([academia]))
    renderApp('/habitos')

    await openActions('Academia')

    expect(await screen.findByRole('menuitem', { name: 'Reativar' })).toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: 'Pausar' })).not.toBeInTheDocument()
  })

  it('excluir pede confirmação: cancelar não exclui, confirmar exclui', async () => {
    const api = mockApi(...baseRoutes([ler]), { method: 'DELETE', path: '/api/habits/1', status: 204 })
    renderApp('/habitos')

    await openActions('Ler 20 páginas')
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Excluir' }))
    let confirm = await screen.findByRole('alertdialog')
    expect(within(confirm).getByText('Excluir “Ler 20 páginas”?')).toBeInTheDocument()
    expect(within(confirm).getByText(/o XP já ganho continuam/)).toBeInTheDocument()
    await userEvent.click(within(confirm).getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(callsTo(api, 'DELETE', '/api/habits/1')).toBe(0)

    await openActions('Ler 20 páginas')
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Excluir' }))
    confirm = await screen.findByRole('alertdialog')
    await userEvent.click(within(confirm).getByRole('button', { name: 'Excluir' }))

    expect(await screen.findByText('Hábito excluído: Ler 20 páginas')).toBeInTheDocument()
    expect(callsTo(api, 'DELETE', '/api/habits/1')).toBe(1)
  })

  it('o filtro vai para a URL e para a chamada da API', async () => {
    const api = mockApi(...baseRoutes([]))
    const { router } = renderApp('/habitos')

    await userEvent.click(await screen.findByRole('radio', { name: 'Pausados' }))

    expect(await screen.findByText('Nenhum hábito pausado')).toBeInTheDocument()
    expect(router.state.location.search).toBe('?status=pausados')
    expect(api.mock.calls.some(([url]) => String(url).endsWith('/api/habits?status=PAUSED'))).toBe(true)
  })

  it('sem hábitos, convida a criar o primeiro', async () => {
    mockApi(...baseRoutes([]))
    renderApp('/habitos')

    expect(await screen.findByText('Você ainda não tem hábitos')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Criar hábito' })).toHaveLength(2)
  })
})
