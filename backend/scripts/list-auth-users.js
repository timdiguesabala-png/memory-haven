require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function main() {
  const users = await p.utilisateur.findMany({
    where: { is_active: true },
    select: { id: true, email: true, auth_user_id: true, nom: true, prenom: true },
    take: 15,
    orderBy: { id: 'asc' }
  })
  console.log('Utilisateur (Prisma):', users.length)
  for (const u of users) {
    console.log(`  ${u.email} | auth_user_id=${u.auth_user_id ? 'OK' : 'NULL'} | ${u.prenom} ${u.nom}`)
  }

  try {
    const auth = await p.$queryRawUnsafe(`
      SELECT email, email_confirmed_at IS NOT NULL AS confirmed, created_at
      FROM auth.users
      ORDER BY created_at DESC
      LIMIT 15
    `)
    console.log('\nauth.users:', auth.length)
    for (const a of auth) {
      console.log(`  ${a.email} | confirmed=${a.confirmed}`)
    }
  } catch (e) {
    console.log('auth.users:', e.message.split('\n')[0])
  }
}

main().finally(() => p.$disconnect())
