import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { saveSession } from '@/lib/auth/token-storage'
import { ApiError } from './api-error'
import { api } from './client'

// Substitui o fetch do navegador por um falso, para testar o cliente sem a API no ar
const fetchMock = vi.fn<typeof fetch>()

function jsonResponse(status: number, body: unknown, contentType = 'application/json'): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': contentType } })
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  localStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
  fetchMock.mockReset()
})

describe('api', () => {
  it('devolve o JSON da resposta', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { level: 8 }))

    await expect(api<{ level: number }>('/api/me/progress')).resolves.toEqual({ level: 8 })
  })

  it('envia o body em JSON', async () => {
    fetchMock.mockResolvedValue(jsonResponse(201, { id: 1 }))

    await api('/api/habits', { method: 'POST', body: { name: 'Ler', xpReward: 30 } })

    const [, init] = fetchMock.mock.calls[0]
    expect(init?.method).toBe('POST')
    expect(init?.body).toBe('{"name":"Ler","xpReward":30}')
    expect(init?.headers).toMatchObject({ 'Content-Type': 'application/json' })
  })

  it('manda o token quando existe sessão válida', async () => {
    saveSession({ token: 'abc', expiresAt: new Date(Date.now() + 60_000).toISOString() })
    fetchMock.mockResolvedValue(jsonResponse(200, {}))

    await api('/api/me')

    expect(fetchMock.mock.calls[0][1]?.headers).toMatchObject({ Authorization: 'Bearer abc' })
  })

  it('não manda token vencido', async () => {
    saveSession({ token: 'velho', expiresAt: new Date(Date.now() - 1_000).toISOString() })
    fetchMock.mockResolvedValue(jsonResponse(200, {}))

    await api('/api/me')

    expect(fetchMock.mock.calls[0][1]?.headers).not.toHaveProperty('Authorization')
  })

  it('transforma o Problem Details da API em ApiError, com os campos', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        400,
        { title: 'Erro de validação', detail: 'Um ou mais campos são inválidos', fields: { name: 'é obrigatório' } },
        'application/problem+json',
      ),
    )

    const error = await api('/api/habits', { method: 'POST', body: {} }).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      status: 400,
      title: 'Erro de validação',
      message: 'Um ou mais campos são inválidos',
      fields: { name: 'é obrigatório' },
    })
  })

  it('devolve undefined no 204 (sem corpo)', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))

    await expect(api('/api/habits/1', { method: 'DELETE' })).resolves.toBeUndefined()
  })

  it('vira erro de rede quando a API não responde', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

    const error = (await api('/api/today').catch((e: unknown) => e)) as ApiError

    expect(error.isNetworkError).toBe(true)
    expect(error.title).toBe('Sem conexão')
  })
})
