import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/lib/auth/AuthProvider'

/**
 * Tudo que o app inteiro compartilha: cache de dados, sessão e avisos (toasts).
 * Separado do main.tsx para os testes montarem o app do mesmo jeito.
 */
export function AppProviders({ queryClient, children }: { queryClient: QueryClient; children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
        <Toaster position="top-center" richColors />
      </AuthProvider>
    </QueryClientProvider>
  )
}
