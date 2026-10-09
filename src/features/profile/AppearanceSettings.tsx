import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { ACCENT_LABELS, ACCENTS, getAccent, setAccent, type Accent } from '@/lib/theme/accent'

const MODES = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Escuro', icon: Moon },
  { value: 'system', label: 'Automático', icon: Monitor },
] as const

// Item marcado com a cor de destaque, igual aos filtros das outras telas
const selectedItem = 'data-[state=on]:border-brand data-[state=on]:bg-brand/15 data-[state=on]:text-brand'

/**
 * Duas escolhas independentes, salvas só neste navegador:
 * - modo (claro/escuro/automático): fica com o next-themes, que põe a classe "dark" no <html>;
 * - cor de destaque: data-accent no <html> (src/lib/theme/accent.ts). Todo lugar que usa --brand muda junto.
 */
export function AppearanceSettings() {
  const { theme, setTheme } = useTheme()
  // A cor não tem um provider como o next-themes: o estado local só serve para marcar a opção escolhida
  const [accent, setAccentState] = useState<Accent>(getAccent)

  function chooseAccent(value: string) {
    if (!value) return // clicar na cor já marcada devolve "": nada muda
    setAccent(value as Accent)
    setAccentState(value as Accent)
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label id="mode-label">Modo</Label>
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          spacing={1}
          aria-labelledby="mode-label"
          value={theme}
          onValueChange={(value) => value && setTheme(value)}
        >
          {MODES.map(({ value, label, icon: Icon }) => (
            <ToggleGroupItem key={value} value={value} className={`${selectedItem} px-3`}>
              <Icon aria-hidden />
              {label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="space-y-2">
        <Label id="accent-label">Cor de destaque</Label>
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          spacing={1}
          className="flex-wrap"
          aria-labelledby="accent-label"
          value={accent}
          onValueChange={chooseAccent}
        >
          {ACCENTS.map((value) => (
            <ToggleGroupItem key={value} value={value} className={`${selectedItem} px-3`}>
              {/* data-accent na bolinha: o CSS do tema dá a ela a cor certa para o modo atual */}
              <span data-accent={value} className="bg-brand size-3 rounded-full" aria-hidden />
              {ACCENT_LABELS[value]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    </div>
  )
}
