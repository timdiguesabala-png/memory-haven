import api from './api'
import { uploadFilesToCloudinary } from './cloudinaryClient'
import { getStoredUser, updateStoredUser } from '../lib/userStorage'

const AUTH_ME_KEY = 'mh-auth-me-supported'

function authMeUnavailable() {
  return sessionStorage.getItem(AUTH_ME_KEY) === '0'
}

function markAuthMeUnavailable() {
  sessionStorage.setItem(AUTH_ME_KEY, '0')
}

function markAuthMeAvailable() {
  sessionStorage.setItem(AUTH_ME_KEY, '1')
}

async function fallbackFromStorage() {
  const stored = getStoredUser()
  if (!stored?.email && !stored?.id) {
    throw new Error('Session locale invalide')
  }

  let famille_stats = null
  try {
    const [souvenirsRep, membresRep] = await Promise.all([
      api.get('/souvenirs'),
      api.get('/membres')
    ])
    const souvenirs = souvenirsRep.data?.data ?? souvenirsRep.data ?? []
    const membres = membresRep.data?.data ?? membresRep.data ?? []
    famille_stats = {
      souvenirs: Array.isArray(souvenirs) ? souvenirs.length : 0,
      membres: Array.isArray(membres) ? membres.length : 0
    }
  } catch {
    /* API partielle — on garde le profil local */
  }

  return { utilisateur: stored, famille_stats }
}

export async function uploadProfilePhoto(file) {
  const [url] = await uploadFilesToCloudinary([file], 'PHOTO', 'memory_haven/avatars')
  const rep = await api.put('/membres/me/avatar', { avatar_url: url })
  const data = rep.data.data
  updateStoredUser({ avatar_url: data.avatar_url })
  return data
}

export async function removeProfilePhoto() {
  const rep = await api.delete('/membres/me/avatar')
  const data = rep.data.data
  updateStoredUser({ avatar_url: null })
  return data
}

export async function updateProfile(fields) {
  const rep = await api.put('/membres/me', fields)
  const data = rep.data.data
  updateStoredUser(data)
  return data
}

export async function changePassword(current_password, new_password) {
  const rep = await api.put('/membres/me/password', { current_password, new_password })
  return rep.data
}

export async function refreshCurrentUser() {
  if (authMeUnavailable()) {
    return fallbackFromStorage()
  }

  try {
    const rep = await api.get('/auth/me')
    markAuthMeAvailable()
    const u = rep.data.utilisateur
    updateStoredUser(u)
    return {
      utilisateur: u,
      famille_stats: rep.data.famille_stats || null
    }
  } catch (err) {
    const status = err.response?.status
    const routeMissing =
      status === 404 &&
      (err.response?.data?.message === 'Route introuvable' || !err.response?.data?.utilisateur)

    if (routeMissing) {
      markAuthMeUnavailable()
      return fallbackFromStorage()
    }

    if (status === 404 && err.response?.data?.message === 'Utilisateur introuvable') {
      throw err
    }

    if (status === 401) throw err

    const stored = getStoredUser()
    if (stored?.email) {
      return { utilisateur: stored, famille_stats: null }
    }
    throw err
  }
}
