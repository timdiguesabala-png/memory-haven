import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext'
import './index.css'
import './styles/mirror-theme.css'
import './styles/feed-layout.css'
import './styles/render-fixes.css'
import './styles/mobile-fixes.css'
import { purgeStalePwaCache } from './lib/appVersion.js'

// Anciennes URLs Vercel (projets obsolètes, build non mis à jour via git)
const PROD_SITE = 'https://memory-haven-frontend.vercel.app'
const OLD_HOSTS = new Set([
  'frontend-one-ashen-17.vercel.app',
  'frontend-one-smoky-93.vercel.app',
  'memoryhaven-two.vercel.app'
])
if (import.meta.env.PROD && OLD_HOSTS.has(window.location.hostname)) {
  window.location.replace(PROD_SITE + window.location.pathname + window.location.search)
}

async function boot() {
  if (import.meta.env.PROD) {
    const reloaded = await purgeStalePwaCache()
    if (reloaded) {
      window.location.reload()
      return
    }
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