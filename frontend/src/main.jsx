import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext'
import './index.css'
import './styles/famille-memoire-theme.css'
import './styles/render-fixes.css'
import { purgeStalePwaCache } from './lib/appVersion.js'

// Ancienne URL Vercel (build obsolète avec /upload/photo)
if (import.meta.env.PROD && window.location.hostname === 'frontend-one-ashen-17.vercel.app') {
  const target = 'https://memory-haven-frontend.vercel.app'
  window.location.replace(target + window.location.pathname + window.location.search)
}

async function boot() {
  if (import.meta.env.PROD) {
    const reloaded = await purgeStalePwaCache()
    if (reloaded) {
      window.location.reload()
      return
    }
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
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