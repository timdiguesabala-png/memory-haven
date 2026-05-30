const prisma = require('./prisma')
const { souvenirFamilyWhere } = require('./souvenirFamilyWhere')

async function souvenirDansFamille(souvenirId, familleId, role = 'MEMBRE') {
  const id = parseInt(souvenirId, 10)
  if (Number.isNaN(id)) return null
  return prisma.souvenir.findFirst({
    where: { id, ...souvenirFamilyWhere(familleId, role) }
  })
}

module.exports = { souvenirDansFamille }
