const express = require('express')
const prisma = require('../lib/prisma')
const { verifierToken } = require('../middleware/auth')

const router = express.Router()

// GET /api/arbre - Récupère tout l'arbre de la famille
router.get('/', verifierToken, async (req, res) => {
  try {
    const membres = await prisma.membreArbre.findMany({
      where: {
        famille_id: req.utilisateur.famille_id,
        is_visible: true
      },
      include: {
        utilisateur: {
          select: { id: true, nom: true, prenom: true, avatar_url: true }
        }
      },
      orderBy: { created_at: 'asc' }
    })

    res.json({ succes: true, data: membres })

  } catch (erreur) {
    console.error('Erreur GET arbre:', erreur)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// POST /api/arbre - Ajouter un membre dans l'arbre
router.post('/', verifierToken, async (req, res) => {
  try {
    const { nom, date_naissance, date_deces, photo_url, biographie, parent_id } = req.body

    if (!nom) {
      return res.status(400).json({
        succes: false,
        message: 'Le nom est obligatoire'
      })
    }

    const membre = await prisma.membreArbre.create({
      data: {
        nom,
        date_naissance: date_naissance ? new Date(date_naissance) : null,
        date_deces: date_deces ? new Date(date_deces) : null,
        photo_url: photo_url || null,
        biographie: biographie || null,
        parent_id: parent_id ? parseInt(parent_id) : null,
        famille_id: req.utilisateur.famille_id
      }
    })

    res.status(201).json({
      succes: true,
      message: 'Membre ajouté avec succès',
      data: membre
    })

  } catch (erreur) {
    console.error('Erreur POST arbre:', erreur)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// PUT /api/arbre/:id - Modifier un membre
router.put('/:id', verifierToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const { nom, date_naissance, date_deces, biographie, parent_id } = req.body

    const membre = await prisma.membreArbre.update({
      where: { id },
      data: {
        nom: nom || undefined,
        date_naissance: date_naissance ? new Date(date_naissance) : undefined,
        date_deces: date_deces ? new Date(date_deces) : undefined,
        biographie: biographie || undefined,
        parent_id: parent_id ? parseInt(parent_id) : undefined
      }
    })

    res.json({ succes: true, data: membre })

  } catch (erreur) {
    console.error('Erreur PUT arbre:', erreur)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// DELETE /api/arbre/:id - Supprimer un membre (logique)
router.delete('/:id', verifierToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id)

    await prisma.membreArbre.update({
      where: { id },
      data: { is_visible: false }
    })

    res.json({ succes: true, message: 'Membre supprimé' })

  } catch (erreur) {
    console.error('Erreur DELETE arbre:', erreur)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

module.exports = router