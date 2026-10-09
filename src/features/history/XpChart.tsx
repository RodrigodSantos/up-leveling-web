import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import type { DailyXp } from '@/lib/api/types'
import { formatLongDate, formatShortDate } from '@/lib/dates'

// O ChartContainer transforma cada chave em uma variável CSS (--color-xp), usada no fill da barra.
// --brand é a cor de destaque do tema: o gráfico muda junto quando a cor é trocada.
const chartConfig = {
  xp: { label: 'XP', color: 'var(--brand)' },
} satisfies ChartConfig

/** Gráfico de barras: um ponto por dia, do mais antigo (esquerda) para hoje (direita). */
export function XpChart({ days }: { days: DailyXp[] }) {
  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-56 w-full" aria-label="Gráfico de XP por dia">
      <BarChart data={days} margin={{ left: -16, right: 4 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="date" tickLine={false} axisLine={false} tickFormatter={formatShortDate} minTickGap={24} />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={48} />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent labelFormatter={(_, payload) => formatLongDate(payload[0]?.payload.date)} />}
        />
        <Bar dataKey="xp" fill="var(--color-xp)" radius={3} />
      </BarChart>
    </ChartContainer>
  )
}
