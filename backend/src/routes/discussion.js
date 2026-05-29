const express = require('express')
const prisma = require('../lib/prisma')
const { verifierToken } = require('../middleware/auth')
const { estAdmin } = require('../lib/authHelpers')
const { notifierFamilleSaufAuteur } = require('./notifications')
const { displayName } = require('../lib/jwtPayload')

const router = express.Router()

const includeMessage = {
  utilisateur: {
    select: { id: true, nom: true, prenom: true, avatar_url: true }
  }
}

function mapMessage(m) {
  return {
    ...m,
    auteur_id: m.utilisateur_id,
    auteur: m.utilisateur,
    created_at: m.createdAt
  }
}

// GET /api/discussion
router.get('/', verifierToken, async (req, res) => {
  try {
    const messages = await prisma.messageDiscussion.findMany({
      where: { famille_id: req.utilisateur.famille_id },
      include: includeMessage,
      orderBy: { createdAt: 'asc' },
      take: 100
    })
    res.json({ succes: true, data: messages.map(mapMessage) })
  } catch (err) {
    console.error('Erreur chargement messages:', err)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// POST /api/discussion/messages
router.post('/messages', verifierToken, async (req, res) => {
  try {
    const { contenu } = req.body
    if (!contenu || contenu.trim() === '') {
      return res.status(400).json({ succes: false, message: 'Le message ne peut pas être vide' })
    }

    const message = await prisma.messageDiscussion.create({
      data: {
        contenu: contenu.trim(),
        famille_id: req.utilisateur.famille_id,
        utilisateur_id: req.utilisateur.id
      },
      include: includeMessage
    })

    const auteurLabel = displayName(req.utilisateur)
    const extrait = contenu.trim().slice(0, 60) + (contenu.length > 60 ? '…' : '')
    await notifierFamilleSaufAuteur(
      req.utilisateur.famille_id,
      req.utilisateur.id,
      'DISCUSSION',
      `${auteurLabel} a écrit dans la discussion : « ${extrait} »`,
      null
    )

    res.status(201).json({ succes: true, data: mapMessage(message) })
  } catch (err) {
    console.error('Erreur création message:', err)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// POST /api/discussion/repondre
router.post('/repondre', verifierToken, async (req, res) => {
  try {
    const { message_id, contenu } = req.body
    if (!contenu || contenu.trim() === '') {
      return res.status(400).json({ succes: false, message: 'La réponse ne peut pas être vide' })
    }

    const original = await prisma.messageDiscussion.findFirst({
      where: { id: parseInt(message_id, 10), famille_id: req.utilisateur.famille_id },
      include: { utilisateur: { select: { prenom: true, nom: true } } }
    })
    if (!original) {
      return res.status(404).json({ succes: false, message: 'Message original introuvable' })
    }

    const prefix = `↩ ${original.utilisateur.prenom}: "${original.contenu.slice(0, 80)}${original.contenu.length > 80 ? '…' : ''}"\n`
    const reponse = await prisma.messageDiscussion.create({
      data: {
        contenu: prefix + contenu.trim(),
        famille_id: req.utilisateur.famille_id,
        utilisateur_id: req.utilisateur.id
      },
      include: includeMessage
    })

    await notifierFamilleSaufAuteur(
      req.utilisateur.famille_id,
      req.utilisateur.id,
      'DISCUSSION',
      `${displayName(req.utilisateur)} a répondu dans la discussion`,
      null
    )

    res.status(201).json({ succes: true, data: mapMessage(reponse) })
  } catch (err) {
    console.error('Erreur réponse:', err)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// DELETE /api/discussion/messages/:id
router.delete('/messages/:id', verifierToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    const message = await prisma.messageDiscussion.findFirst({
      where: { id, famille_id: req.utilisateur.famille_id }
    })
    if (!message) {
      return res.status(404).json({ succes: false, message: 'Message introuvable' })
    }
    if (message.utilisateur_id !== req.utilisateur.id && !estAdmin(req.utilisateur.role)) {
      return res.status(403).json({ succes: false, message: 'Suppression non autorisée' })
    }

    await prisma.messageDiscussion.delete({ where: { id } })
    res.json({ succes: true, message: 'Message supprimé' })
  } catch (err) {
    console.error('Erreur suppression message:', err)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

module.exports = router
