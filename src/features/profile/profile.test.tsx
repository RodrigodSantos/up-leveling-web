import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ProgressResponse, UserResponse } from '@/lib/api/types'
import { loginAs, mockApi, renderApp, sentBody } from '@/test/render-app'

const me: UserResponse = { id: 1, name: 'Rodrigo', email: 'rodrigo@mail.com', createdAt: '2026-10-08T10:00:00' }
const demo: UserResponse = { ...me, name: 'Jogador Demo', email: 'demo@upleveling.local' }
const progress: ProgressResponse = {
  totalXp: 270,
  level: 2,
  currentLevelXp: 100,
  nextLevelXp: 300,
  progressPercent: 85,
}

function routes(user: UserResponse = me) {
  return [
    { method: 'GET', path: '/api/me', status: 200, body: user },
    { method: 'GET', path: '/api/me/progress', status: 200, body: progress },
  ]
}

/** Índice da chamada com aquele método (para ler o body enviado). */
function callIndex(api: ReturnType<typeof mockApi>, method: string) {
  return api.mock.calls.findIndex(([, init]) => init?.method === method)
}

function panel(name: string) {
  return screen.getByRole('region', { name })
}

beforeEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute('data-accent')
  loginAs()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Perfil', () => {
  it('mostra o nível, o XP que falta e desde quando a pessoa joga', async () => {
    mockApi(...routes())
    renderApp('/perfil')

    expect(await screen.findByText('Faltam 30 XP para o nível 3')).toBeInTheDocument()
    expect(screen.getByText('270 XP no total')).toBeInTheDocument()
    expect(screen.getByText('Jogador desde 8 de outubro de 2026')).toBeInTheDocument()
  })

  it('salva nome e e-mail e o cabeçalho muda na hora', async () => {
    const updated = { ...me, name: 'Rodrigo dos Santos' }
    const api = mockApi(...routes(), { method: 'PUT', path: '/api/me', status: 200, body: updated })
    renderApp('/perfil')

    const dados = await screen.findByRole('region', { name: 'Dados da conta' })
    const name = await within(dados).findByLabelText('Nome') // o formulário aparece quando o /api/me responde
    const save = within(dados).getByRole('button', { name: 'Salvar dados' })
    expect(name).toHaveValue('Rodrigo')
    expect(save).toBeDisabled() // nada mudou ainda

    await userEvent.clear(name)
    await userEvent.type(name, 'Rodrigo dos Santos')
    await userEvent.click(save)

    expect(await screen.findByText('Dados atualizados.')).toBeInTheDocument()
    expect(screen.getByText('Olá, Rodrigo dos Santos')).toBeInTheDocument()
    expect(sentBody(api, callIndex(api, 'PUT'))).toEqual({ name: 'Rodrigo dos Santos', email: 'rodrigo@mail.com' })
    expect(save).toBeDisabled() // salvo: volta a "sem mudanças"
  })

  it('e-mail de outra conta (409) aparece no campo e-mail', async () => {
    mockApi(...routes(), {
      method: 'PUT',
      path: '/api/me',
      status: 409,
      body: { title: 'Conflito', detail: "Já existe uma conta com o e-mail 'ana@mail.com'" },
    })
    renderApp('/perfil')

    const dados = await screen.findByRole('region', { name: 'Dados da conta' })
    const email = await within(dados).findByLabelText('E-mail')
    await userEvent.clear(email)
    await userEvent.type(email, 'ana@mail.com')
    await userEvent.click(within(dados).getByRole('button', { name: 'Salvar dados' }))

    expect(await within(dados).findByText("Já existe uma conta com o e-mail 'ana@mail.com'")).toBeInTheDocument()
    expect(email).toHaveAttribute('aria-invalid', 'true')
  })

  it('senha nova e confirmação diferentes são barradas no navegador', async () => {
    const api = mockApi(...routes())
    renderApp('/perfil')

    await screen.findByText('Faltam 30 XP para o nível 3')
    const senha = panel('Trocar senha')
    await userEvent.type(within(senha).getByLabelText('Senha atual'), 'senha-antiga-1')
    await userEvent.type(within(senha).getByLabelText('Senha nova'), 'senha-nova-123')
    await userEvent.type(within(senha).getByLabelText('Repita a senha nova'), 'senha-nova-124')
    await userEvent.click(within(senha).getByRole('button', { name: 'Alterar senha' }))

    expect(await within(senha).findByText('As senhas não são iguais')).toBeInTheDocument()
    expect(callIndex(api, 'PUT')).toBe(-1)
  })

  it('troca a senha sem mandar a confirmação e limpa os campos', async () => {
    const api = mockApi(...routes(), { method: 'PUT', path: '/api/me/password', status: 204 })
    renderApp('/perfil')

    await screen.findByText('Faltam 30 XP para o nível 3')
    const senha = panel('Trocar senha')
    await userEvent.type(within(senha).getByLabelText('Senha atual'), 'senha-antiga-1')
    await userEvent.type(within(senha).getByLabelText('Senha nova'), 'senha-nova-123')
    await userEvent.type(within(senha).getByLabelText('Repita a senha nova'), 'senha-nova-123')
    await userEvent.click(within(senha).getByRole('button', { name: 'Alterar senha' }))

    expect(await screen.findByText('Senha alterada. Use a nova no próximo login.')).toBeInTheDocument()
    expect(sentBody(api, callIndex(api, 'PUT'))).toEqual({
      currentPassword: 'senha-antiga-1',
      newPassword: 'senha-nova-123',
    })
    expect(within(senha).getByLabelText('Senha atual')).toHaveValue('')
  })

  it('senha atual errada (422) aparece no campo da senha atual, sem sair da conta', async () => {
    mockApi(...routes(), {
      method: 'PUT',
      path: '/api/me/password',
      status: 422,
      body: { title: 'Regra de negócio violada', detail: 'A senha atual está incorreta' },
    })
    renderApp('/perfil')

    await screen.findByText('Faltam 30 XP para o nível 3')
    const senha = panel('Trocar senha')
    await userEvent.type(within(senha).getByLabelText('Senha atual'), 'errada-123')
    await userEvent.type(within(senha).getByLabelText('Senha nova'), 'senha-nova-123')
    await userEvent.type(within(senha).getByLabelText('Repita a senha nova'), 'senha-nova-123')
    await userEvent.click(within(senha).getByRole('button', { name: 'Alterar senha' }))

    expect(await within(senha).findByText('A senha atual está incorreta')).toBeInTheDocument()
    expect(within(senha).getByLabelText('Senha atual')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('heading', { name: 'Perfil' })).toBeInTheDocument()
  })

  it('na conta demo, avisa e trava dados e senha', async () => {
    mockApi(...routes(demo))
    renderApp('/perfil')

    expect(await screen.findByText(/Esta é a conta de demonstração/)).toBeInTheDocument()
    const dados = panel('Dados da conta')
    expect(within(dados).getByLabelText('Nome')).toBeDisabled()
    expect(within(dados).getByLabelText('E-mail')).toBeDisabled()
    expect(within(panel('Trocar senha')).getByLabelText('Senha atual')).toBeDisabled()
    expect(within(panel('Trocar senha')).getByRole('button', { name: 'Alterar senha' })).toBeDisabled()
  })

  it('trocar a cor de destaque e o modo vale na hora e fica salvo no navegador', async () => {
    mockApi(...routes())
    renderApp('/perfil')

    const aparencia = await screen.findByRole('region', { name: 'Aparência' })
    expect(within(aparencia).getByRole('radio', { name: 'Azul' })).toHaveAttribute('aria-checked', 'true')

    await userEvent.click(within(aparencia).getByRole('radio', { name: 'Roxo' }))
    expect(document.documentElement.dataset.accent).toBe('purple')
    expect(localStorage.getItem('up-leveling.accent')).toBe('purple')
    expect(within(aparencia).getByRole('radio', { name: 'Roxo' })).toHaveAttribute('aria-checked', 'true')

    await userEvent.click(within(aparencia).getByRole('radio', { name: 'Claro' }))
    expect(localStorage.getItem('up-leveling.mode')).toBe('light')
    expect(document.documentElement).not.toHaveClass('dark')
  })
})
