/**
 * Déclenche un redeploy Render sans modifier les variables.
 * Usage: cd backend && node scripts/trigger-render-deploy.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') })

const SERVICE_NAME = process.env.RENDER_SERVICE_NAME || 'memory-haven-api'
const API_KEY = process.env.RENDER_API_KEY || process.env.RENDER_API_TOKEN

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
  const body = text ? JSON.parse(text) : null
  if (!res.ok) throw new Error(`${options.method || 'GET'} ${path} → ${res.status}: ${JSON.stringify(body)}`)
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
      if (svc?.name === SERVICE_NAME || svc?.slug === SERVICE_NAME) return svc.id
    }
    cursor = page?.length ? page[page.length - 1]?.cursor : null
  } while (cursor)
  throw new Error(`Service "${SERVICE_NAME}" introuvable`)
}

async function main() {
  if (!API_KEY) {
    console.error('RENDER_API_KEY manquant dans backend/.env')
    process.exit(1)
  }
  const serviceId = await findServiceId()
  console.log(`Deploy ${SERVICE_NAME} (${serviceId})…`)
  await api(`/services/${serviceId}/deploys`, { method: 'POST', body: '{}' })
  console.log('OK — https://memory-haven-api.onrender.com/api/health')
}

main().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
