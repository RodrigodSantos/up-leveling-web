import { api } from '@/lib/api/client'
import type { TokenResponse, UserResponse } from '@/lib/api/types'
import type { LoginForm, RegisterForm } from './schemas'

/** Conta pública de demonstração, com 30 dias de histórico (recriada a cada inicialização da API). */
export const DEMO_ACCOUNT: LoginForm = { email: 'demo@upleveling.local', password: 'demo1234' }

export function login(credentials: LoginForm): Promise<TokenResponse> {
  return api<TokenResponse>('/api/auth/login', { method: 'POST', body: credentials })
}

export function registerUser(data: RegisterForm): Promise<UserResponse> {
  return api<UserResponse>('/api/auth/register', { method: 'POST', body: data })
}

export function fetchMe(): Promise<UserResponse> {
  return api<UserResponse>('/api/me')
}
