/**
 * Copie les variables de backend/.env vers Railway (après `railway login`).
 * Usage: cd backend && node scripts/push-railway-env.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const { execSync } = require('child_process')

const KEYS = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'DATABASE_URL',
  'JWT_SECRET',
  'FRONTEND_URL',
  'NODE_ENV'
]

const missing = KEYS.filter((k) => !process.env[k] && k !== 'FRONTEND_URL' && k !== 'NODE_ENV')
if (missing.length) {
  console.error('Manquant dans backend/.env:', missing.join(', '))
  process.exit(1)
}

if (!process.env.FRONTEND_URL) {
  process.env.FRONTEND_URL = 'https://memory-haven-frontend.vercel.app'
}
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production'
}

for (const key of KEYS) {
  const value = process.env[key]
  if (!value) continue
  const escaped = value.replace(/"/g, '\\"')
  console.log(`→ ${key}`)
  execSync(`npx @railway/cli variables set ${key}="${escaped}"`, {
    stdio: 'inherit',
    cwd: require('path').join(__dirname, '..')
  })
}

console.log('\n✅ Variables envoyées. Lancez: npx @railway/cli up')
console.log('   Puis testez: https://memory-haven-api-production.up.railway.app/api/health')
