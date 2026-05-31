import api from '../services/api'

export async function fetchAccueil() {
  const rep = await api.get('/platform/accueil')
  return rep.data.data
}

export async function fetchAlbumsAuto() {
  const rep = await api.get('/platform/albums-auto')
  return rep.data.data
}

export async function fetchHeritage(type) {
  const rep = await api.get('/platform/heritage', { params: type ? { type } : {} })
  return rep.data.data
}

export async function createHeritage(payload) {
  const rep = await api.post('/platform/heritage', payload)
  return rep.data.data
}

export async function deleteHeritage(id) {
  await api.delete(`/platform/heritage/${id}`)
}

export async function fetchHommage() {
  const rep = await api.get('/platform/hommage')
  return rep.data.data
}

export async function postHommageMessage(membreId, payload) {
  const rep = await api.post(`/platform/hommage/${membreId}/messages`, payload)
  return rep.data.data
}

export async function fetchCapsules() {
  const rep = await api.get('/platform/capsules')
  return rep.data.data
}

export async function createCapsule(payload) {
  const rep = await api.post('/platform/capsules', payload)
  return rep.data.data
}

export async function fetchTimeline() {
  const rep = await api.get('/platform/timeline')
  return rep.data.data
}

export async function fetchCarte() {
  const rep = await api.get('/platform/carte')
  return rep.data.data
}

export async function fetchLivreData() {
  const rep = await api.get('/platform/livre')
  return rep.data.data
}

export async function fetchEvenements() {
  const rep = await api.get('/platform/evenements')
  return rep.data.data
}

export async function createEvenement(payload) {
  const rep = await api.post('/platform/evenements', payload)
  return rep.data.data
}

export async function suggestTags(titre, description) {
  const rep = await api.post('/platform/ai/suggest-tags', { titre, description })
  return rep.data.data?.tags || []
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
  const rep = await api.get('/platform/search', { params })
  return rep.data.data || []
}

export async function askArchives(question) {
  const rep = await api.post('/platform/ai/ask', { question })
  return rep.data.data
}

export async function enable2FA() {
  return setup2FA()
}
