/**
 * Corrige auth.users : NULL -> '' sur les colonnes token (erreur 500 au login).
 * Usage: node scripts/fix-auth-users-nulls.js
 */
require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function main() {
  const n = await p.$executeRawUnsafe(`
    UPDATE auth.users SET
      confirmation_token = COALESCE(confirmation_token, ''),
      recovery_token = COALESCE(recovery_token, ''),
      email_change_token_new = COALESCE(email_change_token_new, ''),
      email_change = COALESCE(email_change, ''),
      reauthentication_token = COALESCE(reauthentication_token, ''),
      email_change_token_current = COALESCE(email_change_token_current, ''),
      phone_change = COALESCE(phone_change, ''),
      phone_change_token = COALESCE(phone_change_token, '')
    WHERE confirmation_token IS NULL
       OR recovery_token IS NULL
       OR email_change_token_new IS NULL
       OR email_change IS NULL
  `)
  console.log(`OK lignes corrigees: ${n}`)
}

main().finally(() => p.$disconnect())
