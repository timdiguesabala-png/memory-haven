import api from '../services/api'
import { clearPlatformLocalMode, markPlatformLocalMode } from './platformFallback'

let cached = null

/**
 * Détecte les routes supportées par l’API (health / version Railway).
 * Évite les appels 404 vers auth/me/avatar sur les anciens déploiements.
 */
export async function getApiCapabilities({ force = false } = {}) {
  if (cached && !force) return cached

  const fallback = {
    version: null,
    legacyHealth: true,
    profileAvatar: false,
    profileAvatarMultipart: false,
    authMe: false,
    platformPremium: false,
    membresFicheDetail: false
  }

  try {
    const rep = await api.get('/health')
    const body = rep.data || {}
    const version = body.version || null
    const features = body.features || {}

    const legacyHealth = !version && body.api === 'OK' && !body.features

    cached = {
      version,
      legacyHealth,
      profileAvatar: features.profileAvatar === true || /profile|avatar/i.test(String(version)),
      profileAvatarMultipart:
        features.profileAvatarMultipart === true ||
        /profile-photo|avatar-multipart|18-/i.test(String(version)),
      authMe: features.authMe === true || /profile|avatar|17-|18-/i.test(String(version)),
      platformPremium: features.platformPremium === true,
      membresFicheDetail:
        features.membresFicheDetail === true ||
        /fiche-membre-v21[3-9]|fiche-membre-v22/i.test(String(version))
    }

    if (cached.platformPremium) {
      clearPlatformLocalMode()
    }
  } catch {
    cached = fallback
    const base = import.meta.env.VITE_API_URL || ''
    if (base.includes('localhost') || base.includes('127.0.0.1')) {
      markPlatformLocalMode()
    }
  }

  return cached
}

export function resetApiCapabilitiesCache() {
  cached = null
}
