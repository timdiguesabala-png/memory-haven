require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function main() {
  const email = process.argv[2] || 'timdiguesabala@gmail.com'
  const u = await p.utilisateur.findMany({
    where: { email: { equals: email, mode: 'insensitive' } },
    select: { id: true, email: true, auth_user_id: true, prenom: true, nom: true, famille_id: true }
  })
  console.log('Utilisateur:', u)
  const a = await p.$queryRawUnsafe(
    `SELECT id, email, created_at FROM auth.users WHERE lower(email) = lower($1) ORDER BY created_at`,
    email
  )
  console.log('auth.users:', a)
}

main().finally(() => p.$disconnect())
