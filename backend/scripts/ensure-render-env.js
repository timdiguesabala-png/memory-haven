/**
 * Met à jour backend/.env pour la prod Render (pooler Supabase 6543).
 * Usage: node scripts/ensure-render-env.js
 */
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })
require('dotenv').config({
  path: path.join(__dirname, '../.env.supabase.local'),
  override: true
})

const envPath = path.join(__dirname, '../.env')
const ref = 'qazdsbeyhryodbtytzik'

function extractPassword() {
  const src = process.env.DIRECT_URL || process.env.DATABASE_URL || ''
  const m = src.match(/postgres(?:\.\w+)?:([^@]+)@/)
  return m ? decodeURIComponent(m[1]) : ''
}

async function findPoolerUrl(pwd) {
  const { PrismaClient } = require('@prisma/client')
  const regions = [
    'eu-central-1', 'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-north-1',
    'us-east-1', 'us-west-1', 'us-west-2', 'ap-southeast-1', 'ap-northeast-1', 'sa-east-1'
  ]
  for (const r of regions) {
    const url = `postgresql://postgres.${ref}:${encodeURIComponent(pwd)}@aws-0-${r}.pooler.supabase.com:6543/postgres?pgbouncer=true`
    const prisma = new PrismaClient({ datasources: { db: { url } } })
    try {
      await prisma.$queryRaw`SELECT 1`
      await prisma.$disconnect()
      return url
    } catch {
      try { await prisma.$disconnect() } catch {}
    }
  }
  throw new Error('Pooler Supabase introuvable — vérifiez le mot de passe DATABASE_URL')
}

function upsertEnv(content, key, value) {
  const line = `${key}=${value}`
  const re = new RegExp(`^${key}=.*$`, 'm')
  if (re.test(content)) return content.replace(re, line)
  return content.trimEnd() + '\n' + line + '\n'
}

async function main() {
  const pwd = extractPassword()
  if (!pwd) {
    console.error('Mot de passe PostgreSQL introuvable dans .env')
    process.exit(1)
  }

  const poolerUrl = await findPoolerUrl(pwd)
  const directUrl =
    process.env.DIRECT_URL ||
    `postgresql://postgres:${encodeURIComponent(pwd)}@db.${ref}.supabase.co:5432/postgres?schema=public&sslmode=require`

  let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : ''
  content = upsertEnv(content, 'DATABASE_URL', poolerUrl)
  content = upsertEnv(content, 'DIRECT_URL', directUrl)
  content = upsertEnv(content, 'SUPABASE_URL', `https://${ref}.supabase.co`)
  content = upsertEnv(content, 'PUBLIC_API_URL', 'https://memory-haven-api.onrender.com')
  content = upsertEnv(content, 'SUPABASE_STORAGE_BUCKET', 'memory-haven')
  content = upsertEnv(content, 'FRONTEND_URL', 'https://memory-haven-frontend.vercel.app')
  if (!/^JWT_SECRET=/m.test(content)) {
    content = upsertEnv(content, 'JWT_SECRET', 'memory_haven_super_secret_key_2024')
  }

  fs.writeFileSync(envPath, content)
  console.log('OK backend/.env — DATABASE_URL pooler eu-west-1:6543')
}

main().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
