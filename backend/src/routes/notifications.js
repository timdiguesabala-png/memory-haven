const express = require('express')
const prisma = require('../lib/prisma')
const { verifierToken } = require('../middleware/auth')
const { emitNewNotification } = require('../lib/notificationSocket')

const router = express.Router()

const creerNotification = async (destinataire_id, type, message, souvenir_id = null) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        type,
        message,
        destinataire_id,
        souvenir_id
      }
    })
    emitNewNotification(destinataire_id, notification)
    console.log(`📢 Notification → ${destinataire_id}: ${message}`)
    return notification
  } catch (err) {
    console.error('Erreur création notification:', err.message)
    return null
  }
}

async function notifierFamilleSaufAuteur(famille_id, auteur_id, type, message, souvenir_id = null) {
  const membres = await prisma.utilisateur.findMany({
    where: {
      famille_id,
      is_active: true,
      id: { not: auteur_id }
    },
    select: { id: true }
  })
  await Promise.all(
    membres.map((m) => creerNotification(m.id, type, message, souvenir_id))
  )
}

router.get('/', verifierToken, async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { destinataire_id: req.utilisateur.id },
      include: { souvenir: { select: { id: true, titre: true } } },
      orderBy: { created_at: 'desc' },
      take: 50
    })
    res.json({ succes: true, data: notifications })
  } catch (err) {
    console.error('Erreur notifications GET:', err)
    res.status(500).json({ succes: false, message: err.message || 'Erreur serveur' })
  }
})

router.put('/lire-tout', verifierToken, async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { destinataire_id: req.utilisateur.id, lu: false },
      data: { lu: true }
    })
    res.json({ succes: true })
  } catch (err) {
    res.status(500).json({ succes: false, message: err.message || 'Erreur serveur' })
  }
})

router.put('/:id/lire', verifierToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (Number.isNaN(id)) {
      return res.status(400).json({ succes: false, message: 'Identifiant invalide' })
    }

    const notif = await prisma.notification.findFirst({
      where: { id, destinataire_id: req.utilisateur.id }
    })
    if (!notif) {
      return res.status(404).json({ succes: false, message: 'Notification introuvable' })
    }

    await prisma.notification.update({
      where: { id },
      data: { lu: true }
    })
    res.json({ succes: true })
  } catch (err) {
    res.status(500).json({ succes: false, message: err.message || 'Erreur serveur' })
  }
})

module.exports = { router, creerNotification, notifierFamilleSaufAuteur }
