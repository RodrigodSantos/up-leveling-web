import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { AppProviders } from '@/app/AppProviders'
import { queryClient } from '@/app/query-client'
import { router } from '@/app/router'
import './index.css'

// Ponto de entrada: monta o app dentro da <div id="root"> do index.html
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders queryClient={queryClient}>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>,
)
