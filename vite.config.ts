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
  },
})
