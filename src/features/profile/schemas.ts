import { z } from 'zod'
import { emailSchema } from '@/features/auth/schemas'

// Mesmas regras do UpdateProfileRequest e do ChangePasswordRequest da API

export const profileSchema = z.object({
  name: z.string().trim().min(1, 'Informe seu nome').max(100, 'Use no máximo 100 caracteres'),
  email: emailSchema.pipe(z.string().max(150, 'Use no máximo 150 caracteres')),
})

export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Informe a senha atual'),
    newPassword: z.string().min(8, 'Use pelo menos 8 caracteres').max(72, 'Use no máximo 72 caracteres'),
    confirmPassword: z.string().min(1, 'Repita a senha nova'),
  })
  // refine: uma regra que olha mais de um campo ao mesmo tempo. O "path" diz embaixo de qual campo o erro aparece.
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'As senhas não são iguais',
    path: ['confirmPassword'],
  })

export type ProfileForm = z.infer<typeof profileSchema>
export type PasswordForm = z.infer<typeof passwordSchema>
