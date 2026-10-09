import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Sparkles } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth/auth-context'
import { DEMO_ACCOUNT, login } from './api'
import { AuthLayout } from './AuthLayout'
import { showApiError } from '@/components/form/form-errors'
import { FormField } from '@/components/form/FormField'
import { loginSchema, type LoginForm } from './schemas'
import { SlowServerHint } from './SlowServerHint'

export function LoginPage() {
  const { signIn } = useAuth()
  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })
  const { errors } = form.formState

  // useMutation: uma ação que muda algo no servidor (aqui, "abrir uma sessão")
  const loginMutation = useMutation({
    mutationFn: login,
    // Ao guardar o token, o RedirectIfAuthenticated leva para o app (ou para a tela de onde a pessoa veio)
    onSuccess: signIn,
    onError: (error) => showApiError(error, form.setError),
  })

  return (
    <AuthLayout
      title="Entrar"
      description="Bem-vindo de volta, Jogador. Identifique-se para continuar."
      footer={
        <span>
          Não tem conta?{' '}
          <Link to="/cadastro" className="text-brand underline underline-offset-4">
            Criar conta
          </Link>
        </span>
      }
    >
      <form onSubmit={form.handleSubmit((data) => loginMutation.mutate(data))} noValidate className="space-y-4">
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
          autoComplete="current-password"
          error={errors.password?.message}
          {...form.register('password')}
        />
        {errors.root && (
          <p role="alert" className="text-destructive text-sm">
            {errors.root.message}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? 'Entrando...' : 'Entrar'}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={loginMutation.isPending}
          onClick={() => loginMutation.mutate(DEMO_ACCOUNT)}
        >
          <Sparkles aria-hidden />
          Entrar com a conta demo
        </Button>
        <SlowServerHint loading={loginMutation.isPending} />
      </form>
    </AuthLayout>
  )
}
