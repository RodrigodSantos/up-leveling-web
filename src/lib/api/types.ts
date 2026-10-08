// Formatos das respostas da API (espelham os records do backend)

/** POST /api/auth/login */
export interface TokenResponse {
  token: string
  type: string
  expiresAt: string
}

/** POST /api/auth/register e GET /api/me */
export interface UserResponse {
  id: number
  name: string
  email: string
  createdAt: string
}
