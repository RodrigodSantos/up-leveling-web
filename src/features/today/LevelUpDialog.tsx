import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface LevelUpDialogProps {
  /** Nível alcançado; null = janela fechada. */
  level: number | null
  onClose: () => void
}

/** A janela do Sistema anunciando o novo nível. */
export function LevelUpDialog({ level, onClose }: LevelUpDialogProps) {
  return (
    <Dialog open={level !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="system-panel text-center sm:max-w-sm">
        <DialogHeader className="items-center">
          <span className="system-tag">[ SISTEMA ]</span>
          <DialogTitle className="mt-3 text-2xl">Você subiu para o nível {level}!</DialogTitle>
          <DialogDescription>Continue cumprindo suas missões para ficar ainda mais forte.</DialogDescription>
        </DialogHeader>
        <div className="border-brand text-brand mx-auto flex size-24 flex-col items-center justify-center rounded-xl border-2 leading-none">
          <span className="text-muted-foreground text-xs">NÍVEL</span>
          <span className="text-5xl font-medium">{level}</span>
        </div>
        <DialogFooter className="sm:justify-center">
          <Button onClick={onClose}>Continuar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
