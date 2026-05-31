import api from './api'
import { uploadFilesToCloudinary } from './cloudinaryClient'
import { compressImageIfNeeded } from '../lib/compressImage'
import { getStoredUser, updateStoredUser } from '../lib/userStorage'
import { getApiCapabilities } from '../lib/apiCapabilities'

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

function isRouteMissing(err) {
  const status = err.response?.status
  const msg = err.response?.data?.message
  return status === 404 && (msg === 'Route introuvable' || msg === 'Not Found')
}

function profileError(err, fallback) {
  const message =
    err.userMessage ||
    err.response?.data?.message ||
    err.message ||
    fallback
  const e = new Error(message)
  e.userMessage = message
  return e
}

function extractProfilePayload(rep) {
  const body = rep?.data
  return body?.data ?? body?.utilisateur ?? body
}

function persistAvatarLocalOnly(url) {
  const stored = getStoredUser() || {}
  const data = { ...stored, avatar_url: url || null }
  updateStoredUser({ avatar_url: data.avatar_url })
  data._avatarLocalOnly = true
  return data
}

function throwLocalOnlyWarning(data) {
  const err = profileError(
    { message: 'API Railway pas à jour' },
    'Photo enregistrée sur cet appareil seulement. Ouvrez Railway → service API → Redeploy, puis vérifiez /api/health (version 18-profile-photo-multipart). Guide : RAILWAY-API-MISE-A-JOUR.md'
  )
  err.profileData = data
  err.localOnly = true
  throw err
}

async function persistAvatarUrl(url, caps) {
  if (!caps.profileAvatar) {
    return persistAvatarLocalOnly(url)
  }

  const body = { avatar_url: url || null }
  const attempts = [
    () => api.put('/membres/me/avatar', body)
  ]

  if (caps.authMe) {
    attempts.push(() => api.put('/auth/me/avatar', body))
  }

  attempts.push(() => api.put('/membres/me', body))

  let lastErr
  for (const call of attempts) {
    try {
      const rep = await call()
      const data = extractProfilePayload(rep)
      if (!data || (data.avatar_url === undefined && url)) {
        throw new Error('Réponse serveur invalide')
      }
      updateStoredUser({ avatar_url: data.avatar_url ?? null })
      return data
    } catch (err) {
      lastErr = err
      if (!isRouteMissing(err)) throw profileError(err, 'Mise à jour de la photo impossible')
    }
  }

  return persistAvatarLocalOnly(url)
}

async function uploadProfilePhotoMultipart(file) {
  const form = new FormData()
  form.append('file', file)
  const rep = await api.post('/membres/me/avatar', form)
  const data = extractProfilePayload(rep)
  if (!data) throw new Error('Réponse serveur invalide')
  updateStoredUser({ avatar_url: data.avatar_url ?? null })
  return data
}

async function uploadProfilePhotoLegacyServer(file, caps) {
  const form = new FormData()
  form.append('fichier', file)
  form.append('file', file)
  const rep = await api.post('/upload/photo', form)
  const url = rep.data?.fichier_url
  if (!url) throw new Error('Upload photo sans URL')
  return persistAvatarUrl(url, caps)
}

async function uploadViaCloudinaryThenPersist(file, caps) {
  const [url] = await uploadFilesToCloudinary([file], 'PHOTO', 'memory_haven/avatars')
  const data = await persistAvatarUrl(url, caps)
  if (data._avatarLocalOnly) throwLocalOnlyWarning(data)
  return data
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
    /* API partielle */
  }

  return { utilisateur: stored, famille_stats }
}

export async function uploadProfilePhoto(file) {
  const caps = await getApiCapabilities()
  const prepared = await compressImageIfNeeded(file)

  if (caps.profileAvatarMultipart) {
    try {
      const data = await uploadProfilePhotoMultipart(prepared)
      if (data._avatarLocalOnly) throwLocalOnlyWarning(data)
      return data
    } catch (apiErr) {
      if (apiErr.localOnly) throw apiErr
      if (!isRouteMissing(apiErr) && apiErr.response?.status !== 404) {
        throw profileError(apiErr, 'Impossible d’envoyer la photo')
      }
    }
  }

  // Cloudinary navigateur en priorité (API Railway ancienne → /upload/photo souvent en 500)
  try {
    return await uploadViaCloudinaryThenPersist(prepared, caps)
  } catch (cloudErr) {
    if (cloudErr.localOnly) throw cloudErr
  }

  try {
    const data = await uploadProfilePhotoLegacyServer(prepared, caps)
    if (data._avatarLocalOnly) throwLocalOnlyWarning(data)
    return data
  } catch (serverErr) {
    if (serverErr.localOnly) throw serverErr
    throw profileError(
      serverErr,
      'Upload photo impossible. Vérifiez la connexion ou réessayez après mise à jour de l’API.'
    )
  }
}

export async function removeProfilePhoto() {
  const caps = await getApiCapabilities()

  if (!caps.profileAvatar) {
    return persistAvatarLocalOnly(null)
  }

  const attempts = [() => api.delete('/membres/me/avatar')]
  if (caps.authMe) {
    attempts.push(() => api.delete('/auth/me/avatar'))
  }

  for (const call of attempts) {
    try {
      const rep = await call()
      const data = extractProfilePayload(rep)
      updateStoredUser({ avatar_url: data?.avatar_url ?? null })
      return data
    } catch (err) {
      if (!isRouteMissing(err)) throw profileError(err, 'Erreur lors de la suppression')
    }
  }

  return persistAvatarLocalOnly(null)
}

export async function updateProfile(fields) {
  const caps = await getApiCapabilities()
  if (!caps.profileAvatar) {
    throw profileError(
      { message: 'Route introuvable' },
      'Mise à jour du profil indisponible : redéployez l’API Railway (version 18).'
    )
  }
  const rep = await api.put('/membres/me', fields)
  const data = extractProfilePayload(rep)
  updateStoredUser(data)
  return data
}

export async function changePassword(current_password, new_password) {
  const caps = await getApiCapabilities()
  if (!caps.profileAvatar) {
    throw profileError(
      { message: 'Route introuvable' },
      'Changement de mot de passe indisponible : redéployez l’API Railway (version 18).'
    )
  }
  const rep = await api.put('/membres/me/password', { current_password, new_password })
  return rep.data
}

export async function refreshCurrentUser() {
  const caps = await getApiCapabilities()

  if (authMeUnavailable() || !caps.authMe) {
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
