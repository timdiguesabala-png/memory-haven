/** Site public — liens d'invitation (jamais localhost). */
const PRODUCTION_SITE = 'https://memory-haven-frontend.vercel.app'

function getPublicFrontendUrl() {
  const override = process.env.INVITE_LINK_BASE_URL || process.env.FRONTEND_URL || ''
  if (
    override &&
    !override.includes('localhost') &&
    !override.includes('127.0.0.1') &&
    override.startsWith('https://')
  ) {
    return override.replace(/\/$/, '')
  }
  return PRODUCTION_SITE
}

function buildRegisterInviteUrl({ code, email, role }) {
  const base = PRODUCTION_SITE
  const params = new URLSearchParams({
    mode: 'rejoindre',
    code: String(code).trim().toUpperCase()
  })
  if (email) params.set('email', String(email).trim())
  if (role) params.set('role', role)
  return `${base}/register?${params.toString()}`
}

module.exports = { getPublicFrontendUrl, buildRegisterInviteUrl, PRODUCTION_SITE }
