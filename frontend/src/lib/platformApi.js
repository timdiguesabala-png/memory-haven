import api from '../services/api'
import {
  markPlatformLocalMode,
  fallbackFetchAccueil,
  fallbackFetchAlbumsAuto,
  fallbackFetchHeritage,
  fallbackCreateHeritage,
  fallbackDeleteHeritage,
  fallbackFetchHommage,
  fallbackPostHommageMessage,
  fallbackFetchCapsules,
  fallbackCreateCapsule,
  fallbackFetchTimeline,
  fallbackCreateEvenement,
  fallbackFetchCarte,
  fallbackFetchLivreData,
  fallbackFetchEvenements
} from './platformFallback'

function platformUnavailable(err) {
  const status = err?.response?.status
  if (status === 404 || status === 502 || status === 503) return true
  if (!err?.response && err?.message?.includes('Network')) return true
  return false
}

async function withPlatformFallback(apiCall, fallback) {
  try {
    return await apiCall()
  } catch (err) {
    if (platformUnavailable(err)) {
      markPlatformLocalMode()
      return fallback()
    }
    throw err
  }
}

export async function fetchAccueil() {
  return withPlatformFallback(async () => {
    const rep = await api.get('/platform/accueil')
    return rep.data.data
  }, fallbackFetchAccueil)
}

export async function fetchAlbumsAuto() {
  return withPlatformFallback(async () => {
    const rep = await api.get('/platform/albums-auto')
    return rep.data.data
  }, fallbackFetchAlbumsAuto)
}

export async function fetchHeritage(type) {
  return withPlatformFallback(async () => {
    const rep = await api.get('/platform/heritage', { params: type ? { type } : {} })
    return rep.data.data
  }, () => fallbackFetchHeritage(type))
}

export async function createHeritage(payload) {
  return withPlatformFallback(async () => {
    const rep = await api.post('/platform/heritage', payload)
    return rep.data.data
  }, () => fallbackCreateHeritage(payload))
}

export async function deleteHeritage(id) {
  return withPlatformFallback(async () => {
    await api.delete(`/platform/heritage/${id}`)
  }, () => fallbackDeleteHeritage(id))
}

export async function fetchHommage() {
  return withPlatformFallback(async () => {
    const rep = await api.get('/platform/hommage')
    return rep.data.data
  }, fallbackFetchHommage)
}

export async function postHommageMessage(membreId, payload) {
  return withPlatformFallback(async () => {
    const rep = await api.post(`/platform/hommage/${membreId}/messages`, payload)
    return rep.data.data
  }, () => fallbackPostHommageMessage(membreId, payload))
}

export async function fetchCapsules() {
  return withPlatformFallback(async () => {
    const rep = await api.get('/platform/capsules')
    return rep.data.data
  }, fallbackFetchCapsules)
}

export async function createCapsule(payload) {
  return withPlatformFallback(async () => {
    const rep = await api.post('/platform/capsules', payload)
    return rep.data.data
  }, () => fallbackCreateCapsule(payload))
}

export async function fetchTimeline() {
  return withPlatformFallback(async () => {
    const rep = await api.get('/platform/timeline')
    return rep.data.data
  }, fallbackFetchTimeline)
}

export async function fetchCarte() {
  return withPlatformFallback(async () => {
    const rep = await api.get('/platform/carte')
    return rep.data.data
  }, fallbackFetchCarte)
}

export async function fetchLivreData() {
  return withPlatformFallback(async () => {
    const rep = await api.get('/platform/livre')
    return rep.data.data
  }, fallbackFetchLivreData)
}

export async function fetchEvenements() {
  return withPlatformFallback(async () => {
    const rep = await api.get('/platform/evenements')
    return rep.data.data
  }, fallbackFetchEvenements)
}

export async function createEvenement(payload) {
  return withPlatformFallback(async () => {
    const rep = await api.post('/platform/evenements', payload)
    return rep.data.data
  }, () => fallbackCreateEvenement(payload))
}

export async function suggestTags(titre, description) {
  try {
    const rep = await api.post('/platform/ai/suggest-tags', { titre, description })
    return rep.data.data?.tags || []
  } catch {
    const words = `${titre || ''} ${description || ''}`
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 3)
    return [...new Set(words)].slice(0, 5)
  }
}

export async function fetchJournal() {
  const rep = await api.get('/platform/journal')
  return rep.data.data
}

export async function fetch2FAStatus() {
  const rep = await api.get('/platform/securite/2fa')
  return rep.data.data
}

export async function setup2FA() {
  const rep = await api.post('/platform/securite/2fa/setup')
  return rep.data.data
}

export async function confirm2FA(code) {
  const rep = await api.post('/platform/securite/2fa/confirm', { code })
  return rep.data
}

export async function disable2FA(code, password) {
  const rep = await api.post('/platform/securite/2fa/disable', { code, password })
  return rep.data
}

export async function verify2FALogin(pending_token, totp_code) {
  const rep = await api.post('/auth/2fa/verify', { pending_token, totp_code })
  return rep.data
}

export async function searchSouvenirs(params) {
  try {
    const rep = await api.get('/platform/search', { params })
    return rep.data.data || []
  } catch (err) {
    if (!platformUnavailable(err)) throw err
    markPlatformLocalMode()
    const rep = await api.get('/souvenirs', { params: { limit: 100 } })
    let list = rep.data.data || []
    const q = (params?.q || '').toLowerCase().trim()
    if (q) {
      list = list.filter(
        (s) =>
          s.titre?.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q) ||
          s.lieu?.toLowerCase().includes(q)
      )
    }
    if (params?.type && params.type !== 'TOUS') {
      list = list.filter((s) => s.type === params.type)
    }
    return list.slice(0, params?.limit || 80)
  }
}

export async function askArchives(question) {
  try {
    const rep = await api.post('/platform/ai/ask', { question })
    return rep.data.data
  } catch (err) {
    if (!platformUnavailable(err)) throw err
    markPlatformLocalMode()
    const list = await searchSouvenirs({ q: question, limit: 10 })
    return {
      answer:
        list.length > 0
          ? `J’ai trouvé ${list.length} souvenir(s) lié(s) à votre question (mode hors ligne).`
          : 'Assistant indisponible — essayez des mots-clés dans la recherche du fil.',
      results: list
    }
  }
}

export async function enable2FA() {
  return setup2FA()
}

export { isPlatformLocalMode } from './platformFallback'
