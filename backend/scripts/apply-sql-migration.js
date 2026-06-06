/**
 * Applique un fichier SQL de supabase/migrations/
 * Usage: node scripts/apply-sql-migration.js 007_tighten_anon_grants.sql
 */
require('dotenv').config()
const fs = require('fs')
const path = require('path')
const { PrismaClient } = require('@prisma/client')

const file = process.argv[2]
if (!file) {
  console.error('Usage: node scripts/apply-sql-migration.js <fichier.sql>')
  process.exit(1)
}

const sqlPath = path.join(__dirname, '../../supabase/migrations', file)
if (!fs.existsSync(sqlPath)) {
  console.error('Fichier introuvable:', sqlPath)
  process.exit(1)
}

async function main() {
  const raw = fs.readFileSync(sqlPath, 'utf8')
  const sql = raw.replace(/--[^\n]*/g, '')
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)

  const p = new PrismaClient()
  for (const stmt of statements) {
    await p.$executeRawUnsafe(stmt)
  }
  console.log('OK:', file, `(${statements.length} statements)`)
  await p.$disconnect()
}

main().catch((e) => {
  console.error(e.message || e)
  process.exit(1)
})
