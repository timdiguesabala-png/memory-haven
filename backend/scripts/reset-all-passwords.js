/**
 * Reinitialise les mots de passe Supabase Auth pour TOUS les comptes actifs.
 * Usage: node scripts/reset-all-passwords.js --password MemoryHaven2026!
 */
require('dotenv').config()
const { PrismaClient } = require('@prisma/client')

function parseArgs() {
  let password = null
  const args = process.argv.slice(2)
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--password') password = args[++i]
  }
  return { password }
}

async function main() {
  const { password } = parseArgs()
  if (!password || password.length < 6) {
    console.error('Usage: node scripts/reset-all-passwords.js --password VotreMdpTemporaire')
    process.exit(1)
  }

  const p = new PrismaClient()
  await p.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS pgcrypto')

  const emails = await p.$queryRawUnsafe(`
    SELECT DISTINCT lower(u.email) AS email
    FROM "Utilisateur" u
    WHERE u.is_active = true AND u.email IS NOT NULL
    ORDER BY 1
  `)

  console.log(`Reinitialisation de ${emails.length} comptes...`)
  for (const { email } of emails) {
    const n = await p.$executeRawUnsafe(
      `UPDATE auth.users
       SET encrypted_password = crypt($1, gen_salt('bf')),
           email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
           confirmation_token = COALESCE(confirmation_token, ''),
           recovery_token = COALESCE(recovery_token, ''),
           email_change_token_new = COALESCE(email_change_token_new, ''),
           email_change = COALESCE(email_change, ''),
           updated_at = NOW()
       WHERE lower(email) = lower($2)`,
      password,
      email
    )
    console.log(n ? `  OK ${email}` : `  SKIP (pas dans auth.users) ${email}`)
  }

  console.log('\nConnexion: email + mot de passe temporaire ci-dessus.')
  await p.$disconnect()
}

main().catch((e) => {
  console.error(e.message || e)
  process.exit(1)
})
