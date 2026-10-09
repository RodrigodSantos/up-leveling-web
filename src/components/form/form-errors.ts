import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { ApiError } from '@/lib/api/api-error'

/**
 * Leva o erro da API para o formulário:
 * - erros por campo (400 com "fields") aparecem embaixo de cada input;
 * - campos indicados em `fieldFor` (ex.: 409 do e-mail repetido) vão para aquele campo;
 * - o resto aparece no topo do formulário ("root").
 */
export function showApiError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fieldFor: Partial<Record<number, Path<T>>> = {},
) {
  if (!(error instanceof ApiError)) {
    setError('root', { message: 'Algo deu errado. Tente de novo.' })
    return
  }
  const fieldErrors = Object.entries(error.fields)
  if (fieldErrors.length > 0) {
    for (const [field, message] of fieldErrors) {
      setError(field as Path<T>, { message: capitalize(message) })
    }
    return
  }
  const field = fieldFor[error.status]
  setError(field ?? 'root', { message: error.message })
}

// A API manda "é obrigatório"; embaixo do campo fica melhor "É obrigatório"
function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}
