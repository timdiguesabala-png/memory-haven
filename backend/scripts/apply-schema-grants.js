/**
 * Applique supabase/migrations/006_public_schema_grants.sql
 * Usage: node scripts/apply-schema-grants.js
 */
require('dotenv').config()
const fs = require('fs')
const path = require('path')
const { PrismaClient } = require('@prisma/client')

const sqlPath = path.join(__dirname, '../../supabase/migrations/006_public_schema_grants.sql')

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
  const check = await p.$queryRawUnsafe(
    `SELECT has_schema_privilege('authenticated', 'public', 'USAGE') AS ok`
  )
  console.log('authenticated USAGE on public:', check[0]?.ok)
  await p.$disconnect()
}

main().catch((e) => {
  console.error(e.message || e)
  process.exit(1)
})
