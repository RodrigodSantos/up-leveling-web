import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { ApiError } from '@/lib/api/api-error'
import { ACCENT_PRESETS } from '@/lib/theme/accent'
import { accentColorsKey, fetchAccentColors, MAX_SAVED_COLORS, saveAccentColors } from './api'
import { swatchStyle } from './swatches'

interface SavedAccentColorsProps {
  /** Matiz escolhida agora (no arco-íris, num atalho ou numa cor salva) */
  hue: number
  onChoose: (hue: number) => void
  /** Conta demo: mostra as cores salvas, mas não deixa salvar nem remover */
  locked: boolean
}

const selectedItem = 'data-[state=on]:border-brand data-[state=on]:bg-brand/15 data-[state=on]:text-brand'

/**
 * Até 5 cores salvas na conta, além das 5 padrão. Ficam na API (e não no navegador, como o resto da Aparência):
 * seguem a pessoa em qualquer aparelho. A cor escolhida no momento continua só neste navegador.
 */
export function SavedAccentColors({ hue, onChoose, locked }: SavedAccentColorsProps) {
  const queryClient = useQueryClient()
  const saved = useQuery({ queryKey: accentColorsKey, queryFn: fetchAccentColors })
  const save = useMutation({
    mutationFn: saveAccentColors,
    // A resposta já é a lista nova: vai direto para o cache, sem buscar de novo
    onSuccess: (response) => queryClient.setQueryData(accentColorsKey, response),
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : 'Não foi possível salvar. Tente de novo.'),
  })

  if (saved.isPending) {
    return <Skeleton className="h-16" aria-label="Carregando suas cores" />
  }
  if (saved.isError) {
    return (
      <div role="alert" className="border-destructive/50 space-y-2 rounded-lg border p-3 text-sm">
        <p>Não foi possível carregar suas cores. {saved.error.message}</p>
        <Button variant="outline" size="sm" onClick={() => saved.refetch()}>
          Tentar de novo
        </Button>
      </div>
    )
  }

  const hues = saved.data.hues
  const isPreset = ACCENT_PRESETS.some((preset) => preset.hue === hue)
  const isSaved = hues.includes(hue)
  const full = hues.length >= MAX_SAVED_COLORS

  function add() {
    save.mutate([...hues, hue], { onSuccess: () => toast.success(`Cor salva: ${hue}°`) })
  }

  function remove() {
    save.mutate(
      hues.filter((h) => h !== hue),
      { onSuccess: () => toast(`Cor removida: ${hue}°`) },
    )
  }

  return (
    <div className="space-y-2">
      <div className="text-muted-foreground flex justify-between text-sm">
        <span id="saved-colors-label">Suas cores</span>
        <span className="tabular-nums">
          {hues.length} de {MAX_SAVED_COLORS}
        </span>
      </div>

      {hues.length > 0 ? (
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          spacing={1}
          className="flex-wrap"
          aria-labelledby="saved-colors-label"
          value={isSaved ? String(hue) : ''}
          // Clicar na cor já marcada devolve "": nada muda
          onValueChange={(value) => value && onChoose(Number(value))}
        >
          {hues.map((savedHue) => (
            <ToggleGroupItem
              key={savedHue}
              value={String(savedHue)}
              className={`${selectedItem} px-3 tabular-nums`}
              aria-label={`Cor salva: matiz ${savedHue}°`}
            >
              <span
                className="size-3 rounded-full bg-(--swatch-light) dark:bg-(--swatch-dark)"
                style={swatchStyle(savedHue)}
                aria-hidden
              />
              {savedHue}°
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      ) : (
        <p className="text-muted-foreground text-sm">Nenhuma ainda: escolha uma cor no arco-íris e salve aqui.</p>
      )}

      {locked ? (
        <p className="text-muted-foreground text-xs">
          Na conta de demonstração, as cores salvas não podem ser alteradas.
        </p>
      ) : isSaved ? (
        <Button variant="ghost" size="sm" disabled={save.isPending} onClick={remove}>
          <Trash2 aria-hidden />
          Remover esta cor
        </Button>
      ) : (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Button variant="outline" size="sm" disabled={isPreset || full || save.isPending} onClick={add}>
            <Plus aria-hidden />
            Salvar esta cor
          </Button>
          {/* Explica o botão desligado, em vez de deixar a pessoa adivinhar */}
          {isPreset && <span className="text-muted-foreground text-xs">Esta já é uma das cores padrão.</span>}
          {!isPreset && full && (
            <span className="text-muted-foreground text-xs">Limite de 5: remova uma para salvar outra.</span>
          )}
        </div>
      )}
    </div>
  )
}
