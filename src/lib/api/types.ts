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

/** GET /api/me/progress (e dentro das respostas de check-in e do resumo do dia) */
export interface ProgressResponse {
  totalXp: number
  level: number
  /** XP total em que o nível atual começou */
  currentLevelXp: number
  /** XP total para chegar ao próximo nível */
  nextLevelXp: number
  progressPercent: number
}

/** Um hábito no resumo do dia */
export interface TodayHabit {
  id: number
  name: string
  xpReward: number
  dailyTarget: number
  /** check-ins feitos no dia */
  count: number
  completed: boolean
  streak: number
}

/** GET /api/today */
export interface TodayResponse {
  date: string
  dayOfWeek: string
  habits: TodayHabit[]
  completedCount: number
  totalCount: number
  xpEarnedToday: number
  progress: ProgressResponse
}

/** POST e DELETE /api/habits/{id}/check-ins */
export interface CheckInResponse {
  habitId: number
  date: string
  /** XP ganho (positivo) ou devolvido ao desfazer (negativo), bônus incluído */
  xpChange: number
  bonusXp: number
  dayCount: number
  dailyTarget: number
  dayCompleted: boolean
  streak: number
  leveledUp: boolean
  progress: ProgressResponse
}
