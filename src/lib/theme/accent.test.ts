import { beforeEach, describe, expect, it } from 'vitest'
import { getAccentHue, setAccentHue } from './accent'
import { accentPalette } from './color'

beforeEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute('style')
})

describe('getAccentHue', () => {
  it('sem nada salvo, é o azul', () => {
    expect(getAccentHue()).toBe(251)
  })

  it('quem salvou a cor pelo nome (versão antiga) continua com ela', () => {
    localStorage.setItem('up-leveling.accent', 'red')
    expect(getAccentHue()).toBe(18)
  })

  it('valor inválido vira o azul', () => {
    for (const value of ['abc', '400', '-5', '12.5']) {
      localStorage.setItem('up-leveling.accent', value)
      expect(getAccentHue(), value).toBe(251)
    }
  })
})

describe('setAccentHue', () => {
  it('a cor de erro magenta entra perto do vermelho e sai ao trocar para outra matiz', () => {
    const html = document.documentElement.style

    setAccentHue(18)
    expect(html.getPropertyValue('--accent-destructive-dark')).toBe(accentPalette(18).destructive!.dark)

    setAccentHue(251)
    expect(html.getPropertyValue('--accent-destructive-dark')).toBe('')
    expect(localStorage.getItem('up-leveling.accent-vars')).not.toContain('destructive')
  })
})
