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
      fixed.pathname = '/register'
      fixed.search = url.search
      url = fixed
    }
    if (!url.searchParams.has('mode')) {
      url.searchParams.set('mode', 'rejoindre')
    }
    const code = url.searchParams.get('code')
    if (code) url.searchParams.set('code', code.trim().toUpperCase())
    return url.toString()
  } catch {
    return lien
  }
}

export function buildInviteLinkFromCode(code, email, role = 'MEMBRE') {
  const params = new URLSearchParams({
    mode: 'rejoindre',
    code: String(code).trim().toUpperCase()
  })
  if (email) params.set('email', email)
  if (role) params.set('role', role)
  return `${PRODUCTION_SITE}/register?${params.toString()}`
}

export { PRODUCTION_SITE }
