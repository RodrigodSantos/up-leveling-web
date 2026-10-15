import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getSession } from '@/lib/auth/token-storage'
import { loginAs, mockApi, renderApp, sentBody } from '@/test/render-app'

const token = { token: 'jwt-novo', type: 'Bearer', expiresAt: new Date(Date.now() + 3_600_000).toISOString() }
const me = { id: 1, name: 'Rodrigo', email: 'rodrigo@mail.com', createdAt: '2026-10-08T10:00:00' }

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('login', () => {
  it('entra e vai para a tela de onde a pessoa veio', async () => {
    const api = mockApi(
      { method: 'POST', path: '/api/auth/login', status: 200, body: token },
      { method: 'GET', path: '/api/me', status: 200, body: me },
    )
    await renderApp('/habitos') // sem login: cai no /login lembrando do /habitos

    await userEvent.type(screen.getByLabelText('E-mail'), 'rodrigo@mail.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'senha-forte-123')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('heading', { name: 'Hábitos' })).toBeInTheDocument()
    expect(sentBody(api)).toEqual({ email: 'rodrigo@mail.com', password: 'senha-forte-123' })
    expect(getSession()?.token).toBe('jwt-novo')
  })

  it('valida no navegador, sem chamar a API', async () => {
    const api = mockApi()
    await renderApp('/login')

    await userEvent.type(screen.getByLabelText('E-mail'), 'nao-e-email')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('Digite um e-mail válido')).toBeInTheDocument()
    expect(screen.getByText('Informe a senha')).toBeInTheDocument()
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('aria-invalid', 'true')
    expect(api).not.toHaveBeenCalled()
  })

  it('mostra a mensagem da API quando a senha está errada', async () => {
    mockApi({
      method: 'POST',
      path: '/api/auth/login',
      status: 401,
      body: { title: 'Credenciais inválidas', detail: 'E-mail ou senha inválidos' },
    })
    await renderApp('/login')

    await userEvent.type(screen.getByLabelText('E-mail'), 'rodrigo@mail.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'errada')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha inválidos')
    expect(getSession()).toBeNull()
  })

  it('se a API demora mais de 4 s, avisa que o servidor está acordando; o aviso some quando ela responde', async () => {
    // A resposta só chega quando o teste chamar answer(): dá para ver a tela durante a espera
    let answer: (response: Response) => void = () => {}
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise<Response>((resolve) => (answer = resolve))),
    )
    await renderApp('/login')

    // Relógio falso: o teste avança os 4 s na hora, sem esperar de verdade
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    await user.click(screen.getByRole('button', { name: 'Entrar com a conta demo' }))

    act(() => vi.advanceTimersByTime(3_900))
    expect(screen.queryByText(/servidor está acordando/)).not.toBeInTheDocument()
    act(() => vi.advanceTimersByTime(200))
    expect(screen.getByText('O servidor está acordando, isso pode levar até 1 minuto.')).toBeInTheDocument()

    const problem = { title: 'Credenciais inválidas', detail: 'E-mail ou senha inválidos' }
    answer(
      new Response(JSON.stringify(problem), { status: 401, headers: { 'Content-Type': 'application/problem+json' } }),
    )
    await waitFor(() => expect(screen.queryByText(/servidor está acordando/)).not.toBeInTheDocument())
  })

  it('entra com a conta demo sem digitar nada', async () => {
    const api = mockApi(
      { method: 'POST', path: '/api/auth/login', status: 200, body: token },
      { method: 'GET', path: '/api/me', status: 200, body: { ...me, name: 'Demo' } },
    )
    await renderApp('/login')

    await userEvent.click(screen.getByRole('button', { name: 'Entrar com a conta demo' }))

    expect(await screen.findByRole('heading', { name: 'Missões diárias' })).toBeInTheDocument()
    expect(sentBody(api)).toEqual({ email: 'demo@upleveling.local', password: 'demo1234' })
  })

  it('com animações ligadas, mostra "Acesso concedido" antes de entrar', async () => {
    // Desliga o "reduzir movimento" que o setup dos testes deixa ligado
    const original = window.matchMedia
    window.matchMedia = ((query: string) => ({ ...original(query), matches: false })) as typeof window.matchMedia
    try {
      mockApi(
        { method: 'POST', path: '/api/auth/login', status: 200, body: token },
        { method: 'GET', path: '/api/me', status: 200, body: me },
      )
      await renderApp('/login')

      await userEvent.click(screen.getByRole('button', { name: 'Entrar com a conta demo' }))

      // Primeiro a mensagem do Sistema, ainda na tela de login (o token só é guardado depois dela)
      expect(await screen.findByRole('status')).toHaveTextContent('Acesso concedido')
      expect(getSession()).toBeNull()
      expect(screen.getByRole('button', { name: 'Entrar com a conta demo' })).toBeDisabled()

      // Passados os 700 ms, entra no app
      expect(await screen.findByRole('heading', { name: 'Missões diárias' }, { timeout: 3000 })).toBeInTheDocument()
      expect(getSession()?.token).toBe('jwt-novo')
    } finally {
      window.matchMedia = original
    }
  })
})

