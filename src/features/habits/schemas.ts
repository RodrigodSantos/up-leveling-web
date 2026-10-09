import { z } from 'zod'

// Mesmas regras do HabitRequest da API (@NotBlank, @Size, @Min, @Max).
// Os números chegam do input já convertidos (register com valueAsNumber): campo vazio vira NaN,
// e o z.number() recusa NaN com a mensagem de "error".
const integerBetween = (min: number, max: number, emptyMessage: string) =>
  z
    .number({ error: emptyMessage })
    .int('Use um número inteiro')
    .min(min, `Use um valor entre ${min} e ${max}`)
    .max(max, `Use um valor entre ${min} e ${max}`)

export const habitSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome do hábito').max(100, 'Use no máximo 100 caracteres'),
  xpReward: integerBetween(1, 100, 'Informe o XP'),
  dailyTarget: integerBetween(1, 20, 'Informe a meta diária'),
  days: z.array(z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'])),
})

export type HabitForm = z.infer<typeof habitSchema>
