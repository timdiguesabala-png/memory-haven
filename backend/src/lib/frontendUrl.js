/** URL publique du site (liens d'invitation) — jamais localhost en production. */
function getPublicFrontendUrl() {
  const url = process.env.FRONTEND_URL || ''
  if (url && !url.includes('localhost') && !url.includes('127.0.0.1')) {
    return url.replace(/\/$/, '')
  }
  return 'https://memory-haven-frontend.vercel.app'
}

function buildRegisterInviteUrl({ code, email, role }) {
  const base = getPublicFrontendUrl()
  const params = new URLSearchParams({
    mode: 'rejoindre',
    code: String(code).trim().toUpperCase()
  })
  if (email) params.set('email', email)
  if (role) params.set('role', role)
  return `${base}/register?${params.toString()}`
}

module.exports = { getPublicFrontendUrl, buildRegisterInviteUrl }