describe('cadastro', () => {
  it('cria a conta, entra sozinho e vai para o app', async () => {
    const api = mockApi(
      { method: 'POST', path: '/api/auth/register', status: 201, body: me },
      { method: 'POST', path: '/api/auth/login', status: 200, body: token },
      { method: 'GET', path: '/api/me', status: 200, body: me },
    )
    await renderApp('/cadastro')

    await userEvent.type(screen.getByLabelText('Nome'), 'Rodrigo')
    await userEvent.type(screen.getByLabelText('E-mail'), 'rodrigo@mail.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'senha-forte-123')
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(await screen.findByRole('heading', { name: 'Missões diárias' })).toBeInTheDocument()
    expect(sentBody(api, 0)).toEqual({ name: 'Rodrigo', email: 'rodrigo@mail.com', password: 'senha-forte-123' })
  })

  it('e-mail já cadastrado (409) aparece no campo de e-mail', async () => {
    mockApi({
      method: 'POST',
      path: '/api/auth/register',
      status: 409,
      body: { title: 'Conflito', detail: "Já existe uma conta com o e-mail 'rodrigo@mail.com'" },
    })
    await renderApp('/cadastro')

    await userEvent.type(screen.getByLabelText('Nome'), 'Rodrigo')
    await userEvent.type(screen.getByLabelText('E-mail'), 'rodrigo@mail.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'senha-forte-123')
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(await screen.findByText("Já existe uma conta com o e-mail 'rodrigo@mail.com'")).toBeInTheDocument()
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('aria-invalid', 'true')
  })

  it('senha curta é barrada no navegador', async () => {
    await renderApp('/cadastro')

    await userEvent.type(screen.getByLabelText('Senha'), '1234567')
    await userEvent.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(await screen.findByText('Use pelo menos 8 caracteres')).toBeInTheDocument()
  })
})

describe('sessão', () => {
  it('sair apaga o token e volta para o login', async () => {
    mockApi({ method: 'GET', path: '/api/me', status: 200, body: me })
    loginAs()
    await renderApp('/')

    await userEvent.click(screen.getByRole('button', { name: 'Sair' }))

    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
    expect(getSession()).toBeNull()
  })

  it('token recusado pela API (401) encerra a sessão e volta para o login', async () => {
    mockApi({
      method: 'GET',
      path: '/api/me',
      status: 401,
      body: { title: 'Não autenticado', detail: 'Token ausente, inválido ou expirado' },
    })
    loginAs('token-revogado')
    await renderApp('/')

    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
    expect(await screen.findByText('Sua sessão expirou. Entre de novo.')).toBeInTheDocument()
    expect(getSession()).toBeNull()
  })
})
