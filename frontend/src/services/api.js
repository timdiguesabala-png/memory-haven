import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api'
})

function messageFromError(error) {
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
