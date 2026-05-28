import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api'
})

function isLocalDevApi() {
  const base = import.meta.env.VITE_API_URL || '/api'
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
      return 'Le serveur a renvoyé une page HTML au lieu de JSON. Redéployez l’API Railway (dernier commit).'
    }
    return data.slice(0, 200)
  }
  if (data?.message) return data.message
  return error.message || 'Erreur réseau'
}

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
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
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('utilisateur')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
