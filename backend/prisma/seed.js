const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

async function main() {
  const password = await bcrypt.hash('demo1234', 10)

  const famille = await prisma.famille.upsert({
    where: { code_invitation: 'DEMO2026' },
    update: {},
    create: {
      nom: 'Famille Démo',
      code_invitation: 'DEMO2026',
      description: 'Espace de démonstration Memory Haven',
      utilisateurs: {
        create: {
          nom: 'Martin',
          prenom: 'Marie',
          email: 'marie@demo.local',
          login: 'marie',
          password,
          role: 'SUPER_ADMIN'
        }
      }
    },
    include: { utilisateurs: true }
  })

  const marie = famille.utilisateurs[0]

  await prisma.utilisateur.upsert({
    where: { email: 'pierre@demo.local' },
    update: {},
    create: {
      nom: 'Martin',
      prenom: 'Pierre',
      email: 'pierre@demo.local',
      login: 'pierre',
      password,
      role: 'MEMBRE',
      famille_id: famille.id
    }
  })

  const nbSouvenirs = await prisma.souvenir.count({ where: { famille_id: famille.id } })
  if (nbSouvenirs === 0) {
    await prisma.souvenir.createMany({
      data: [
        {
          titre: 'Premier jour à la mer',
          description: 'Une journée ensoleillée avec toute la famille.',
          type: 'PHOTO',
          date_souvenir: new Date('2024-07-15'),
          lieu: 'Nice',
          auteur_id: marie.id,
          famille_id: famille.id
        },
        {
          titre: 'Noël en famille',
          description: 'Messages et moments partagés autour du sapin.',
          type: 'TEXTE',
          date_souvenir: new Date('2023-12-24'),
          lieu: 'Lyon',
          auteur_id: marie.id,
          famille_id: famille.id
        },
        {
          titre: 'Anniversaire de Papa',
          description: 'Gâteau, rires et photos souvenirs.',
          type: 'PHOTO',
          date_souvenir: new Date('2025-03-10'),
          lieu: 'Paris',
          auteur_id: marie.id,
          famille_id: famille.id,
          epingle: true
        }
      ]
    })
  }

  const nbAlbums = await prisma.album.count({ where: { famille_id: famille.id } })
  if (nbAlbums === 0) {
    const album = await prisma.album.create({
      data: {
        nom: 'Vacances 2024',
        description: 'Souvenirs des vacances d\'été',
        famille_id: famille.id,
        createur_id: marie.id
      }
    })
    const souvenirs = await prisma.souvenir.findMany({ where: { famille_id: famille.id }, take: 2 })
    for (const [i, s] of souvenirs.entries()) {
      await prisma.albumSouvenir.create({
        data: { album_id: album.id, souvenir_id: s.id, ordre: i + 1 }
      })
    }
  }

  const nbArbre = await prisma.membreArbre.count({ where: { famille_id: famille.id } })
  if (nbArbre === 0) {
    const grandParent = await prisma.membreArbre.create({
      data: {
        nom: 'Martin',
        date_naissance: new Date('1950-05-20'),
        biographie: 'Patriarche de la famille',
        famille_id: famille.id
      }
    })
    await prisma.membreArbre.create({
      data: {
        nom: 'Jean Martin',
        date_naissance: new Date('1975-08-12'),
        biographie: 'Fils aîné',
        parent_id: grandParent.id,
        famille_id: famille.id
      }
    })
  }

  console.log('✅ Projet initialisé')
  console.log('   Famille:', famille.nom, '| code:', 'DEMO2026')
  console.log('   Marie: marie@demo.local / demo1234')
  console.log('   Pierre: pierre@demo.local / demo1234 (pour tester les notifications)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
