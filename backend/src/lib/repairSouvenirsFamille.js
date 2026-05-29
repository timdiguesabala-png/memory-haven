const prisma = require('./prisma')

/** Rattache à la famille les souvenirs publiés par ses membres mais mal enregistrés. */
async function repairSouvenirsFamille(familleId) {
  const id = Number(familleId)
  const orphelins = await prisma.souvenir.findMany({
    where: {
      is_visible: true,
      auteur: { famille_id: id, is_active: true },
      NOT: { famille_id: id }
    },
    select: { id: true }
  })
  if (orphelins.length === 0) return 0
  await prisma.souvenir.updateMany({
    where: { id: { in: orphelins.map((s) => s.id) } },
    data: { famille_id: id }
  })
  return orphelins.length
}

module.exports = { repairSouvenirsFamille }
