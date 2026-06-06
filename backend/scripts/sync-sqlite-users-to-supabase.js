/**
 * Copie les Utilisateur actifs de dev.db vers Supabase si l'email n'existe pas.
 */
const path = require('path')
const Database = require('better-sqlite3')
const { PrismaClient } = require('@prisma/client')

require('dotenv').config({ path: path.join(__dirname, '../.env') })
require('dotenv').config({
  path: path.join(__dirname, '../.env.supabase.local'),
  override: true
})

const dbPath = path.join(__dirname, '../prisma/dev.db')
const prisma = new PrismaClient()

async function main() {
  if (!process.env.DATABASE_URL?.startsWith('postgres')) {
    console.error('DATABASE_URL Supabase requis')
    process.exit(1)
  }

  const sqlite = new Database(dbPath, { readonly: true })
  const locals = sqlite
    .prepare(
      `SELECT id, email, nom, prenom, login, password, role, famille_id, avatar_url, is_active, is_visible
       FROM Utilisateur WHERE is_active = 1`
    )
    .all()

  let copied = 0
  let skipped = 0

  for (const u of locals) {
    const exists = await prisma.$queryRaw`
      SELECT id FROM "Utilisateur" WHERE lower(email) = lower(${u.email}) LIMIT 1
    `
    if (exists.length) {
      skipped++
      continue
    }

    const fam = await prisma.$queryRaw`
      SELECT id FROM "Famille" WHERE id = ${u.famille_id} LIMIT 1
    `
    if (!fam.length) {
      console.warn(`SKIP ${u.email} — famille ${u.famille_id} absente sur Supabase`)
      skipped++
      continue
    }

    await prisma.$executeRaw`
      INSERT INTO "Utilisateur" (
        nom, prenom, email, login, password, role, famille_id,
        avatar_url, is_active, is_visible, created_at, updated_at
      ) VALUES (
        ${u.nom}, ${u.prenom}, ${u.email}, ${u.login}, ${u.password},
        ${u.role}::"Role", ${u.famille_id},
        ${u.avatar_url}, ${!!u.is_active}, ${!!u.is_visible}, NOW(), NOW()
      )
    `
    copied++
    console.log(`+ ${u.email}`)
  }

  sqlite.close()
  console.log(`\nCopiés: ${copied} | ignorés: ${skipped}`)
}

main()
  .catch((e) => {
    console.error(e.message || e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
