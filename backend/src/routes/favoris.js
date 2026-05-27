const express = require('express')
const prisma = require('../lib/prisma')
const { verifierToken } = require('../middleware/auth')

const router = express.Router()

async function souvenirDeLaFamille(souvenirId, familleId) {
  return prisma.souvenir.findFirst({
    where: {
      id: souvenirId,
      famille_id: familleId,
      is_visible: true
    }
  })
}

// GET /api/favoris
router.get('/', verifierToken, async (req, res) => {
  try {
    const favoris = await prisma.favori.findMany({
      where: { utilisateur_id: req.utilisateur.id },
      include: {
        souvenir: {
          include: {
            auteur: { select: { id: true, nom: true, prenom: true } }
          }
        }
      },
      orderBy: { created_at: 'desc' }
    })
    res.json({ succes: true, data: favoris })
  } catch (err) {
    console.error('Erreur favoris GET:', err)
    res.status(500).json({ succes: false, message: err.message })
  }
})

// POST /api/favoris/:souvenir_id
router.post('/:souvenir_id', verifierToken, async (req, res) => {
  try {
    const souvenir_id = parseInt(req.params.souvenir_id, 10)
    if (Number.isNaN(souvenir_id)) {
      return res.status(400).json({ succes: false, message: 'Identifiant invalide' })
    }

    const souvenir = await souvenirDeLaFamille(souvenir_id, req.utilisateur.famille_id)
    if (!souvenir) {
      return res.status(404).json({ succes: false, message: 'Souvenir introuvable' })
    }

    const favori = await prisma.favori.create({
      data: {
        utilisateur_id: req.utilisateur.id,
        souvenir_id
      }
    })
    res.status(201).json({ succes: true, data: favori })
  } catch (err) {
    console.error('Erreur favoris POST:', err)
    if (err.code === 'P2002') {
      return res.status(400).json({ succes: false, message: 'Déjà dans les favoris' })
    }
    res.status(500).json({ succes: false, message: err.message })
  }
})

// DELETE /api/favoris/:souvenir_id
router.delete('/:souvenir_id', verifierToken, async (req, res) => {
  try {
    const souvenir_id = parseInt(req.params.souvenir_id, 10)
    if (Number.isNaN(souvenir_id)) {
      return res.status(400).json({ succes: false, message: 'Identifiant invalide' })
    }

    await prisma.favori.deleteMany({
      where: {
        utilisateur_id: req.utilisateur.id,
        souvenir_id
      }
    })
    res.json({ succes: true, message: 'Retiré des favoris' })
  } catch (err) {
    console.error('Erreur favoris DELETE:', err)
    res.status(500).json({ succes: false, message: err.message })
  }
})

module.exports = router
