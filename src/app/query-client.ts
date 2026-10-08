import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '@/lib/api/api-error'

/**
 * Cache dos dados vindos da API (TanStack Query).
 * Erros 4xx (ex.: 404, 422) não adiantam repetir; só falhas de rede e 5xx tentam de novo.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // por 30 s o dado é considerado "fresco" e não é buscado de novo
      retry: (failureCount, error) =>
        failureCount < 2 && (!(error instanceof ApiError) || error.isNetworkError || error.status >= 500),
    },
  },
})
