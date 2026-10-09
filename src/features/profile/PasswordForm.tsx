import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { showApiError } from '@/components/form/form-errors'
import { FormField } from '@/components/form/FormField'
import { Button } from '@/components/ui/button'
import { changePassword } from './api'
import { passwordSchema, type PasswordForm as PasswordFormValues } from './schemas'

const emptyForm: PasswordFormValues = { currentPassword: '', newPassword: '', confirmPassword: '' }

/** Troca de senha: pede a atual, a nova e a confirmação. Na conta demo, fica travada. */
export function PasswordForm({ locked }: { locked: boolean }) {
  const form = useForm<PasswordFormValues>({ resolver: zodResolver(passwordSchema), defaultValues: emptyForm })
  const { errors } = form.formState

  const save = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      // Senhas não ficam na tela depois de usadas
      form.reset(emptyForm)
      toast.success('Senha alterada. Use a nova no próximo login.')
    },
    // 422 = a senha atual está errada (a API não usa 401 aqui para não derrubar a sessão)
    onError: (error) => showApiError(error, form.setError, { 422: 'currentPassword' }),
  })

  return (
    <form onSubmit={form.handleSubmit((data) => save.mutate(data))} noValidate className="space-y-4">
      <fieldset disabled={locked} className="space-y-4">
        <FormField
          id="current-password"
          label="Senha atual"
          type="password"
          autoComplete="current-password"
          error={errors.currentPassword?.message}
          {...form.register('currentPassword')}
        />
        <FormField
          id="new-password"
          label="Senha nova"
          type="password"
          autoComplete="new-password"
          placeholder="Pelo menos 8 caracteres"
          error={errors.newPassword?.message}
          {...form.register('newPassword')}
        />
        <FormField
          id="confirm-password"
          label="Repita a senha nova"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...form.register('confirmPassword')}
        />
      </fieldset>
      {errors.root && (
        <p role="alert" className="text-destructive text-sm">
          {errors.root.message}
        </p>
      )}
      <Button type="submit" disabled={locked || save.isPending}>
        {save.isPending ? 'Alterando...' : 'Alterar senha'}
      </Button>
    </form>
  )
}
