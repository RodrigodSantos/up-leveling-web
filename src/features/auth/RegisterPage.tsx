import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { login, registerUser } from './api'
import { AuthLayout } from './AuthLayout'
import { showApiError } from '@/components/form/form-errors'
import { FormField } from '@/components/form/FormField'
import { registerSchema, type RegisterForm } from './schemas'
import { SlowServerHint } from './SlowServerHint'
import { useAccessGranted } from './system/use-access-granted'

export function RegisterPage() {
  const { granted, grant } = useAccessGranted()
  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '' },
  })
  const { errors } = form.formState

  const registerMutation = useMutation({
    // Cria a conta e já entra, para a pessoa não ter que digitar tudo de novo no login
    mutationFn: async (data: RegisterForm) => {
      await registerUser(data)
      return login({ email: data.email, password: data.password })
    },
    onSuccess: (token) => {
      grant(token)
      toast.success('Conta criada. Bora subir de nível.')
    },
    // 409 = e-mail já cadastrado: a mensagem vai para o campo de e-mail
    onError: (error) => showApiError(error, form.setError, { 409: 'email' }),
  })

  return (
    <AuthLayout
      title="Criar conta"
      granted={granted}
      description="Um novo Jogador desperta. Cadastre seus hábitos e comece a ganhar XP."
      footer={
        <span>
          Já tem conta?{' '}
          <Link to="/login" className="text-brand underline underline-offset-4">
            Entrar
          </Link>
        </span>
      }
    >
      <form onSubmit={form.handleSubmit((data) => registerMutation.mutate(data))} noValidate className="space-y-4">
        <FormField
          id="name"
          label="Nome"
          autoComplete="name"
          placeholder="Rodrigo"
          error={errors.name?.message}
          {...form.register('name')}
        />
        <FormField
          id="email"
          label="E-mail"
          type="email"
          autoComplete="email"
          placeholder="voce@email.com"
          error={errors.email?.message}
          {...form.register('email')}
        />
        <FormField
          id="password"
          label="Senha"
          type="password"
          autoComplete="new-password"
          placeholder="Pelo menos 8 caracteres"
          error={errors.password?.message}
          {...form.register('password')}
        />
        {errors.root && (
          <p role="alert" className="text-destructive text-sm">
            {errors.root.message}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={registerMutation.isPending || granted}>
          {registerMutation.isPending ? 'Criando conta...' : 'Criar conta'}
        </Button>
        <SlowServerHint loading={registerMutation.isPending} />
      </form>
    </AuthLayout>
  )
}
