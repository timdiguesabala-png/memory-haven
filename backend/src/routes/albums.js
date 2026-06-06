const express = require('express')
const prisma = require('../lib/prisma')
const { verifierToken } = require('../middleware/auth')
const { exigerEcriture } = require('../middleware/roles')
const { estAdmin } = require('../lib/authHelpers')
const { souvenirDansFamille } = require('../lib/souvenirAccess')

const router = express.Router()

function albumVisibilityWhere(familleId, userId, role) {
  if (estAdmin(role)) {
    return { famille_id: familleId, is_visible: true }
  }
  return {
    famille_id: familleId,
    is_visible: true,
    OR: [{ prive: false }, { createur_id: userId }]
  }
}

// GET /api/albums
router.get('/', verifierToken, async (req, res) => {
  try {
    const albums = await prisma.album.findMany({
      where: albumVisibilityWhere(
        req.utilisateur.famille_id,
        req.utilisateur.id,
        req.utilisateur.role
      ),
      include: {
        createur: { select: { id: true, nom: true, prenom: true } },
        souvenirs: {
          include: {
            souvenir: {
              select: {
                id: true,
                titre: true,
                fichier_url: true,
                type: true,
                date_souvenir: true,
                description: true,
                couverture_url: true
              }
            }
          }
        }
      },
      orderBy: { updated_at: 'desc' }
    })

    res.json({ succes: true, data: albums })
  } catch (erreur) {
    console.error('Erreur GET albums:', erreur)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// POST /api/albums
router.post('/', verifierToken, exigerEcriture, async (req, res) => {
  try {
    const { nom, description, prive, type_album, annee, membre_arbre_id, couverture_url } = req.body

    if (!nom) {
      return res.status(400).json({ succes: false, message: 'Le nom est obligatoire' })
    }

    const album = await prisma.album.create({
      data: {
        nom,
        description: description || null,
        prive: Boolean(prive),
        type_album: type_album || 'MANUEL',
        annee: annee ? parseInt(annee, 10) : null,
        membre_arbre_id: membre_arbre_id ? parseInt(membre_arbre_id, 10) : null,
        couverture_url: couverture_url || null,
        famille_id: req.utilisateur.famille_id,
        createur_id: req.utilisateur.id
      }
    })

    res.status(201).json({ succes: true, data: album })
  } catch (erreur) {
    console.error('Erreur POST album:', erreur)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// PUT /api/albums/:id
router.put('/:id', verifierToken, exigerEcriture, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    const album = await prisma.album.findFirst({
      where: { id, famille_id: req.utilisateur.famille_id, is_visible: true }
    })
    if (!album) {
      return res.status(404).json({ succes: false, message: 'Album introuvable' })
    }
    if (album.createur_id !== req.utilisateur.id && !estAdmin(req.utilisateur.role)) {
      return res.status(403).json({ succes: false, message: 'Non autorisé' })
    }

    const { nom, description, prive, couverture_url } = req.body
    const updated = await prisma.album.update({
      where: { id },
      data: {
        ...(nom && { nom }),
        ...(description !== undefined && { description }),
        ...(prive !== undefined && { prive: Boolean(prive) }),
        ...(couverture_url !== undefined && { couverture_url: couverture_url || null })
      }
    })
    res.json({ succes: true, data: updated })
  } catch (erreur) {
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// POST /api/albums/:id/souvenirs
router.post('/:id/souvenirs', verifierToken, exigerEcriture, async (req, res) => {
  try {
    const album_id = parseInt(req.params.id, 10)
    const { souvenir_id } = req.body

    const album = await prisma.album.findFirst({
      where: { id: album_id, famille_id: req.utilisateur.famille_id, is_visible: true }
    })
    if (!album) {
      return res.status(404).json({ succes: false, message: 'Album introuvable' })
    }

    const sid = parseInt(souvenir_id, 10)
    const souvenir = await souvenirDansFamille(sid, req.utilisateur.famille_id, req.utilisateur.role)
    if (!souvenir) {
      return res.status(404).json({ succes: false, message: 'Souvenir introuvable dans cette famille' })
    }

    const liaison = await prisma.albumSouvenir.create({
      data: { album_id, souvenir_id: sid }
    })

    res.status(201).json({ succes: true, data: liaison })
  } catch (erreur) {
    console.error('Erreur ajout souvenir album:', erreur)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// DELETE /api/albums/:id
router.delete('/:id', verifierToken, exigerEcriture, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    const album = await prisma.album.findFirst({
      where: { id, famille_id: req.utilisateur.famille_id, is_visible: true }
    })
    if (!album) {
      return res.status(404).json({ succes: false, message: 'Album introuvable' })
    }
    if (album.createur_id !== req.utilisateur.id && !estAdmin(req.utilisateur.role)) {
      return res.status(403).json({ succes: false, message: 'Non autorisé' })
    }
    await prisma.album.update({
      where: { id },
      data: { is_visible: false }
    })
    res.json({ succes: true, message: 'Album supprimé' })
  } catch (erreur) {
    console.error('Erreur DELETE album:', erreur)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

module.exports = router
