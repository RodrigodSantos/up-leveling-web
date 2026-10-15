import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { loginAs, mockApi, renderApp } from '@/test/render-app'

const me = { id: 1, name: 'Rodrigo', email: 'rodrigo@mail.com', createdAt: '2026-10-08T10:00:00' }

beforeEach(() => {
  localStorage.clear()
  mockApi({ method: 'GET', path: '/api/me', status: 200, body: me })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('rotas', () => {
  it('logado, abre a tela Hoje com o menu e o item Hoje marcado', async () => {
    loginAs()
    await renderApp('/')

    expect(screen.getByRole('heading', { name: 'Missões diárias' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Hoje' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Hábitos' })).not.toHaveAttribute('aria-current')
    expect(await screen.findByText('Olá, Rodrigo')).toBeInTheDocument()
  })

  it('sem login, qualquer tela do app manda para o login', async () => {
    await renderApp('/habitos')

    expect(screen.getByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Hoje' })).not.toBeInTheDocument()
  })

  it('logado, abrir /login leva direto para o app', async () => {
    loginAs()
    await renderApp('/login')

    expect(screen.getByRole('heading', { name: 'Missões diárias' })).toBeInTheDocument()
  })

  it('cada tela tem o próprio título na aba e, ao trocar de tela, o foco vai para o título dela', async () => {
    loginAs()
    await renderApp('/')
    expect(document.title).toBe('Missões diárias · Up Leveling')

    await userEvent.click(screen.getByRole('link', { name: 'Hábitos' }))

    const heading = await screen.findByRole('heading', { level: 1, name: 'Hábitos' })
    await waitFor(() => expect(heading).toHaveFocus())
    expect(document.title).toBe('Hábitos · Up Leveling')
  })

  it('o primeiro Tab cai no link que pula o menu e vai direto para o conteúdo', async () => {
    loginAs()
    await renderApp('/')

    await userEvent.tab()

    const skip = screen.getByRole('link', { name: 'Pular para o conteúdo' })
    expect(skip).toHaveFocus()
    expect(skip).toHaveAttribute('href', '#conteudo')
    expect(document.getElementById('conteudo')).toBe(screen.getByRole('main'))
  })

  it('mostra a página de não encontrada para rotas desconhecidas', async () => {
    await renderApp('/nao-existe')

    expect(screen.getByRole('heading', { name: 'Página não encontrada' })).toBeInTheDocument()
  })
})
