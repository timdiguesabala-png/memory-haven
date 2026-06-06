import axios from 'axios'
import { getSupabase, isSupabaseMode } from '../lib/supabaseClient'

const apiBase = (import.meta.env.VITE_API_URL || '').trim()

const api = axios.create({
  baseURL: apiBase || '/api'
})

/** API Express externe configurée (Render, local…) — pas requise en mode Supabase pur. */
export function hasExpressApi() {
  const base = apiBase || '/api'
  if (isSupabaseMode() && !apiBase) return false
  return !base.startsWith('/') || import.meta.env.DEV
}

function isLocalDevApi() {
  const base = apiBase || '/api'
  return !import.meta.env.PROD || base.includes('localhost') || base.startsWith('/')
}

function messageFromError(error) {
  if (!error.response) {
    if (isLocalDevApi()) {
      return "L'API locale ne répond pas. Lancez 2-API.bat (fenêtre « Memory Haven - API » sur le port 3000), puis réessayez."
    }
    return 'Serveur inaccessible. Vérifiez votre connexion internet.'
  }

  const status = error.response.status
  if (status === 502 || status === 503 || status === 504) {
    if (isLocalDevApi()) {
      return "Erreur 502 : l'API n'est pas démarrée. Double-clic sur 2-API.bat, attendez « Serveur démarré sur http://localhost:3000 », puis relancez l'inscription."
    }
    return 'Le serveur est temporairement indisponible (502). Réessayez dans quelques instants.'
  }

  const data = error.response?.data
  if (typeof data === 'string') {
    if (data.trimStart().startsWith('<')) {
      return 'Le serveur a renvoyé une page HTML au lieu de JSON. Vérifiez l’URL API (Render) ou utilisez le mode Supabase seul.'
    }
    return data.slice(0, 200)
  }
  if (data?.message) return data.message
  return error.message || 'Erreur réseau'
}

api.interceptors.request.use(
  async (config) => {
    if (isSupabaseMode() && !hasExpressApi()) {
      return Promise.reject(
        Object.assign(new Error('Module nécessitant l’API Express — déployez Render ou ignorez.'), {
          userMessage: 'Ce module utilise encore l’API optionnelle (albums, arbre…). Le fil et la discussion fonctionnent via Supabase.',
          skipAuthRedirect: true
        })
      )
    }
    if (isSupabaseMode()) {
      const sb = getSupabase()
      const { data } = await sb.auth.getSession()
      if (data.session?.access_token) {
        config.headers.Authorization = `Bearer ${data.session.access_token}`
      }
    } else {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    error.userMessage = messageFromError(error)
    const status = error.response?.status
    if (status === 401 && !error.skipAuthRedirect) {
      if (isSupabaseMode()) {
        /* Ne pas déconnecter si l’API Express (Render) rejette le token Supabase */
        return Promise.reject(error)
      }
      localStorage.removeItem('token')
      localStorage.removeItem('utilisateur')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
