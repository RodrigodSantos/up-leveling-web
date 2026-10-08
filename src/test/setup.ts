// Roda antes de cada arquivo de teste
import '@testing-library/jest-dom/vitest' // matchers como toBeInTheDocument()
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// O jsdom (navegador simulado) não tem matchMedia; o componente de avisos (sonner) usa para detectar o tema escuro
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Desmonta o que cada teste renderizou, para um teste não enxergar a tela do outro
afterEach(() => {
  cleanup()
})
