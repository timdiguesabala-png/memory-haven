import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext'
import './styles/palette.css'
import './index.css'
import './styles/mirror-theme.css'
import './styles/feed-layout.css'
import './styles/render-fixes.css'
import './styles/mobile-fixes.css'
import './styles/haven-ui.css'
import './styles/contrast-light.css'
import './styles/page-transition.css'
import './styles/performance.css'
import { purgeStalePwaCache } from './lib/appVersion.js'

// Site prod unique (évite les anciens projets Vercel non mis à jour)
const PROD_SITE = 'https://memory-haven-frontend.vercel.app'
const PROD_HOST = 'memory-haven-frontend.vercel.app'
if (
  import.meta.env.PROD &&
  window.location.hostname.endsWith('.vercel.app') &&
  window.location.hostname !== PROD_HOST
) {
  window.location.replace(PROD_SITE + window.location.pathname + window.location.search)
}

async function boot() {
  if (import.meta.env.PROD) {
    const redirected = await purgeStalePwaCache()
    if (redirected) return
  }

  createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>
  )
}

boot()