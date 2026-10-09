import { z } from 'zod'

// Validação no navegador, com as mesmas regras da API (o usuário vê o erro antes de enviar).
// Equivalente às anotações @NotBlank, @Email e @Size dos records do backend.

export const emailSchema = z.string().trim().min(1, 'Informe o e-mail').pipe(z.email('Digite um e-mail válido'))

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Informe a senha'),
})

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Informe seu nome').max(100, 'Use no máximo 100 caracteres'),
  email: emailSchema,
  // O BCrypt da API ignora o que passa de 72 bytes
  password: z.string().min(8, 'Use pelo menos 8 caracteres').max(72, 'Use no máximo 72 caracteres'),
})

// O tipo do formulário sai do próprio schema: uma fonte só para as regras e para o TypeScript
export type LoginForm = z.infer<typeof loginSchema>
export type RegisterForm = z.infer<typeof registerSchema>
