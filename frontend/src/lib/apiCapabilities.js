import api from '../services/api'

let cached = null

/**
 * Détecte les routes supportées par l’API (health / version Railway).
 * Évite les appels 404 vers auth/me/avatar sur les anciens déploiements.
 */
export async function getApiCapabilities({ force = false } = {}) {
  if (cached && !force) return cached

  const fallback = {
    version: null,
    profileAvatar: false,
    profileAvatarMultipart: false,
    authMe: false
  }

  try {
    const rep = await api.get('/health')
    const body = rep.data || {}
    const version = body.version || null
    const features = body.features || {}

    cached = {
      version,
      profileAvatar: features.profileAvatar === true || /profile|avatar/i.test(String(version)),
      profileAvatarMultipart:
        features.profileAvatarMultipart === true ||
        /profile-photo|avatar-multipart|18-/i.test(String(version)),
      authMe: features.authMe === true || /profile|avatar|17-|18-/i.test(String(version))
    }
  } catch {
    cached = fallback
  }

  return cached
}

export function resetApiCapabilitiesCache() {
  cached = null
}
