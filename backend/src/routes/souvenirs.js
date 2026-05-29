const express = require('express')
const prisma = require('../lib/prisma')
const { verifierToken } = require('../middleware/auth')
const { formatSouvenir, formatSouvenirs } = require('../lib/souvenirFormat')
const { estAdmin } = require('../lib/authHelpers')
const { parseMultipart } = require('../middleware/multerMedia')
const { createSouvenirFromRequest } = require('../lib/createSouvenir')
const { souvenirFamilyWhere } = require('../lib/souvenirFamilyWhere')
const { repairSouvenirsFamille } = require('../lib/repairSouvenirsFamille')

async function souvenirFamille(id, familleId) {
  return prisma.souvenir.findFirst({
    where: { id, ...souvenirFamilyWhere(familleId) }
  })
}

const router = express.Router()

// POST /api/souvenirs/sync-famille — répare famille_id des souvenirs (admin)
router.post('/sync-famille', verifierToken, async (req, res) => {
  try {
    if (!estAdmin(req.utilisateur.role)) {
      return res.status(403).json({ succes: false, message: 'Action réservée aux administrateurs' })
    }
    const repares = await repairSouvenirsFamille(req.utilisateur.famille_id)
    if (repares === 0) {
      return res.json({ succes: true, message: 'Aucun souvenir à réparer', repares: 0 })
    }
    res.json({
      succes: true,
      message: `${repares} souvenir(s) rattaché(s) à la famille`,
      repares
    })
  } catch (err) {
    res.status(500).json({ succes: false, message: err.message })
  }
})

// GET /api/souvenirs
router.get('/', verifierToken, async (req, res) => {
  try {
    const souvenirs = await prisma.souvenir.findMany({
      where: souvenirFamilyWhere(req.utilisateur.famille_id),
      include: {
        auteur: { select: { id: true, nom: true, prenom: true, avatar_url: true } },
        reactions: true,
        commentaires: { select: { id: true } },
        tags: { include: { tag: true } }
      },
      orderBy: { date_souvenir: 'desc' }
    })
    res.json({ succes: true, data: formatSouvenirs(souvenirs) })
  } catch (err) {
    console.error('Erreur GET:', err)
    res.status(500).json({ succes: false, message: err.message })
  }
})

// POST /api/souvenirs — JSON ou multipart (route unique pour les médias)
router.post('/', verifierToken, parseMultipart, async (req, res) => {
  try {
    const data = await createSouvenirFromRequest(req)
    res.status(201).json({ succes: true, data })
  } catch (err) {
    console.error('Erreur POST souvenir:', err.message, err.stack)
    res.status(err.status || 500).json({
      succes: false,
      message: err.message || 'Erreur création souvenir'
    })
  }
})

// GET /api/souvenirs/:id
router.get('/:id', verifierToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    const souvenir = await prisma.souvenir.findFirst({
      where: { id, ...souvenirFamilyWhere(req.utilisateur.famille_id) },
      include: {
        auteur: { select: { id: true, nom: true, prenom: true, avatar_url: true } },
        reactions: true,
        commentaires: {
          include: {
            auteur: { select: { id: true, prenom: true, nom: true, avatar_url: true } }
          }
        },
        tags: { include: { tag: true } }
      }
    })
    if (!souvenir) {
      return res.status(404).json({ succes: false, message: 'Souvenir introuvable' })
    }
    res.json({ succes: true, data: formatSouvenir(souvenir) })
  } catch (err) {
    res.status(500).json({ succes: false, message: err.message })
  }
})

// PUT /api/souvenirs/:id
router.put('/:id', verifierToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    const existant = await souvenirFamille(id, req.utilisateur.famille_id)
    if (!existant) {
      return res.status(404).json({ succes: false, message: 'Souvenir introuvable' })
    }
    if (existant.auteur_id !== req.utilisateur.id && !estAdmin(req.utilisateur.role)) {
      return res.status(403).json({ succes: false, message: 'Modification non autorisée' })
    }

    const { titre, description, type, date_souvenir, lieu, visibilite, epingle } = req.body
    const souvenir = await prisma.souvenir.update({
      where: { id },
      data: {
        ...(titre && { titre }),
        ...(description !== undefined && { description }),
        ...(type && { type }),
        ...(date_souvenir && { date_souvenir: new Date(date_souvenir) }),
        ...(lieu !== undefined && { lieu }),
        ...(visibilite && { visibilite }),
        ...(epingle !== undefined && { epingle: Boolean(epingle) })
      }
    })
    res.json({ succes: true, data: formatSouvenir(souvenir) })
  } catch (err) {
    res.status(500).json({ succes: false, message: err.message })
  }
})

// DELETE /api/souvenirs/:id
router.delete('/:id', verifierToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    const existant = await souvenirFamille(id, req.utilisateur.famille_id)
    if (!existant) {
      return res.status(404).json({ succes: false, message: 'Souvenir introuvable' })
    }
    if (existant.auteur_id !== req.utilisateur.id) {
      return res.status(403).json({ succes: false, message: 'Seul l\'auteur peut supprimer ce souvenir' })
    }
    await prisma.souvenir.update({
      where: { id },
      data: { is_visible: false }
    })
    res.json({ succes: true, message: 'Souvenir supprimé' })
  } catch (err) {
    res.status(500).json({ succes: false, message: err.message })
  }
})

module.exports = router
