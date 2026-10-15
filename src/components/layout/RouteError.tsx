import { RotateCw } from 'lucide-react'
import { Link, useRouteError } from 'react-router'
import { Button } from '@/components/ui/button'

/**
 * O navegador não conseguiu baixar o arquivo de uma tela (as telas são carregadas sob demanda).
 * Acontece quando a pessoa está com o app aberto durante um deploy: os arquivos novos têm outro nome,
 * e os antigos deixam de existir. Também acontece sem internet. A mensagem muda conforme o navegador.
 */
function isChunkLoadError(error: unknown): boolean {
  return (
    error instanceof Error &&
    /dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(
      error.message,
    )
  )
}

/**
 * Tela de erro das rotas: substitui a tela padrão do React Router (em inglês e sem estilo).
 * Dentro do app, aparece no lugar da tela e mantém o cabeçalho e o menu.
 */
export function RouteError() {
  const error = useRouteError()
  const chunk = isChunkLoadError(error)

  return (
    <section role="alert" className="system-panel bg-card mx-auto my-10 max-w-md space-y-4 rounded-lg p-6 text-center">
      <title>{`${chunk ? 'App atualizado' : 'Erro'} · Up Leveling`}</title>
      <span className="system-tag">[ SISTEMA ]</span>
      <h1 className="text-xl font-medium">{chunk ? 'O app foi atualizado' : 'Algo deu errado'}</h1>
      <p className="text-muted-foreground text-sm">
        {chunk
          ? 'Esta tela não pôde ser carregada: há uma versão nova publicada ou a conexão caiu. Recarregue para continuar.'
          : 'Esta tela encontrou um erro inesperado. Recarregue a página ou volte para o início.'}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button onClick={() => window.location.reload()}>
          <RotateCw aria-hidden />
          Recarregar
        </Button>
        {!chunk && (
          <Button asChild variant="outline">
            <Link to="/">Voltar para o início</Link>
          </Button>
        )}
      </div>
    </section>
  )
}
