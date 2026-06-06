require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function main() {
  const stats = await p.$queryRawUnsafe(`
    SELECT f.id, f.nom AS famille,
      (SELECT count(*)::int FROM "Utilisateur" u WHERE u.famille_id = f.id AND u.is_active) AS membres,
      (SELECT count(*)::int FROM "Souvenir" s WHERE s.famille_id = f.id) AS souvenirs
    FROM "Famille" f
    ORDER BY f.id
  `)
  console.log('=== Familles et souvenirs (donnees conservees) ===')
  for (const s of stats) {
    console.log(`  ${s.famille} | ${s.membres} membres | ${s.souvenirs} souvenirs`)
  }

  const users = await p.utilisateur.findMany({
    where: { is_active: true },
    select: { email: true, prenom: true, nom: true, auth_user_id: true, famille: { select: { nom: true } } },
    orderBy: { email: 'asc' }
  })
  console.log('\n=== Comptes actifs ===')
  for (const u of users) {
    const linked = u.auth_user_id ? 'Supabase OK' : 'NON LIE'
    console.log(`  ${u.email} | ${u.prenom} ${u.nom} | ${u.famille?.nom} | ${linked}`)
  }
}

main().finally(() => p.$disconnect())
