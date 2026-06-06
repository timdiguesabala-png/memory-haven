/**
 * Reinitialise un mot de passe auth.users via SQL (pgcrypto).
 * Usage: node scripts/reset-password-sql.js --email x@y.z --password ***
 */
require('dotenv').config()
const { PrismaClient } = require('@prisma/client')

function parseArgs() {
  const args = process.argv.slice(2)
  let email = null
  let password = null
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--email') email = args[++i]
    else if (args[i] === '--password') password = args[++i]
  }
  return { email, password }
}

async function main() {
  const { email, password } = parseArgs()
  if (!email || !password || password.length < 6) {
    console.error('Usage: node scripts/reset-password-sql.js --email x@y.z --password ***')
    process.exit(1)
  }

  const p = new PrismaClient()
  await p.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS pgcrypto`)

  const n = await p.$executeRawUnsafe(
    `UPDATE auth.users
     SET encrypted_password = crypt($1, gen_salt('bf')),
         email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
         updated_at = NOW()
     WHERE lower(email) = lower($2)`,
    password,
    email.trim()
  )

  if (!n) {
    console.error(`Aucun utilisateur auth pour ${email}`)
    process.exit(1)
  }

  console.log(`OK mot de passe SQL pour ${email}`)
  await p.$disconnect()
}

main().catch((e) => {
  console.error(e.message || e)
  process.exit(1)
})
