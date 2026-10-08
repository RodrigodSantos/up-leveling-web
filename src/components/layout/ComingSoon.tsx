/** Página provisória: cada tela é construída numa etapa do plano (F1 a F4). */
export function ComingSoon({ title, stage }: { title: string; stage: string }) {
  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-medium">{title}</h1>
      <p className="text-muted-foreground">Em construção ({stage}).</p>
    </section>
  )
}
