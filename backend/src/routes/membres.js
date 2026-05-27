const express = require('express')
const prisma = require('../lib/prisma')
const { verifierToken } = require('../middleware/auth')
const { creerNotification } = require('./notifications')
const { estAdmin } = require('../lib/authHelpers')

const router = express.Router()

// GET /api/membres - Liste tous les membres de la famille
router.get('/', verifierToken, async (req, res) => {
  try {
    const membres = await prisma.utilisateur.findMany({
      where: {
        famille_id: req.utilisateur.famille_id,
        is_visible: true
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        role: true,
        is_active: true,
        derniere_connexion: true,
        avatar_url: true
      },
      orderBy: { created_at: 'asc' }
    })

    res.json({ succes: true, data: membres })
  } catch (erreur) {
    console.error('Erreur GET membres:', erreur)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// PUT /api/membres/:id/role - Changer le rôle d'un membre
router.put('/:id/role', verifierToken, async (req, res) => {
  try {
    if (!estAdmin(req.utilisateur.role)) {
      return res.status(403).json({ succes: false, message: 'Action réservée aux administrateurs' })
    }

    const id = parseInt(req.params.id)
    const { role } = req.body

    const cible = await prisma.utilisateur.findFirst({
      where: { id, famille_id: req.utilisateur.famille_id }
    })
    if (!cible) {
      return res.status(404).json({ succes: false, message: 'Membre introuvable' })
    }

    if (!['ADMIN', 'MEMBRE', 'LECTEUR'].includes(role)) {
      return res.status(400).json({
        succes: false,
        message: 'Rôle invalide'
      })
    }

    const membre = await prisma.utilisateur.update({
      where: { id },
      data: { role }
    })

    // NOTIFICATION : Informer le membre de son changement de rôle
    try {
      await creerNotification(
        id,
        'INVITATION',
        `Votre rôle a été changé en ${role}`,
        null
      )
    } catch (notifErr) {
      console.error('Erreur envoi notification role:', notifErr)
    }

    res.json({ succes: true, data: membre })
  } catch (erreur) {
    console.error('Erreur changement rôle:', erreur)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// PUT /api/membres/:id/desactiver - Désactiver un membre
router.put('/:id/desactiver', verifierToken, async (req, res) => {
  try {
    if (!estAdmin(req.utilisateur.role)) {
      return res.status(403).json({ succes: false, message: 'Action réservée aux administrateurs' })
    }

    const id = parseInt(req.params.id)
    const cible = await prisma.utilisateur.findFirst({
      where: { id, famille_id: req.utilisateur.famille_id }
    })
    if (!cible) {
      return res.status(404).json({ succes: false, message: 'Membre introuvable' })
    }

    await prisma.utilisateur.update({
      where: { id },
      data: { is_active: false }
    })

    res.json({ succes: true, message: 'Membre désactivé' })
  } catch (erreur) {
    console.error('Erreur désactivation:', erreur)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// POST /api/membres/inviter - Générer un lien d'invitation
router.post('/inviter', verifierToken, async (req, res) => {
  try {
    if (!estAdmin(req.utilisateur.role)) {
      return res.status(403).json({ succes: false, message: 'Action réservée aux administrateurs' })
    }

    const { email, role } = req.body

    if (!email) {
      return res.status(400).json({
        succes: false,
        message: 'Email obligatoire'
      })
    }

    const famille = await prisma.famille.findUnique({
      where: { id: req.utilisateur.famille_id }
    })

    const lienInvitation = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/register?code=${famille.code_invitation}&email=${encodeURIComponent(email)}&role=${role || 'MEMBRE'}`

    res.json({
      succes: true,
      message: 'Lien d\'invitation généré',
      lien: lienInvitation
    })
  } catch (erreur) {
    console.error('Erreur invitation:', erreur)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

module.exports = router