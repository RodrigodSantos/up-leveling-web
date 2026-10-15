import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ProgressResponse, UserResponse } from '@/lib/api/types'
import { accentPalette } from '@/lib/theme/color'
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

function routes(user: UserResponse = me, savedHues: number[] = []) {
  return [
    { method: 'GET', path: '/api/me', status: 200, body: user },
    { method: 'GET', path: '/api/me/progress', status: 200, body: progress },
    { method: 'GET', path: '/api/me/accent-colors', status: 200, body: { hues: savedHues } },
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
  document.documentElement.removeAttribute('style') // tira as cores de destaque aplicadas por outro teste
  loginAs()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Perfil', () => {
  it('mostra o nível, o XP que falta e desde quando a pessoa joga', async () => {
    mockApi(...routes())
    await renderApp('/perfil')

    expect(await screen.findByText('Faltam 30 XP para o nível 3')).toBeInTheDocument()
    expect(screen.getByText('270 XP no total')).toBeInTheDocument()
    expect(screen.getByText('Jogador desde 8 de outubro de 2026')).toBeInTheDocument()
  })

  it('erro ao carregar o nível mostra a mensagem e o "Tentar de novo" busca outra vez', async () => {
    mockApi(
      { method: 'GET', path: '/api/me', status: 200, body: me },
      {
        method: 'GET',
        path: '/api/me/progress',
        status: 500,
        body: { title: 'Erro interno', detail: 'Falha no servidor' },
      },
      { method: 'GET', path: '/api/me/accent-colors', status: 200, body: { hues: [] } },
    )
    await renderApp('/perfil')

    expect(await screen.findByText('Não foi possível carregar seu nível. Falha no servidor')).toBeInTheDocument()
    expect(screen.queryByLabelText('Carregando nível')).not.toBeInTheDocument()

    // A API volta a responder: o botão busca de novo e o quadro de nível aparece
    mockApi(...routes())
    await userEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    expect(await screen.findByText('Faltam 30 XP para o nível 3')).toBeInTheDocument()
  })

  it('salva nome e e-mail e o cabeçalho muda na hora', async () => {
    const updated = { ...me, name: 'Rodrigo dos Santos' }
    const api = mockApi(...routes(), { method: 'PUT', path: '/api/me', status: 200, body: updated })
    await renderApp('/perfil')

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
    await renderApp('/perfil')

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
    await renderApp('/perfil')

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
    await renderApp('/perfil')

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
    await renderApp('/perfil')

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

  it('salva a cor escolhida no arco-íris na conta, e depois remove', async () => {
    const api = mockApi(
      { method: 'GET', path: '/api/me/accent-colors', status: 200, body: { hues: [] } },
      { method: 'PUT', path: '/api/me/accent-colors', status: 200, body: { hues: [200] } },
      ...routes(),
    )
    await renderApp('/perfil')
    const aparencia = await screen.findByRole('region', { name: 'Aparência' })
    expect(await within(aparencia).findByText(/Nenhuma ainda/)).toBeInTheDocument()

    fireEvent.change(within(aparencia).getByRole('slider', { name: 'Ou escolha qualquer cor' }), {
      target: { value: '200' },
    })
    await userEvent.click(within(aparencia).getByRole('button', { name: 'Salvar esta cor' }))

    expect(sentBody(api, callIndex(api, 'PUT'))).toEqual({ hues: [200] })
    const savedColor = await within(aparencia).findByRole('radio', { name: 'Cor salva: matiz 200°' })
    expect(savedColor).toHaveAttribute('aria-checked', 'true') // é a cor escolhida agora
    expect(within(aparencia).getByText('1 de 5')).toBeInTheDocument()
    expect(await screen.findByText('Cor salva: 200°')).toBeInTheDocument()

    // Com a cor salva escolhida, o botão vira "Remover"; a lista sem ela vai para a API
    mockApi({ method: 'PUT', path: '/api/me/accent-colors', status: 200, body: { hues: [] } }, ...routes())
    await userEvent.click(within(aparencia).getByRole('button', { name: 'Remover esta cor' }))
    expect(await within(aparencia).findByText(/Nenhuma ainda/)).toBeInTheDocument()
  })

  it('não salva uma cor padrão nem passa de 5, e explica o porquê', async () => {
    mockApi(...routes(me, [10, 60, 120, 180, 330]))
    await renderApp('/perfil')
    const aparencia = await screen.findByRole('region', { name: 'Aparência' })

    // Azul (padrão) é a cor de agora
    expect(await within(aparencia).findByText('Esta já é uma das cores padrão.')).toBeInTheDocument()
    expect(within(aparencia).getByRole('button', { name: 'Salvar esta cor' })).toBeDisabled()

    fireEvent.change(within(aparencia).getByRole('slider', { name: 'Ou escolha qualquer cor' }), {
      target: { value: '200' },
    })
    expect(within(aparencia).getByText('Limite de 5: remova uma para salvar outra.')).toBeInTheDocument()
    expect(within(aparencia).getByRole('button', { name: 'Salvar esta cor' })).toBeDisabled()

    // Clicar numa cor salva aplica a cor no app
    await userEvent.click(within(aparencia).getByRole('radio', { name: 'Cor salva: matiz 330°' }))
    expect(localStorage.getItem('up-leveling.accent')).toBe('330')
  })

  it('na conta demo, avisa e trava dados e senha', async () => {
    mockApi(...routes(demo))
    await renderApp('/perfil')

    expect(await screen.findByText(/Esta é a conta de demonstração/)).toBeInTheDocument()
    const dados = panel('Dados da conta')
    expect(within(dados).getByLabelText('Nome')).toBeDisabled()
    expect(within(dados).getByLabelText('E-mail')).toBeDisabled()
    expect(within(panel('Trocar senha')).getByLabelText('Senha atual')).toBeDisabled()
    expect(within(panel('Trocar senha')).getByRole('button', { name: 'Alterar senha' })).toBeDisabled()
  })

  it('na conta demo, mostra as cores salvas, mas sem salvar nem remover', async () => {
    mockApi(...routes(demo, [200, 330]))
    await renderApp('/perfil')
    const aparencia = await screen.findByRole('region', { name: 'Aparência' })

    expect(await within(aparencia).findByRole('radio', { name: 'Cor salva: matiz 200°' })).toBeInTheDocument()
    expect(within(aparencia).getByText(/cores salvas não podem ser alteradas/)).toBeInTheDocument()
    expect(within(aparencia).queryByRole('button', { name: 'Salvar esta cor' })).not.toBeInTheDocument()
  })

  it('atalho de cor, qualquer matiz no controle e o modo valem na hora e ficam salvos no navegador', async () => {
    mockApi(...routes())
    await renderApp('/perfil')

    const aparencia = await screen.findByRole('region', { name: 'Aparência' })
    expect(within(aparencia).getByRole('radio', { name: 'Azul' })).toHaveAttribute('aria-checked', 'true')

    // Atalho: as cores calculadas para a matiz vão para o <html>
    await userEvent.click(within(aparencia).getByRole('radio', { name: 'Roxo' }))
    const html = document.documentElement.style
    expect(html.getPropertyValue('--accent-dark')).toBe(accentPalette(294).dark.brand)
    expect(html.getPropertyValue('--accent-light')).toBe(accentPalette(294).light.brand)
    expect(localStorage.getItem('up-leveling.accent')).toBe('294')
    expect(within(aparencia).getByRole('radio', { name: 'Roxo' })).toHaveAttribute('aria-checked', 'true')

    // Matiz livre no controle: nenhum atalho fica marcado
    const slider = within(aparencia).getByRole('slider', { name: 'Ou escolha qualquer cor' })
    fireEvent.change(slider, { target: { value: '200' } })
    expect(slider).toHaveAttribute('aria-valuetext', 'Matiz 200°')
    expect(html.getPropertyValue('--accent-dark')).toBe(accentPalette(200).dark.brand)
    expect(localStorage.getItem('up-leveling.accent')).toBe('200')
    expect(JSON.parse(localStorage.getItem('up-leveling.accent-vars')!)).toMatchObject({
      '--accent-dark': accentPalette(200).dark.brand,
    })
    expect(
      within(aparencia).queryByRole('radio', { checked: true, name: /Azul|Vermelho|Amarelo|Roxo|Verde/ }),
    ).toBeNull()

    await userEvent.click(within(aparencia).getByRole('radio', { name: 'Claro' }))
    expect(localStorage.getItem('up-leveling.mode')).toBe('light')
    expect(document.documentElement).not.toHaveClass('dark')
  })
})
