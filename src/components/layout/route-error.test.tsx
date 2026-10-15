import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { RouteError } from './RouteError'

/** Uma rota que falha ao "baixar" a tela, como acontece depois de um deploy (o arquivo antigo não existe mais). */
function renderFailingRoute(error: Error) {
  const router = createMemoryRouter(
    [{ path: '/', ErrorBoundary: RouteError, HydrateFallback: () => null, lazy: () => Promise.reject(error) }],
    { initialEntries: ['/'] },
  )
  render(<RouterProvider router={router} />)
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('tela de erro das rotas', () => {
  it('falha ao baixar a tela pede para recarregar', async () => {
    const reload = vi.fn()
    vi.stubGlobal('location', { ...window.location, reload })
    renderFailingRoute(new TypeError('Failed to fetch dynamically imported module: /assets/HabitsPage-abc123.js'))

    expect(await screen.findByRole('heading', { name: 'O app foi atualizado' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Voltar para o início' })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Recarregar' }))
    expect(reload).toHaveBeenCalledOnce()
  })

  it('outro erro mostra a mensagem genérica e o caminho de volta', async () => {
    renderFailingRoute(new Error('Cannot read properties of undefined'))

    expect(await screen.findByRole('heading', { name: 'Algo deu errado' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voltar para o início' })).toHaveAttribute('href', '/')
  })
})
