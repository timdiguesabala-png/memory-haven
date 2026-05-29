const express = require('express')
const prisma = require('../lib/prisma')
const { verifierToken } = require('../middleware/auth')
const { isAllowedAvatarUrl } = require('../lib/serializeUtilisateur')

const router = express.Router()

async function membreDansFamille(id, familleId) {
  return prisma.membreArbre.findFirst({
    where: { id, famille_id: familleId, is_visible: true }
  })
}

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

// PUT /api/arbre/:id/photo — photo du membre dans l'arbre
router.put('/:id/photo', verifierToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    const { photo_url } = req.body

    const existing = await membreDansFamille(id, req.utilisateur.famille_id)
    if (!existing) {
      return res.status(404).json({ succes: false, message: 'Membre introuvable' })
    }

    if (photo_url != null && !isAllowedAvatarUrl(photo_url)) {
      return res.status(400).json({ succes: false, message: 'URL de photo invalide' })
    }

    const membre = await prisma.membreArbre.update({
      where: { id },
      data: { photo_url: photo_url || null }
    })

    res.json({ succes: true, data: membre })
  } catch (erreur) {
    console.error('Erreur photo arbre:', erreur)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// DELETE /api/arbre/:id/photo
router.delete('/:id/photo', verifierToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    const existing = await membreDansFamille(id, req.utilisateur.famille_id)
    if (!existing) {
      return res.status(404).json({ succes: false, message: 'Membre introuvable' })
    }

    const membre = await prisma.membreArbre.update({
      where: { id },
      data: { photo_url: null }
    })

    res.json({ succes: true, data: membre })
  } catch (erreur) {
    console.error('Erreur suppression photo arbre:', erreur)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// PUT /api/arbre/:id - Modifier un membre
router.put('/:id', verifierToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    const { nom, date_naissance, date_deces, biographie, parent_id, photo_url } = req.body

    const existing = await membreDansFamille(id, req.utilisateur.famille_id)
    if (!existing) {
      return res.status(404).json({ succes: false, message: 'Membre introuvable' })
    }

    const data = {
      nom: nom || undefined,
      date_naissance: date_naissance ? new Date(date_naissance) : undefined,
      date_deces: date_deces ? new Date(date_deces) : undefined,
      biographie: biographie !== undefined ? biographie : undefined,
      parent_id: parent_id !== undefined && parent_id !== '' ? parseInt(parent_id, 10) : undefined
    }

    if (photo_url !== undefined) {
      if (photo_url != null && !isAllowedAvatarUrl(photo_url)) {
        return res.status(400).json({ succes: false, message: 'URL de photo invalide' })
      }
      data.photo_url = photo_url || null
    }

    const membre = await prisma.membreArbre.update({ where: { id }, data })

    res.json({ succes: true, data: membre })
  } catch (erreur) {
    console.error('Erreur PUT arbre:', erreur)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// DELETE /api/arbre/:id - Supprimer un membre (logique)
router.delete('/:id', verifierToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    const existing = await membreDansFamille(id, req.utilisateur.famille_id)
    if (!existing) {
      return res.status(404).json({ succes: false, message: 'Membre introuvable' })
    }

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