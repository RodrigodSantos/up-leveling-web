import { QueryClient } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { vi } from 'vitest'
import { AppProviders } from '@/app/AppProviders'
import { routes } from '@/app/router'
import { saveSession } from '@/lib/auth/token-storage'

/** Monta o app inteiro (providers + rotas) já numa URL, como se a pessoa tivesse aberto aquele endereço. */
export function renderApp(path: string) {
  // Cache novo por teste e sem repetir requisições que falham (os testes ficam rápidos e independentes)
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(
    <AppProviders queryClient={queryClient}>
      <RouterProvider router={router} />
    </AppProviders>,
  )
  return { router }
}

/** Simula alguém logado (token válido por 1 hora). */
export function loginAs(token = 'token-valido') {
  saveSession({ token, expiresAt: new Date(Date.now() + 3_600_000).toISOString() })
}

interface FakeRoute {
  method: string
  path: string
  status: number
  /** Valor fixo, ou uma função chamada a cada requisição (para a resposta mudar entre chamadas) */
  body?: unknown
}

/**
 * API falsa: cada requisição é atendida pela rota com o mesmo método e caminho.
 * Devolve o mock para o teste conferir o que foi enviado.
 */
export function mockApi(...fakeRoutes: FakeRoute[]) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(input.toString())
    const method = init?.method ?? 'GET'
    const route = fakeRoutes.find((r) => r.method === method && r.path === url.pathname)
    if (!route) {
      return new Response(JSON.stringify({ title: 'Não simulado', detail: `${method} ${url.pathname}` }), {
        status: 404,
        headers: { 'Content-Type': 'application/problem+json' },
      })
    }
    const isError = route.status >= 400
    const body = typeof route.body === 'function' ? (route.body as () => unknown)() : route.body
    return new Response(body === undefined ? null : JSON.stringify(body), {
      status: route.status,
      headers: { 'Content-Type': isError ? 'application/problem+json' : 'application/json' },
    })
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

/** Lê o body JSON da n-ésima chamada à API. */
export function sentBody(fetchMock: ReturnType<typeof mockApi>, call = 0): unknown {
  return JSON.parse(String(fetchMock.mock.calls[call][1]?.body))
}
