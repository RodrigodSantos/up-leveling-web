import { DEMO_ACCOUNT } from '@/features/auth/api'
import { api } from '@/lib/api/client'
import type { UserResponse } from '@/lib/api/types'
import type { PasswordForm, ProfileForm } from './schemas'

/** Mesma chave usada no cabeçalho ("Olá, {nome}"): atualizar aqui atualiza lá. */
export const meKey = ['me'] as const

export function updateProfile(data: ProfileForm): Promise<UserResponse> {
  return api<UserResponse>('/api/me', { method: 'PUT', body: data })
}

/** 204 sem corpo. A confirmação da senha nova é só do formulário: não vai para a API. */
export function changePassword({ currentPassword, newPassword }: PasswordForm): Promise<void> {
  return api<void>('/api/me/password', { method: 'PUT', body: { currentPassword, newPassword } })
}

/** A conta demo é compartilhada: a API recusa mudar os dados e a senha dela, então a tela já avisa antes. */
export function isDemoAccount(user: UserResponse): boolean {
  return user.email === DEMO_ACCOUNT.email
}
