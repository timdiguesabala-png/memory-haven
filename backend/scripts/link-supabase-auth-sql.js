/**
 * Lie les comptes via PostgreSQL direct (auth.users) — sans service_role API.
 * Nécessite DATABASE_URL Supabase (utilisateur postgres).
 *
 * Usage:
 *   node scripts/link-supabase-auth-sql.js --dry-run
 *   node scripts/link-supabase-auth-sql.js --all --password MemoryHaven2026!
 */
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })
require('dotenv').config({
  path: path.join(__dirname, '../.env.supabase.local'),
  override: true
})
const { PrismaClient } = require('@prisma/client')
const { randomUUID } = require('crypto')

const prisma = new PrismaClient()

function parseArgs() {
  const args = process.argv.slice(2)
  const out = { email: null, password: null, all: false, dryRun: false }
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--email') out.email = args[++i]
    else if (args[i] === '--password') out.password = args[++i]
    else if (args[i] === '--all') out.all = true
    else if (args[i] === '--dry-run') {
      out.dryRun = true
      out.all = true
    }
  }
  return out
}

async function fetchRows({ all, email }) {
  if (all) {
    const rows = await prisma.$queryRaw`
      SELECT id, email, prenom, nom, role::text AS role
      FROM "Utilisateur"
      WHERE "auth_user_id" IS NULL AND "is_active" = true
      ORDER BY id ASC
    `
    return { rows, alreadyLinked: null }
  }
  if (email) {
    const rows = await prisma.$queryRaw`
      SELECT id, email, prenom, nom, role::text AS role, auth_user_id::text AS auth_user_id
      FROM "Utilisateur"
      WHERE lower(email) = lower(${email.trim()})
      LIMIT 1
    `
    const row = rows[0]
    if (!row) return { rows: [], alreadyLinked: null }
    if (row.auth_user_id) return { rows: [], alreadyLinked: row }
    return { rows: [row], alreadyLinked: null }
  }
  return { rows: null, alreadyLinked: null }
}

async function findAuthUserIdByEmail(email) {
  const rows = await prisma.$queryRaw`
    SELECT id::text AS id FROM auth.users WHERE lower(email) = lower(${email.trim()})
    LIMIT 1
  `
  return rows[0]?.id || null
}

async function createAuthUserSql(email, password) {
  const uid = randomUUID()
  const existing = await findAuthUserIdByEmail(email)
  if (existing) {
    await prisma.$executeRaw`
      UPDATE auth.users
      SET encrypted_password = extensions.crypt(${password}, extensions.gen_salt('bf')),
          email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
          updated_at = NOW()
      WHERE id = ${existing}::uuid
    `
    return { id: existing, created: false }
  }

  await prisma.$executeRaw`
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      ${uid}::uuid,
      'authenticated',
      'authenticated',
      lower(${email.trim()}),
      extensions.crypt(${password}, extensions.gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb,
      NOW(),
      NOW()
    )
  `

  await prisma.$executeRaw`
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      ${uid}::uuid,
      ${uid}::uuid,
      jsonb_build_object('sub', ${uid}::text, 'email', lower(${email.trim()})),
      'email',
      ${uid}::text,
      NOW(),
      NOW(),
      NOW()
    )
    ON CONFLICT DO NOTHING
  `

  return { id: uid, created: true }
}

async function linkOne(row, password) {
  const { id: authId, created } = await createAuthUserSql(row.email, password)
  await prisma.$executeRaw`
    UPDATE "Utilisateur" SET "auth_user_id" = ${authId}::uuid WHERE id = ${row.id}
  `
  const tag = created ? 'créé' : 'mis à jour'
  console.log(`OK  [${tag}] ${row.email} (${row.prenom} ${row.nom})`)
}

async function ensurePgcrypto() {
  await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS pgcrypto')
}

async function main() {
  const { email, password, all, dryRun } = parseArgs()
  const url = process.env.DATABASE_URL || ''
  if (!url.startsWith('postgres')) {
    console.error('DATABASE_URL doit pointer vers Supabase PostgreSQL (pas file:./dev.db)')
    process.exit(1)
  }

  const { rows, alreadyLinked } = await fetchRows({ all, email })
  if (rows === null) {
    console.error('Usage: --dry-run | --all --password *** | --email x@y.z --password ***')
    process.exit(1)
  }
  if (alreadyLinked) {
    console.log(`Déjà lié : ${alreadyLinked.email}`)
    return
  }
  if (!rows.length) {
    console.log('Aucun compte actif sans auth_user_id.')
    return
  }

  console.log(`Comptes à traiter : ${rows.length}`)
  if (dryRun) {
    rows.forEach((r) => console.log(`  ${r.id}\t${r.email}\t${r.prenom} ${r.nom}`))
    return
  }
  if (!password || password.length < 6) {
    console.error('--password requis (min. 6 caractères)')
    process.exit(1)
  }

  await ensurePgcrypto()

  for (const row of rows) {
    await linkOne(row, password)
  }
  console.log('Terminé — connexion avec email + mot de passe temporaire.')
}

main()
  .catch((e) => {
    console.error(e.message || e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
