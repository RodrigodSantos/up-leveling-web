import { screen } from '@testing-library/react'
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
    renderApp('/')

    expect(screen.getByRole('heading', { name: 'Missões diárias' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Hoje' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Hábitos' })).not.toHaveAttribute('aria-current')
    expect(await screen.findByText('Olá, Rodrigo')).toBeInTheDocument()
  })

  it('sem login, qualquer tela do app manda para o login', () => {
    renderApp('/historico')

    expect(screen.getByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Hoje' })).not.toBeInTheDocument()
  })

  it('logado, abrir /login leva direto para o app', () => {
    loginAs()
    renderApp('/login')

    expect(screen.getByRole('heading', { name: 'Missões diárias' })).toBeInTheDocument()
  })

  it('mostra a página de não encontrada para rotas desconhecidas', () => {
    renderApp('/nao-existe')

    expect(screen.getByRole('heading', { name: 'Página não encontrada' })).toBeInTheDocument()
  })
})
