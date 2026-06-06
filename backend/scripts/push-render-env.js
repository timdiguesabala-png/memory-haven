/**
 * Copie backend/.env vers Render (API REST).
 * Prérequis : RENDER_API_KEY dans backend/.env ou variable d'environnement.
 * Render → Account Settings → API Keys
 *
 * Usage: cd backend && node scripts/push-render-env.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') })

const SERVICE_NAME = process.env.RENDER_SERVICE_NAME || 'memory-haven-api'
const API_KEY = process.env.RENDER_API_KEY || process.env.RENDER_API_TOKEN

const KEYS = [
  'NODE_ENV',
  'DATABASE_URL',
  'DIRECT_URL',
  'JWT_SECRET',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_STORAGE_BUCKET',
  'FRONTEND_URL',
  'PUBLIC_API_URL',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'MAIL_FROM'
]

async function api(path, options = {}) {
  const res = await fetch(`https://api.render.com/v1${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  })
  const text = await res.text()
  let body
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = text
  }
  if (!res.ok) {
    throw new Error(`${options.method || 'GET'} ${path} → ${res.status}: ${JSON.stringify(body)}`)
  }
  return body
}

async function findServiceId() {
  if (process.env.RENDER_SERVICE_ID) return process.env.RENDER_SERVICE_ID
  let cursor
  do {
    const q = new URLSearchParams({ limit: '100', ...(cursor ? { cursor } : {}) })
    const page = await api(`/services?${q}`)
    for (const item of page || []) {
      const svc = item.service || item
      if (svc?.name === SERVICE_NAME || svc?.slug === SERVICE_NAME) {
        return svc.id
      }
    }
    cursor = page?.length ? page[page.length - 1]?.cursor : null
  } while (cursor)
  throw new Error(`Service "${SERVICE_NAME}" introuvable sur Render`)
}

async function main() {
  if (!API_KEY) {
    console.error('❌ RENDER_API_KEY manquant.')
    console.error('   Render → Account Settings → API Keys → copiez dans backend/.env')
    process.exit(1)
  }

  if (!process.env.NODE_ENV) process.env.NODE_ENV = 'production'
  if (!process.env.FRONTEND_URL) {
    process.env.FRONTEND_URL = 'https://memory-haven-frontend.vercel.app'
  }
  if (!process.env.PUBLIC_API_URL) {
    process.env.PUBLIC_API_URL = 'https://memory-haven-api.onrender.com'
  }
  if (!process.env.SUPABASE_STORAGE_BUCKET) {
    process.env.SUPABASE_STORAGE_BUCKET = 'memory-haven'
  }

  const missing = ['DATABASE_URL', 'DIRECT_URL', 'JWT_SECRET', 'SUPABASE_URL'].filter(
    (k) => !process.env[k]
  )
  if (missing.length) {
    console.error('❌ Manquant dans backend/.env:', missing.join(', '))
    process.exit(1)
  }

  const serviceId = await findServiceId()
  console.log(`Service: ${SERVICE_NAME} (${serviceId})`)

  const payload = KEYS.filter((k) => process.env[k]).map((key) => ({
    key,
    value: process.env[key]
  }))

  for (const { key } of payload) {
    console.log(`→ ${key}`)
  }

  await api(`/services/${serviceId}/env-vars`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  })

  console.log('\n✅ Variables Render mises à jour. Redéploiement en cours…')
  await api(`/services/${serviceId}/deploys`, { method: 'POST', body: '{}' })
  console.log('✅ Deploy déclenché.')
  console.log('   Test: https://memory-haven-api.onrender.com/api/health')
}

main().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
