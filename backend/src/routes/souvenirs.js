const express = require('express')
const multer = require('multer')
const { v2: cloudinary } = require('cloudinary')
const prisma = require('../lib/prisma')
const { verifierToken } = require('../middleware/auth')
const { formatSouvenir, formatSouvenirs } = require('../lib/souvenirFormat')
const { estAdmin } = require('../lib/authHelpers')

function parseUrlsBody(value) {
  if (!value) return []
  if (Array.isArray(value)) return value.filter(Boolean)
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [value]
    } catch {
      return [value]
    }
  }
  return []
}

async function souvenirFamille(id, familleId) {
  return prisma.souvenir.findFirst({
    where: { id, famille_id: familleId, is_visible: true }
  })
}

const router = express.Router()

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

// Configuration multer (stockage en mémoire)
const storage = multer.memoryStorage()
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } })

// GET /api/souvenirs
router.get('/', verifierToken, async (req, res) => {
  try {
    const souvenirs = await prisma.souvenir.findMany({
      where: { famille_id: req.utilisateur.famille_id, is_visible: true },
      include: {
        auteur: { select: { id: true, nom: true, prenom: true } },
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

// POST /api/souvenirs (avec fichier)
router.post('/', verifierToken, upload.single('file'), async (req, res) => {
  try {
    const { titre, description, type, date_souvenir, lieu, tags, fichiers_url } = req.body
    let media_url = null
    let fichiers_multiple = null

    if (!titre || !date_souvenir) {
      return res.status(400).json({
        succes: false,
        message: 'Titre et date sont obligatoires'
      })
    }

    // Upload du fichier à Cloudinary si présent
    if (req.file) {
      try {
        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              resource_type: 'auto',
              folder: 'memory_haven',
              public_id: `souvenir_${Date.now()}`
            },
            (error, result) => {
              if (error) reject(error)
              else resolve(result)
            }
          )
          uploadStream.end(req.file.buffer)
        })
        media_url = result.secure_url
      } catch (uploadErr) {
        console.error('Erreur upload Cloudinary:', uploadErr)
        return res.status(500).json({
          succes: false,
          message: 'Erreur lors de l\'upload du fichier'
        })
      }
    }

    const urlsExistantes = parseUrlsBody(fichiers_url)
    if (urlsExistantes.length > 0) {
      media_url = urlsExistantes[0]
      fichiers_multiple = urlsExistantes.length > 1
        ? JSON.stringify(urlsExistantes.slice(1))
        : null
    }

    // Création du souvenir
    const souvenir = await prisma.souvenir.create({
      data: {
        titre,
        description: description || null,
        type: type || 'TEXTE',
        date_souvenir: new Date(date_souvenir),
        lieu: lieu || null,
        fichier_url: media_url,
        fichiers_multiple,
        auteur_id: req.utilisateur.id,
        famille_id: req.utilisateur.famille_id
      }
    })

    // Ajout des tags
    if (tags && tags.length > 0) {
      const tagArray = Array.isArray(tags) ? tags : JSON.parse(tags)
      for (const libelleTag of tagArray) {
        const tag = await prisma.tag.upsert({
          where: {
            libelle_famille_id: {
              libelle: libelleTag,
              famille_id: req.utilisateur.famille_id
            }
          },
          update: {},
          create: {
            libelle: libelleTag,
            famille_id: req.utilisateur.famille_id
          }
        })
        await prisma.souvenirTag.create({
          data: { souvenir_id: souvenir.id, tag_id: tag.id }
        })
      }
    }

    res.status(201).json({ succes: true, data: formatSouvenir(souvenir) })
  } catch (err) {
    console.error('Erreur POST:', err)
    res.status(500).json({ succes: false, message: err.message })
  }
})

// GET /api/souvenirs/:id
router.get('/:id', verifierToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    const souvenir = await prisma.souvenir.findFirst({
      where: { id, famille_id: req.utilisateur.famille_id, is_visible: true },
      include: {
        auteur: { select: { id: true, nom: true, prenom: true } },
        reactions: true,
        commentaires: { include: { auteur: { select: { id: true, prenom: true, nom: true } } } },
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
    if (existant.auteur_id !== req.utilisateur.id && !estAdmin(req.utilisateur.role)) {
      return res.status(403).json({ succes: false, message: 'Suppression non autorisée' })
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