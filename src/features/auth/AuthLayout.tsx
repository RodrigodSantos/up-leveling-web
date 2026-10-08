import { TrendingUp } from 'lucide-react'
import type { ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

interface AuthLayoutProps {
  title: string
  description: string
  children: ReactNode
  footer: ReactNode
}

/** Moldura das telas de entrada: logo e um card no estilo "janela do Sistema". */
export function AuthLayout({ title, description, children, footer }: AuthLayoutProps) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 px-4 py-10">
      <div className="flex items-center gap-2 text-lg font-medium">
        <TrendingUp className="text-brand size-6" aria-hidden />
        Up Leveling
      </div>
      <Card className="system-panel w-full max-w-sm">
        <CardHeader>
          <span className="system-tag w-fit">[ SISTEMA ]</span>
          <CardTitle>
            <h1 className="mt-2 text-xl">{title}</h1>
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
        <CardFooter className="text-muted-foreground justify-center text-sm">{footer}</CardFooter>
      </Card>
    </main>
  )
}
