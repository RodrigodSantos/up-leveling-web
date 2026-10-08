import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import { routes } from './router'

// createMemoryRouter: um roteador sem barra de endereço, para o teste escolher a URL inicial
function renderAt(path: string) {
  render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: [path] })} />)
}

describe('rotas', () => {
  it('abre a tela Hoje com o menu, e o item Hoje marcado', () => {
    renderAt('/')

    expect(screen.getByRole('heading', { name: 'Seus hábitos de hoje' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Hoje' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Hábitos' })).not.toHaveAttribute('aria-current')
  })

  it('login fica fora do layout (sem menu)', () => {
    renderAt('/login')

    expect(screen.getByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Hoje' })).not.toBeInTheDocument()
  })

  it('mostra a página de não encontrada para rotas desconhecidas', () => {
    renderAt('/nao-existe')

    expect(screen.getByRole('heading', { name: 'Página não encontrada' })).toBeInTheDocument()
  })
})
