import type { ComponentProps } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface FormFieldProps extends ComponentProps<'input'> {
  id: string
  label: string
  error?: string
}

/** Rótulo + campo + mensagem de erro, ligados para leitores de tela (aria-invalid, aria-describedby). */
export function FormField({ id, label, error, ...inputProps }: FormFieldProps) {
  const errorId = `${id}-error`
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} aria-invalid={!!error} aria-describedby={error ? errorId : undefined} {...inputProps} />
      {error && (
        <p id={errorId} className="text-destructive text-sm">
          {error}
        </p>
      )}
    </div>
  )
}
