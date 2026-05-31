const PRODUCTION_SITE = 'https://memory-haven-frontend.vercel.app'

/** Corrige les vieux liens localhost renvoyés par une API non déployée. */
export function normalizeInviteLink(lien) {
  if (!lien || typeof lien !== 'string') return lien
  try {
    let url
    try {
      url = new URL(lien)
    } catch {
      url = new URL(lien, PRODUCTION_SITE)
    }
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
      const fixed = new URL(PRODUCTION_SITE)
      fixed.pathname = '/login'
      fixed.search = url.search
      url = fixed
    }
    const code = url.searchParams.get('code')
    if (code) url.searchParams.set('code', code.trim().toUpperCase())
    if (url.pathname === '/register') {
      url.pathname = '/login'
      url.searchParams.delete('mode')
    }
    return url.toString()
  } catch {
    return lien
  }
}

/** Lien d’invitation : page connexion (bouton rejoindre affiché uniquement là). */
export function buildInviteLinkFromCode(code, email, role = 'MEMBRE') {
  const params = new URLSearchParams({
    code: String(code).trim().toUpperCase()
  })
  if (email) params.set('email', email)
  if (role) params.set('role', role)
  return `${PRODUCTION_SITE}/login?${params.toString()}`
}

/** URL inscription « rejoindre » (depuis le bouton sur la page connexion). */
export function buildRegisterJoinUrl(code, email, role = 'MEMBRE') {
  const params = new URLSearchParams({
    mode: 'rejoindre',
    code: String(code).trim().toUpperCase()
  })
  if (email) params.set('email', email)
  if (role) params.set('role', role)
  return `/register?${params.toString()}`
}

export { PRODUCTION_SITE }
