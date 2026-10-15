import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useMemo, useState, type CSSProperties } from 'react'
import { Label } from '@/components/ui/label'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { ACCENT_PRESETS, getAccentHue, setAccentHue } from '@/lib/theme/accent'
import { accentPalette } from '@/lib/theme/color'

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
 * - cor de destaque: qualquer matiz do arco-íris (0–359°), com 5 atalhos. As cores de cada modo são calculadas
 *   com contraste garantido (src/lib/theme/color.ts) e vão para o <html>: todo lugar que usa --brand muda junto,
 *   já enquanto a pessoa arrasta o controle.
 */
export function AppearanceSettings() {
  const { theme, setTheme } = useTheme()
  // A cor não tem um provider como o next-themes: o estado local só serve para marcar a opção escolhida
  const [hue, setHue] = useState(getAccentHue)
  // O arco-íris do controle e as bolinhas dos atalhos, nos tons de cada modo (calculados uma vez só)
  const swatches = useMemo(() => buildSwatches(), [])

  function chooseHue(value: number) {
    setAccentHue(value)
    setHue(value)
  }

  // Atalho marcado só quando a matiz é exatamente a dele; numa matiz livre, nenhum fica marcado
  const preset = ACCENT_PRESETS.find((item) => item.hue === hue)

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

      <div className="space-y-3">
        <Label id="accent-label">Cor de destaque</Label>
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          spacing={1}
          className="flex-wrap"
          aria-labelledby="accent-label"
          value={preset ? String(preset.hue) : ''}
          // Clicar no atalho já marcado devolve "": nada muda
          onValueChange={(value) => value && chooseHue(Number(value))}
        >
          {ACCENT_PRESETS.map((item) => (
            <ToggleGroupItem key={item.hue} value={String(item.hue)} className={`${selectedItem} px-3`}>
              <span
                className="size-3 rounded-full bg-(--swatch-light) dark:bg-(--swatch-dark)"
                style={swatches.dot(item.hue)}
                aria-hidden
              />
              {item.name}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <div className="space-y-1.5">
          <div className="text-muted-foreground flex justify-between text-sm">
            <label htmlFor="accent-hue">Ou escolha qualquer cor</label>
            <span className="tabular-nums" aria-hidden>
              {hue}°
            </span>
          </div>
          {/* Controle nativo (teclado e leitor de tela já funcionam); o fundo é o arco-íris do modo atual */}
          <input
            id="accent-hue"
            type="range"
            min={0}
            max={359}
            value={hue}
            aria-valuetext={`Matiz ${hue}°`}
            onChange={(event) => chooseHue(Number(event.target.value))}
            className="hue-slider h-3 w-full cursor-pointer appearance-none rounded-full bg-(image:--rainbow-light) dark:bg-(image:--rainbow-dark)"
            style={swatches.rainbow}
          />
        </div>
      </div>
    </div>
  )
}

/** Cores das bolinhas e do arco-íris, nos dois modos: o CSS escolhe a do modo atual (classe "dark" no <html>). */
function buildSwatches() {
  // Um ponto a cada 15°: o navegador faz a transição entre eles
  const stops = Array.from({ length: 25 }, (_, i) => accentPalette(i * 15))
  return {
    rainbow: {
      '--rainbow-light': `linear-gradient(to right, ${stops.map((p) => p.light.brand).join(', ')})`,
      '--rainbow-dark': `linear-gradient(to right, ${stops.map((p) => p.dark.brand).join(', ')})`,
    } as CSSProperties,
    dot: (hue: number) => {
      const palette = accentPalette(hue)
      return { '--swatch-light': palette.light.brand, '--swatch-dark': palette.dark.brand } as CSSProperties
    },
  }
}
