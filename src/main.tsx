import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { AppProviders } from '@/app/AppProviders'
import { queryClient } from '@/app/query-client'
import { router } from '@/app/router'
import { ACCENT_VARS_STORAGE_KEY, getAccentHue, setAccentHue } from '@/lib/theme/accent'
import './index.css'

// Quem escolheu a cor antes da matiz livre só tem o nome salvo ("red"): calcula as cores uma vez
try {
  if (localStorage.getItem(ACCENT_VARS_STORAGE_KEY) === null) setAccentHue(getAccentHue())
} catch {
  // Sem acesso ao localStorage (ex.: navegação privada bloqueada): fica o azul padrão
}

// Ponto de entrada: monta o app dentro da <div id="root"> do index.html
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders queryClient={queryClient}>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>,
)
