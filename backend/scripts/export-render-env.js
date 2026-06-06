/**
 * Génère backend/.render-import.env pour import manuel Render (Add from .env).
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const fs = require('fs')
const path = require('path')

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
  'CLOUDINARY_API_SECRET'
]

if (!process.env.NODE_ENV) process.env.NODE_ENV = 'production'
if (!process.env.PUBLIC_API_URL) process.env.PUBLIC_API_URL = 'https://memory-haven-api.onrender.com'
if (!process.env.SUPABASE_STORAGE_BUCKET) process.env.SUPABASE_STORAGE_BUCKET = 'memory-haven'
if (!process.env.FRONTEND_URL) process.env.FRONTEND_URL = 'https://memory-haven-frontend.vercel.app'

const lines = ['# Import Render — memory-haven-api → Environment → Add from .env']
lines.push('NODE_ENV=production')
for (const key of KEYS) {
  if (key === 'NODE_ENV') continue
  const val = process.env[key]
  if (val) lines.push(`${key}=${val}`)
}

const out = path.join(__dirname, '../.render-import.env')
fs.writeFileSync(out, lines.join('\n') + '\n')
console.log(`Fichier genere: ${out}`)
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY manquant — ajoutez-le dans backend/.env puis regenerez.')
}
