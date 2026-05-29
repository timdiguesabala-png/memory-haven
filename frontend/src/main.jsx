import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext'
import './index.css'
import './styles/famille-memoire-theme.css'

// Ancienne URL Vercel (build obsolète avec /upload/photo)
if (import.meta.env.PROD && window.location.hostname === 'frontend-one-ashen-17.vercel.app') {
  const target = 'https://memory-haven-frontend.vercel.app'
  window.location.replace(target + window.location.pathname + window.location.search)
}

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>
)