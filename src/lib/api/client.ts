import { clearSession, getSession } from '@/lib/auth/token-storage'
import { ApiError, toApiError } from './api-error'

/** Endereço da API: vem do arquivo .env (VITE_API_URL); localmente, o backend roda na 8080. */
export const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

/** Evento disparado no navegador quando a API recusa o token (401): o AuthProvider escuta e manda para o login. */
export const SESSION_EXPIRED_EVENT = 'up-leveling:session-expired'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface RequestOptions {
  method?: HttpMethod
  body?: unknown
}

/**
 * Único ponto do front que fala com a API (equivalente ao "CurrentUser" do backend para o token):
 * - coloca o token no header Authorization, se houver sessão;
 * - converte o body em JSON;
 * - transforma respostas de erro em ApiError, com a mensagem que a API mandou.
 *
 * Uso: const today = await api<TodayResponse>('/api/today')
 */
export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {}
  const session = getSession()
  if (session) {
    headers.Authorization = `Bearer ${session.token}`
  }
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    })
  } catch {
    // fetch só lança exceção quando nem chega a ter resposta (rede, CORS, servidor fora do ar)
    throw new ApiError(0, 'Sem conexão', 'Não foi possível falar com o servidor. Tente de novo em instantes.')
  }

  if (!response.ok) {
    // 401 com token = o token venceu ou ficou inválido: encerra a sessão e avisa o app (AuthProvider)
    if (response.status === 401 && session) {
      clearSession()
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
    }
    throw await toApiError(response)
  }
  // 204 No Content (ex.: excluir um hábito) não tem corpo para ler
  if (response.status === 204) {
    return undefined as T
  }
  return (await response.json()) as T
}
