import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import type { ReactNode } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/lib/auth/AuthProvider'

/**
 * Tudo que o app inteiro compartilha: tema (claro/escuro), cache de dados, sessão e avisos (toasts).
 * Separado do main.tsx para os testes montarem o app do mesmo jeito.
 */
export function AppProviders({ queryClient, children }: { queryClient: QueryClient; children: ReactNode }) {
  return (
    // Modo escuro como padrão (a "janela do Sistema"); "system" segue o celular/computador da pessoa
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem storageKey="up-leveling.mode">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {children}
          {/* Embaixo, para não cobrir a barra de XP do cabeçalho, que é justamente o que os avisos anunciam */}
          <Toaster position="bottom-center" richColors />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
