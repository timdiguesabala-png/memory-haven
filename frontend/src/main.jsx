import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext'
import './index.css'

// Ancienne URL Vercel (build obsolète avec /upload/photo)
if (import.meta.env.PROD && window.location.hostname === 'frontend-one-ashen-17.vercel.app') {
  const target = 'https://memory-haven-frontend.vercel.app'
  window.location.replace(target + window.location.pathname + window.location.search)
}

// Ajoute la balise viewport pour le responsive mobile
const meta = document.createElement('meta')
meta.name = 'viewport'
meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=yes'
document.head.appendChild(meta)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>
)