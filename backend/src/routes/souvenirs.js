const express = require('express')
const prisma = require('../lib/prisma')
const { verifierToken } = require('../middleware/auth')
const { exigerEcriture } = require('../middleware/roles')
const { formatSouvenir, formatSouvenirs } = require('../lib/souvenirFormat')
const { estAdmin } = require('../lib/authHelpers')
const { parseMultipart } = require('../middleware/multerMedia')
const { createSouvenirFromRequest } = require('../lib/createSouvenir')
const { souvenirFamilyWhere } = require('../lib/souvenirFamilyWhere')
const { souvenirDansFamille } = require('../lib/souvenirAccess')
const { repairSouvenirsFamille } = require('../lib/repairSouvenirsFamille')
const { normaliserVisibilite } = require('../lib/visibiliteSouvenir')

const souvenirFamille = (id, familleId, role) => souvenirDansFamille(id, familleId, role)

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

// GET /api/souvenirs?page=1&limit=30
router.get('/', verifierToken, async (req, res) => {
  try {
    const where = souvenirFamilyWhere(req.utilisateur.famille_id, req.utilisateur.role)
    const page = Math.max(1, parseInt(req.query.page, 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50))
    const skip = (page - 1) * limit

    const include = {
      auteur: { select: { id: true, nom: true, prenom: true, avatar_url: true } },
      reactions: true,
      commentaires: { select: { id: true } },
      tags: { include: { tag: true } },
      membre_arbre: { select: { id: true, nom: true } }
    }

    const [souvenirs, total] = await Promise.all([
      prisma.souvenir.findMany({
        where,
        include,
        orderBy: [{ epingle: 'desc' }, { date_souvenir: 'desc' }],
        skip,
        take: limit
      }),
      prisma.souvenir.count({ where })
    ])

    res.json({
      succes: true,
      data: formatSouvenirs(souvenirs),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
        hasMore: skip + souvenirs.length < total
      }
    })
  } catch (err) {
    console.error('Erreur GET:', err)
    res.status(500).json({ succes: false, message: err.message })
  }
})

// POST /api/souvenirs — JSON ou multipart (route unique pour les médias)
router.post('/', verifierToken, exigerEcriture, parseMultipart, async (req, res) => {
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
      where: { id, ...souvenirFamilyWhere(req.utilisateur.famille_id, req.utilisateur.role) },
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
router.put('/:id', verifierToken, exigerEcriture, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    const existant = await souvenirFamille(id, req.utilisateur.famille_id, req.utilisateur.role)
    if (!existant) {
      return res.status(404).json({ succes: false, message: 'Souvenir introuvable' })
    }
    const {
      titre,
      description,
      type,
      date_souvenir,
      lieu,
      visibilite,
      epingle,
      latitude,
      longitude,
      categorie,
      membre_arbre_id,
      couverture_url
    } = req.body

    if (epingle !== undefined && !estAdmin(req.utilisateur.role)) {
      return res.status(403).json({ succes: false, message: 'Seuls les administrateurs peuvent épingler' })
    }
    if (existant.auteur_id !== req.utilisateur.id && !estAdmin(req.utilisateur.role)) {
      return res.status(403).json({ succes: false, message: 'Seul l\'auteur ou un administrateur peut modifier ce souvenir' })
    }
    const souvenir = await prisma.souvenir.update({
      where: { id },
      data: {
        ...(titre && { titre }),
        ...(description !== undefined && { description }),
        ...(type && { type }),
        ...(date_souvenir && { date_souvenir: new Date(date_souvenir) }),
        ...(lieu !== undefined && { lieu }),
        ...(visibilite !== undefined && {
          visibilite: normaliserVisibilite(visibilite, req.utilisateur.role)
        }),
        ...(epingle !== undefined && { epingle: Boolean(epingle) }),
        ...(latitude !== undefined && {
          latitude: latitude != null && latitude !== '' ? Number(latitude) : null
        }),
        ...(longitude !== undefined && {
          longitude: longitude != null && longitude !== '' ? Number(longitude) : null
        }),
        ...(categorie !== undefined && { categorie: categorie || null }),
        ...(membre_arbre_id !== undefined && {
          membre_arbre_id: membre_arbre_id ? parseInt(membre_arbre_id, 10) : null
        }),
        ...(couverture_url !== undefined && { couverture_url: couverture_url || null })
      }
    })
    res.json({ succes: true, data: formatSouvenir(souvenir) })
  } catch (err) {
    res.status(500).json({ succes: false, message: err.message })
  }
})

// DELETE /api/souvenirs/:id
router.delete('/:id', verifierToken, exigerEcriture, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    const existant = await souvenirFamille(id, req.utilisateur.famille_id, req.utilisateur.role)
    if (!existant) {
      return res.status(404).json({ succes: false, message: 'Souvenir introuvable' })
    }
    if (
      existant.auteur_id !== req.utilisateur.id &&
      !estAdmin(req.utilisateur.role)
    ) {
      return res.status(403).json({
        succes: false,
        message: 'Seul l\'auteur ou un administrateur peut supprimer ce souvenir'
      })
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
