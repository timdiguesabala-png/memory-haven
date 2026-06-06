/**
 * Supprime TOUS les comptes, familles et contenus Memory Haven + auth Supabase.
 * Usage: node scripts/wipe-all-app-data.js --confirm WIPE
 */
require('dotenv').config()
const { PrismaClient } = require('@prisma/client')

const p = new PrismaClient()

async function main() {
  if (!process.argv.includes('--confirm') || process.argv[process.argv.indexOf('--confirm') + 1] !== 'WIPE') {
    console.error('Pour confirmer: node scripts/wipe-all-app-data.js --confirm WIPE')
    process.exit(1)
  }

  const url = process.env.DATABASE_URL || ''
  if (!url.startsWith('postgres')) {
    console.error('DATABASE_URL PostgreSQL requis')
    process.exit(1)
  }

  const before = await p.$queryRawUnsafe(`
    SELECT
      (SELECT count(*)::int FROM "Famille") AS familles,
      (SELECT count(*)::int FROM "Utilisateur") AS utilisateurs,
      (SELECT count(*)::int FROM "Souvenir") AS souvenirs,
      (SELECT count(*)::int FROM auth.users) AS auth_users
  `)
  console.log('Avant:', before[0])

  const tables = await p.$queryRawUnsafe(`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `)

  if (tables.length) {
    const list = tables.map((t) => `"${t.tablename}"`).join(', ')
    await p.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`)
    console.log(`TRUNCATE ${tables.length} tables public`)
  }

  await p.$executeRawUnsafe(`DELETE FROM auth.identities`)
  const authDel = await p.$executeRawUnsafe(`DELETE FROM auth.users`)
  console.log('auth.users supprimés:', authDel)

  const after = await p.$queryRawUnsafe(`
    SELECT
      (SELECT count(*)::int FROM "Famille") AS familles,
      (SELECT count(*)::int FROM "Utilisateur") AS utilisateurs,
      (SELECT count(*)::int FROM "Souvenir") AS souvenirs,
      (SELECT count(*)::int FROM auth.users) AS auth_users
  `)
  console.log('Apres:', after[0])
  console.log('OK — base Memory Haven vide.')
}

main()
  .catch((e) => {
    console.error(e.message || e)
    process.exit(1)
  })
  .finally(() => p.$disconnect())
