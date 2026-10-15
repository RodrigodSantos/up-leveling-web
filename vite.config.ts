import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // "@/lib/api" em vez de "../../../lib/api", em qualquer pasta
    alias: { '@': path.resolve(import.meta.dirname, 'src') },
  },
  test: {
    // Simula um navegador (DOM) dentro do Node para testar componentes
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    // Limite de cada teste (o padrão é 5 s). O renderApp espera até 10 s pela tela carregada sob demanda
    // (no primeiro teste de cada arquivo ela ainda passa pela transformação do Vitest): o limite precisa ser maior
    testTimeout: 15_000,
  },
})
