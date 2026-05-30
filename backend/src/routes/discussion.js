const express = require('express')
const prisma = require('../lib/prisma')
const { verifierToken } = require('../middleware/auth')
const { exigerEcriture } = require('../middleware/roles')
const { estAdmin } = require('../lib/authHelpers')
const { notifierFamilleSaufAuteur } = require('./notifications')
const { displayName } = require('../lib/jwtPayload')
const { toggleReaction } = require('../lib/discussionReactions')
const {
  markDiscussionRead,
  buildReadContext,
  statutForMessage
} = require('../lib/discussionRead')
const {
  mapMessage,
  emitNewMessage,
  emitMessageUpdated,
  emitMessageDeleted,
  emitDiscussionRead
} = require('../lib/discussionSocket')

const router = express.Router()

const includeMessage = {
  utilisateur: {
    select: { id: true, nom: true, prenom: true, avatar_url: true }
  }
}

function messagePayloadValid(contenu, image_url, audio_url) {
  const text = (contenu || '').trim()
  const img = (image_url || '').trim()
  const audio = (audio_url || '').trim()
  return text.length > 0 || img.length > 0 || audio.length > 0
}

function mapWithRead(message, viewerId, readStates, otherMemberIds) {
  const statut = statutForMessage(message, viewerId, readStates, otherMemberIds)
  return mapMessage(message, { statut_lecture: statut })
}

// GET /api/discussion
router.get('/', verifierToken, async (req, res) => {
  try {
    const { readStates, otherMemberIds, cursors } = await buildReadContext(
      req.utilisateur.famille_id,
      req.utilisateur.id
    )
    const messages = await prisma.messageDiscussion.findMany({
      where: { famille_id: req.utilisateur.famille_id },
      include: includeMessage,
      orderBy: { createdAt: 'asc' },
      take: 100
    })
    res.json({
      succes: true,
      data: messages.map((m) => mapWithRead(m, req.utilisateur.id, readStates, otherMemberIds)),
      read_cursors: cursors,
      other_member_ids: otherMemberIds
    })
  } catch (err) {
    console.error('Erreur chargement messages:', err)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// POST /api/discussion/read
router.post('/read', verifierToken, async (req, res) => {
  try {
    const last_message_id = parseInt(req.body.last_message_id, 10) || 0
    await markDiscussionRead(
      req.utilisateur.id,
      req.utilisateur.famille_id,
      last_message_id
    )
    emitDiscussionRead(req.utilisateur.famille_id, {
      utilisateur_id: req.utilisateur.id,
      last_message_id
    })
    res.json({ succes: true, last_message_id })
  } catch (err) {
    console.error('Erreur lecture discussion:', err)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// POST /api/discussion/messages
router.post('/messages', verifierToken, exigerEcriture, async (req, res) => {
  try {
    const contenu = (req.body.contenu || '').trim()
    const image_url = (req.body.image_url || '').trim() || null
    const audio_url = (req.body.audio_url || '').trim() || null
    const audio_duration = req.body.audio_duration
      ? parseInt(req.body.audio_duration, 10)
      : null

    if (!messagePayloadValid(contenu, image_url, audio_url)) {
      return res.status(400).json({ succes: false, message: 'Message, photo ou vocal requis' })
    }

    const message = await prisma.messageDiscussion.create({
      data: {
        contenu,
        image_url,
        audio_url,
        audio_duration: Number.isFinite(audio_duration) ? audio_duration : null,
        famille_id: req.utilisateur.famille_id,
        utilisateur_id: req.utilisateur.id
      },
      include: includeMessage
    })

    const auteurLabel = displayName(req.utilisateur)
    let notifMsg = `${auteurLabel} a écrit dans la discussion`
    if (audio_url) notifMsg = `${auteurLabel} a envoyé un message vocal`
    else if (image_url) notifMsg = `${auteurLabel} a envoyé une photo`
    else if (contenu) {
      notifMsg = `${auteurLabel} : « ${contenu.slice(0, 60)}${contenu.length > 60 ? '…' : ''} »`
    }

    await notifierFamilleSaufAuteur(
      req.utilisateur.famille_id,
      req.utilisateur.id,
      'DISCUSSION',
      notifMsg,
      null
    )

    emitNewMessage(req.utilisateur.famille_id, message, { statut_lecture: 'envoye' })
    res.status(201).json({
      succes: true,
      data: mapMessage(message, { statut_lecture: 'envoye' })
    })
  } catch (err) {
    console.error('Erreur création message:', err)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// POST /api/discussion/repondre
router.post('/repondre', verifierToken, exigerEcriture, async (req, res) => {
  try {
    const { message_id, contenu } = req.body
    const text = (contenu || '').trim()
    if (!text) {
      return res.status(400).json({ succes: false, message: 'La réponse ne peut pas être vide' })
    }

    const original = await prisma.messageDiscussion.findFirst({
      where: { id: parseInt(message_id, 10), famille_id: req.utilisateur.famille_id },
      include: { utilisateur: { select: { prenom: true, nom: true } } }
    })
    if (!original) {
      return res.status(404).json({ succes: false, message: 'Message original introuvable' })
    }

    let cite = original.contenu?.slice(0, 80) || ''
    if (!cite && original.image_url) cite = '📷 Photo'
    if (!cite && original.audio_url) cite = '🎤 Vocal'
    const prefix = `↩ ${original.utilisateur.prenom}: "${cite}${original.contenu?.length > 80 ? '…' : ''}"\n`
    const reponse = await prisma.messageDiscussion.create({
      data: {
        contenu: prefix + text,
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

    emitNewMessage(req.utilisateur.famille_id, reponse, { statut_lecture: 'envoye' })
    res.status(201).json({
      succes: true,
      data: mapMessage(reponse, { statut_lecture: 'envoye' })
    })
  } catch (err) {
    console.error('Erreur réponse:', err)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// POST /api/discussion/messages/:id/reaction
router.post('/messages/:id/reaction', verifierToken, exigerEcriture, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    const { emoji } = req.body
    const message = await prisma.messageDiscussion.findFirst({
      where: { id, famille_id: req.utilisateur.famille_id }
    })
    if (!message) {
      return res.status(404).json({ succes: false, message: 'Message introuvable' })
    }

    const reactions_json = toggleReaction(
      message.reactions_json,
      req.utilisateur.id,
      emoji
    )

    const updated = await prisma.messageDiscussion.update({
      where: { id },
      data: { reactions_json },
      include: includeMessage
    })

    const { readStates, otherMemberIds } = await buildReadContext(
      req.utilisateur.famille_id,
      req.utilisateur.id
    )
    const mapped = mapWithRead(updated, req.utilisateur.id, readStates, otherMemberIds)
    emitMessageUpdated(req.utilisateur.famille_id, updated, {
      statut_lecture: mapped.statut_lecture
    })
    res.json({ succes: true, data: mapped })
  } catch (err) {
    console.error('Erreur réaction:', err)
    res.status(err.status || 500).json({ succes: false, message: err.message || 'Erreur serveur' })
  }
})

// DELETE /api/discussion/messages/:id
router.delete('/messages/:id', verifierToken, exigerEcriture, async (req, res) => {
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
    emitMessageDeleted(req.utilisateur.famille_id, id)
    res.json({ succes: true, message: 'Message supprimé' })
  } catch (err) {
    console.error('Erreur suppression message:', err)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

module.exports = router
