/**
 * Erro vindo da API, no formato RFC 9457 (Problem Details) que o backend usa:
 * { "status": 400, "title": "Erro de validação", "detail": "...", "fields": { "name": "é obrigatório" } }
 */
export class ApiError extends Error {
  readonly status: number
  readonly title: string
  /** Erros por campo (só nas validações): o formulário mostra cada um ao lado do seu input. */
  readonly fields: Record<string, string>

  constructor(status: number, title: string, detail?: string, fields: Record<string, string> = {}) {
    super(detail ?? title)
    this.name = 'ApiError'
    this.status = status
    this.title = title
    this.fields = fields
  }

  /** A API não respondeu (fora do ar, sem internet ou ainda "acordando" no plano gratuito). */
  get isNetworkError(): boolean {
    return this.status === 0
  }
}

interface ProblemDetail {
  title?: string
  detail?: string
  fields?: Record<string, string>
}

/** Monta o ApiError a partir da resposta de erro, mesmo que ela não venha em JSON. */
export async function toApiError(response: Response): Promise<ApiError> {
  const contentType = response.headers.get('Content-Type') ?? ''
  if (contentType.includes('json')) {
    const problem = (await response.json()) as ProblemDetail
    return new ApiError(response.status, problem.title ?? response.statusText, problem.detail, problem.fields)
  }
  return new ApiError(response.status, response.statusText || 'Erro inesperado')
}
