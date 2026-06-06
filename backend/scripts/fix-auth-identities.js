/**
 * Repare auth.identities pour les comptes crees via admin API (id = user_id).
 * Usage: node scripts/fix-auth-identities.js [--dry-run]
 */
require('dotenv').config()
const { PrismaClient } = require('@prisma/client')

const dryRun = process.argv.includes('--dry-run')
const p = new PrismaClient()

async function main() {
  const broken = await p.$queryRawUnsafe(`
    SELECT i.id, i.user_id, i.email, u.email AS user_email
    FROM auth.identities i
    JOIN auth.users u ON u.id = i.user_id
    WHERE i.provider = 'email' AND i.id = i.user_id
  `)

  console.log(`Comptes a reparer: ${broken.length}`)
  if (!broken.length) return

  for (const row of broken) {
    const email = row.email || row.user_email
    console.log(`  ${email}`)
    if (dryRun) continue

    await p.$executeRawUnsafe(
      `UPDATE auth.identities
       SET id = gen_random_uuid(),
           provider_id = $1::text,
           identity_data = jsonb_build_object(
             'sub', $1::text,
             'email', $2,
             'email_verified', true,
             'phone_verified', false
           ),
           updated_at = NOW()
       WHERE user_id = $1::uuid AND provider = 'email' AND id = $1::uuid`,
      row.user_id,
      email
    )
  }

  if (!dryRun) console.log('OK identities reparees')
}

main().finally(() => p.$disconnect())
