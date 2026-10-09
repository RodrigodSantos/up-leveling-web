import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { showApiError } from '@/components/form/form-errors'
import { FormField } from '@/components/form/FormField'
import { Button } from '@/components/ui/button'
import type { UserResponse } from '@/lib/api/types'
import { meKey, updateProfile } from './api'
import { profileSchema, type ProfileForm } from './schemas'

/** Nome e e-mail. Na conta demo, os campos ficam travados (a API recusaria a mudança). */
export function ProfileDataForm({ user, locked }: { user: UserResponse; locked: boolean }) {
  const queryClient = useQueryClient()
  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    // values (e não defaultValues): o formulário acompanha os dados do cache; depois de salvar, ele
    // recebe o usuário atualizado e volta a ficar "sem mudanças" (isDirty = false)
    values: { name: user.name, email: user.email },
  })
  const { errors, isDirty } = form.formState

  const save = useMutation({
    mutationFn: updateProfile,
    onSuccess: (updated) => {
      // A resposta do PUT já é o usuário novo: grava no cache sem buscar de novo, e o "Olá, {nome}" muda na hora
      queryClient.setQueryData(meKey, updated)
      toast.success('Dados atualizados.')
    },
    // 409 = o e-mail já é de outra conta
    onError: (error) => showApiError(error, form.setError, { 409: 'email' }),
  })

  return (
    <form onSubmit={form.handleSubmit((data) => save.mutate(data))} noValidate className="space-y-4">
      <fieldset disabled={locked} className="space-y-4">
        <FormField
          id="profile-name"
          label="Nome"
          autoComplete="name"
          error={errors.name?.message}
          {...form.register('name')}
        />
        <FormField
          id="profile-email"
          label="E-mail"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...form.register('email')}
        />
      </fieldset>
      {errors.root && (
        <p role="alert" className="text-destructive text-sm">
          {errors.root.message}
        </p>
      )}
      <Button type="submit" disabled={locked || !isDirty || save.isPending}>
        {save.isPending ? 'Salvando...' : 'Salvar dados'}
      </Button>
    </form>
  )
}
