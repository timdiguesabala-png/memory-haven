const express = require('express')
const prisma = require('../lib/prisma')
const { verifierToken } = require('../middleware/auth')
const { exigerEcriture } = require('../middleware/roles')

const router = express.Router()

// GET /api/albums - Tous les albums de la famille
router.get('/', verifierToken, async (req, res) => {
  try {
    const albums = await prisma.album.findMany({
      where: {
        famille_id: req.utilisateur.famille_id,
        is_visible: true
      },
      include: {
        createur: {
          select: { id: true, nom: true, prenom: true }
        },
        souvenirs: {
          include: {
            souvenir: {
              select: { id: true, titre: true, fichier_url: true, type: true }
            }
          }
        }
      },
      orderBy: { created_at: 'desc' }
    })

    res.json({ succes: true, data: albums })

  } catch (erreur) {
    console.error('Erreur GET albums:', erreur)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// POST /api/albums - Créer un album
router.post('/', verifierToken, exigerEcriture, async (req, res) => {
  try {
    const { nom, description } = req.body

    if (!nom) {
      return res.status(400).json({
        succes: false,
        message: 'Le nom est obligatoire'
      })
    }

    const album = await prisma.album.create({
      data: {
        nom,
        description: description || null,
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

// POST /api/albums/:id/souvenirs - Ajouter un souvenir à un album
router.post('/:id/souvenirs', verifierToken, exigerEcriture, async (req, res) => {
  try {
    const album_id = parseInt(req.params.id)
    const { souvenir_id } = req.body

    const liaison = await prisma.albumSouvenir.create({
      data: {
        album_id,
        souvenir_id: parseInt(souvenir_id)
      }
    })

    res.status(201).json({ succes: true, data: liaison })

  } catch (erreur) {
    console.error('Erreur ajout souvenir album:', erreur)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// DELETE /api/albums/:id - Supprimer un album (logique)
router.delete('/:id', verifierToken, exigerEcriture, async (req, res) => {
  try {
    const id = parseInt(req.params.id)

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