const prisma = require('./prisma')

const unionInclude = {
  conjoints: {
    include: {
      membre: {
        select: { id: true, nom: true, date_naissance: true, date_deces: true, photo_url: true, type_arbre: true }
      }
    },
    orderBy: { ordre: 'asc' }
  },
  enfants: {
    include: {
      enfant: {
        select: { id: true, nom: true, date_naissance: true, photo_url: true, type_arbre: true }
      }
    },
    orderBy: { ordre: 'asc' }
  }
}

async function listUnionsFamille(familleId) {
  return prisma.unionFamiliale.findMany({
    where: { famille_id: familleId, is_visible: true },
    include: unionInclude,
    orderBy: [{ ordre: 'asc' }, { id: 'asc' }]
  })
}

async function unionDansFamille(unionId, familleId) {
  return prisma.unionFamiliale.findFirst({
    where: { id: unionId, famille_id: familleId, is_visible: true },
    include: unionInclude
  })
}

async function validerMembresFamille(ids, familleId) {
  const unique = [...new Set(ids.map((id) => parseInt(id, 10)).filter((id) => !Number.isNaN(id)))]
  if (!unique.length) return []

  const membres = await prisma.membreArbre.findMany({
    where: { id: { in: unique }, famille_id: familleId, is_visible: true },
    select: { id: true }
  })

  if (membres.length !== unique.length) {
    const err = new Error('Un ou plusieurs membres sont introuvables dans cette famille')
    err.status = 400
    throw err
  }

  return unique
}

async function createUnion(familleId, body) {
  const { conjoint_ids, enfant_ids, date_debut, date_fin, ordre } = body
  const conjoints = await validerMembresFamille(conjoint_ids || [], familleId)
  if (conjoints.length < 2) {
    const err = new Error('Une union requiert au moins 2 conjoints')
    err.status = 400
    throw err
  }

  const enfants = enfant_ids?.length
    ? await validerMembresFamille(enfant_ids, familleId)
    : []

  return prisma.$transaction(async (tx) => {
    const union = await tx.unionFamiliale.create({
      data: {
        famille_id: familleId,
        date_debut: date_debut ? new Date(date_debut) : null,
        date_fin: date_fin ? new Date(date_fin) : null,
        ordre: ordre != null ? parseInt(ordre, 10) || 0 : 0
      }
    })

    await tx.unionConjoint.createMany({
      data: conjoints.map((membre_id, i) => ({
        union_id: union.id,
        membre_id,
        ordre: i
      }))
    })

    if (enfants.length) {
      await tx.enfantUnion.createMany({
        data: enfants.map((enfant_id, i) => ({
          union_id: union.id,
          enfant_id,
          ordre: i
        }))
      })
    }

    return tx.unionFamiliale.findUnique({
      where: { id: union.id },
      include: unionInclude
    })
  })
}

async function updateUnion(unionId, familleId, body) {
  const existing = await unionDansFamille(unionId, familleId)
  if (!existing) {
    const err = new Error('Union introuvable')
    err.status = 404
    throw err
  }

  const { conjoint_ids, enfant_ids, date_debut, date_fin, ordre } = body
  const data = {}
  if (date_debut !== undefined) data.date_debut = date_debut ? new Date(date_debut) : null
  if (date_fin !== undefined) data.date_fin = date_fin ? new Date(date_fin) : null
  if (ordre !== undefined) data.ordre = parseInt(ordre, 10) || 0

  return prisma.$transaction(async (tx) => {
    if (Object.keys(data).length) {
      await tx.unionFamiliale.update({ where: { id: unionId }, data })
    }

    if (conjoint_ids !== undefined) {
      const conjoints = await validerMembresFamille(conjoint_ids, familleId)
      if (conjoints.length < 2) {
        const err = new Error('Une union requiert au moins 2 conjoints')
        err.status = 400
        throw err
      }
      await tx.unionConjoint.deleteMany({ where: { union_id: unionId } })
      await tx.unionConjoint.createMany({
        data: conjoints.map((membre_id, i) => ({ union_id: unionId, membre_id, ordre: i }))
      })
    }

    if (enfant_ids !== undefined) {
      const enfants = enfant_ids?.length
        ? await validerMembresFamille(enfant_ids, familleId)
        : []
      await tx.enfantUnion.deleteMany({ where: { union_id: unionId } })
      if (enfants.length) {
        await tx.enfantUnion.createMany({
          data: enfants.map((enfant_id, i) => ({ union_id: unionId, enfant_id, ordre: i }))
        })
      }
    }

    return tx.unionFamiliale.findUnique({
      where: { id: unionId },
      include: unionInclude
    })
  })
}

async function deleteUnion(unionId, familleId) {
  const existing = await unionDansFamille(unionId, familleId)
  if (!existing) {
    const err = new Error('Union introuvable')
    err.status = 404
    throw err
  }
  await prisma.unionFamiliale.update({
    where: { id: unionId },
    data: { is_visible: false }
  })
  return true
}

module.exports = {
  listUnionsFamille,
  unionDansFamille,
  createUnion,
  updateUnion,
  deleteUnion,
  unionInclude
}
