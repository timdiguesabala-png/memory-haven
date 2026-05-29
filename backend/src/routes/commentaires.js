const express = require('express')
const prisma = require('../lib/prisma')
const { verifierToken } = require('../middleware/auth')
const { notifierFamilleSaufAuteur } = require('./notifications')
const { displayName } = require('../lib/jwtPayload')

const router = express.Router()

// GET /api/commentaires/:souvenir_id
router.get('/:souvenir_id', verifierToken, async (req, res) => {
  try {
    const souvenir_id = parseInt(req.params.souvenir_id)
    
    const tousCommentaires = await prisma.commentaire.findMany({
      where: { souvenir_id, is_visible: true },
      include: {
        auteur: { select: { id: true, nom: true, prenom: true, avatar_url: true } }
      },
      orderBy: { created_at: 'asc' }
    })
    
    const commentairesValides = tousCommentaires.filter(c => c.auteur !== null)
    const commentairesMap = new Map()
    const racines = []
    
    commentairesValides.forEach(c => {
      commentairesMap.set(c.id, { ...c, reponses: [] })
    })
    
    commentairesValides.forEach(c => {
      if (c.parent_id && commentairesMap.has(c.parent_id)) {
        commentairesMap.get(c.parent_id).reponses.push(commentairesMap.get(c.id))
      } else if (!c.parent_id) {
        racines.push(commentairesMap.get(c.id))
      }
    })
    
    res.json({ succes: true, data: racines })
  } catch (erreur) {
    console.error('Erreur GET commentaires:', erreur)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// POST /api/commentaires/:souvenir_id
router.post('/:souvenir_id', verifierToken, async (req, res) => {
  try {
    const souvenir_id = parseInt(req.params.souvenir_id)
    const { contenu } = req.body

    if (!contenu || contenu.trim() === '') {
      return res.status(400).json({ 
        succes: false, 
        message: 'Le commentaire ne peut pas être vide' 
      })
    }

    const commentaire = await prisma.commentaire.create({
      data: {
        contenu: contenu.trim(),
        souvenir_id,
        auteur_id: req.utilisateur.id
      },
      include: { 
        auteur: { 
          select: { id: true, nom: true, prenom: true, avatar_url: true } 
        } 
      }
    })

    try {
      const souvenir = await prisma.souvenir.findUnique({
        where: { id: souvenir_id },
        select: { titre: true, famille_id: true }
      })
      if (souvenir && souvenir.famille_id === req.utilisateur.famille_id) {
        await notifierFamilleSaufAuteur(
          req.utilisateur.famille_id,
          req.utilisateur.id,
          'COMMENTAIRE',
          `${displayName(req.utilisateur)} a commenté « ${souvenir.titre} »`,
          souvenir_id
        )
      }
    } catch (notifErr) {
      console.error('Erreur envoi notification commentaire:', notifErr)
    }

    res.status(201).json({ succes: true, data: commentaire })
  } catch (erreur) {
    console.error('Erreur POST commentaire:', erreur)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// POST /api/commentaires/:id/repondre
router.post('/:id/repondre', verifierToken, async (req, res) => {
  try {
    const parent_id = parseInt(req.params.id)
    const { contenu } = req.body

    if (!contenu || contenu.trim() === '') {
      return res.status(400).json({ 
        succes: false, 
        message: 'La réponse ne peut pas être vide' 
      })
    }

    const commentaireParent = await prisma.commentaire.findFirst({
      where: { id: parent_id, is_visible: true }
    })

    if (!commentaireParent) {
      return res.status(404).json({ 
        succes: false, 
        message: 'Commentaire parent introuvable' 
      })
    }

    const reponse = await prisma.commentaire.create({
      data: {
        contenu: contenu.trim(),
        souvenir_id: commentaireParent.souvenir_id,
        parent_id,
        auteur_id: req.utilisateur.id
      },
      include: { 
        auteur: { 
          select: { id: true, nom: true, prenom: true, avatar_url: true } 
        } 
      }
    })

    try {
      const souvenir = await prisma.souvenir.findUnique({
        where: { id: commentaireParent.souvenir_id },
        select: { titre: true, famille_id: true }
      })
      if (souvenir && souvenir.famille_id === req.utilisateur.famille_id) {
        await notifierFamilleSaufAuteur(
          req.utilisateur.famille_id,
          req.utilisateur.id,
          'COMMENTAIRE',
          `${displayName(req.utilisateur)} a répondu à un commentaire sur « ${souvenir.titre} »`,
          commentaireParent.souvenir_id
        )
      }
    } catch (notifErr) {
      console.error('Erreur envoi notification réponse:', notifErr)
    }

    res.status(201).json({ succes: true, data: reponse })
  } catch (erreur) {
    console.error('Erreur réponse:', erreur)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// DELETE /api/commentaires/:id
router.delete('/:id', verifierToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    
    const commentaire = await prisma.commentaire.findFirst({
      where: { id, is_visible: true }
    })

    if (!commentaire) {
      return res.status(404).json({ 
        succes: false, 
        message: 'Commentaire introuvable' 
      })
    }

    if (commentaire.auteur_id !== req.utilisateur.id) {
      const estAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(req.utilisateur.role)
      if (!estAdmin) {
        return res.status(403).json({ 
          succes: false, 
          message: 'Vous ne pouvez pas supprimer ce commentaire' 
        })
      }
    }

    await prisma.commentaire.update({
      where: { id },
      data: { is_visible: false }
    })
    
    res.json({ succes: true, message: 'Commentaire supprimé' })
  } catch (erreur) {
    console.error('Erreur DELETE commentaire:', erreur)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

module.exports = router