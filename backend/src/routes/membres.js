const express = require('express')
const bcrypt = require('bcrypt')
const prisma = require('../lib/prisma')
const { verifierToken } = require('../middleware/auth')
const { creerNotification } = require('./notifications')
const { estAdmin } = require('../lib/authHelpers')
const { serializeUtilisateur, isAllowedAvatarUrl } = require('../lib/serializeUtilisateur')
const { buildRegisterInviteUrl } = require('../lib/frontendUrl')

const router = express.Router()

const profilSelect = {
  id: true,
  nom: true,
  prenom: true,
  email: true,
  role: true,
  famille_id: true,
  avatar_url: true,
  biographie: true,
  derniere_connexion: true
}

// GET /api/membres/code-invitation — code à partager (tous les membres)
router.get('/code-invitation', verifierToken, async (req, res) => {
  try {
    const famille = await prisma.famille.findUnique({
      where: { id: req.utilisateur.famille_id },
      select: { nom: true, code_invitation: true }
    })
    if (!famille) {
      return res.status(404).json({ succes: false, message: 'Famille introuvable' })
    }
    res.json({
      succes: true,
      data: {
        nom: famille.nom,
        code: famille.code_invitation,
        lien: buildRegisterInviteUrl({ code: famille.code_invitation })
      }
    })
  } catch (erreur) {
    console.error('Erreur code invitation:', erreur)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// GET /api/membres - Liste tous les membres de la famille
router.get('/', verifierToken, async (req, res) => {
  try {
    const membres = await prisma.utilisateur.findMany({
      where: {
        famille_id: req.utilisateur.famille_id,
        is_active: true
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

// PUT /api/membres/me — profil (nom, prénom, bio, email)
router.put('/me', verifierToken, async (req, res) => {
  try {
    const { nom, prenom, biographie, email } = req.body
    const data = {}

    if (nom != null && String(nom).trim()) data.nom = String(nom).trim()
    if (prenom != null && String(prenom).trim()) data.prenom = String(prenom).trim()
    if (biographie !== undefined) {
      const bio = String(biographie || '').trim()
      data.biographie = bio.length ? bio.slice(0, 500) : null
    }

    if (email != null) {
      const emailNorm = String(email).trim().toLowerCase()
      if (!emailNorm.includes('@')) {
        return res.status(400).json({ succes: false, message: 'Email invalide' })
      }
      const pris = await prisma.utilisateur.findFirst({
        where: { email: emailNorm, id: { not: req.utilisateur.id } }
      })
      if (pris) {
        return res.status(400).json({ succes: false, message: 'Cet email est déjà utilisé' })
      }
      data.email = emailNorm
    }

    if (!Object.keys(data).length) {
      return res.status(400).json({ succes: false, message: 'Aucune modification' })
    }

    let updated
    try {
      updated = await prisma.utilisateur.update({
        where: { id: req.utilisateur.id },
        data,
        select: profilSelect
      })
    } catch (err) {
      if (data.biographie !== undefined && /biographie|Unknown arg/i.test(err.message)) {
        delete data.biographie
        if (!Object.keys(data).length) {
          return res.status(400).json({
            succes: false,
            message: 'Biographie non disponible — redéployez l’API Railway'
          })
        }
        updated = await prisma.utilisateur.update({
          where: { id: req.utilisateur.id },
          data,
          select: profilSelect
        })
      } else {
        throw err
      }
    }

    const famille = await prisma.famille.findUnique({
      where: { id: updated.famille_id },
      select: { nom: true }
    })

    res.json({
      succes: true,
      data: serializeUtilisateur(updated, famille?.nom)
    })
  } catch (erreur) {
    console.error('Erreur PUT /me:', erreur)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// PUT /api/membres/me/password
router.put('/me/password', verifierToken, async (req, res) => {
  try {
    const { current_password, new_password } = req.body
    if (!current_password || !new_password) {
      return res.status(400).json({
        succes: false,
        message: 'Mot de passe actuel et nouveau requis'
      })
    }
    if (String(new_password).length < 6) {
      return res.status(400).json({
        succes: false,
        message: 'Le nouveau mot de passe doit faire au moins 6 caractères'
      })
    }

    const user = await prisma.utilisateur.findUnique({
      where: { id: req.utilisateur.id }
    })
    const ok = await bcrypt.compare(current_password, user.password)
    if (!ok) {
      return res.status(403).json({ succes: false, message: 'Mot de passe actuel incorrect' })
    }

    const hash = await bcrypt.hash(new_password, 10)
    await prisma.utilisateur.update({
      where: { id: req.utilisateur.id },
      data: { password: hash }
    })

    res.json({ succes: true, message: 'Mot de passe mis à jour' })
  } catch (erreur) {
    console.error('Erreur mot de passe:', erreur)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// PUT /api/membres/me/avatar — photo de profil (utilisateur connecté)
router.put('/me/avatar', verifierToken, async (req, res) => {
  try {
    const { avatar_url } = req.body
    if (avatar_url != null && !isAllowedAvatarUrl(avatar_url)) {
      return res.status(400).json({
        succes: false,
        message: 'URL de photo invalide'
      })
    }

    const updated = await prisma.utilisateur.update({
      where: { id: req.utilisateur.id },
      data: { avatar_url: avatar_url || null },
      select: profilSelect
    })

    const famille = await prisma.famille.findUnique({
      where: { id: updated.famille_id },
      select: { nom: true }
    })
    res.json({ succes: true, data: serializeUtilisateur(updated, famille?.nom) })
  } catch (erreur) {
    console.error('Erreur avatar:', erreur)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// DELETE /api/membres/me/avatar — supprimer la photo
router.delete('/me/avatar', verifierToken, async (req, res) => {
  try {
    const updated = await prisma.utilisateur.update({
      where: { id: req.utilisateur.id },
      data: { avatar_url: null },
      select: profilSelect
    })
    const famille = await prisma.famille.findUnique({
      where: { id: updated.famille_id },
      select: { nom: true }
    })
    res.json({ succes: true, data: serializeUtilisateur(updated, famille?.nom) })
  } catch (erreur) {
    console.error('Erreur suppression avatar:', erreur)
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

    const lienInvitation = buildRegisterInviteUrl({
      code: famille.code_invitation,
      email,
      role: role || 'MEMBRE'
    })

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