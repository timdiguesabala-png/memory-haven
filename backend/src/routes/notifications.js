const express = require('express')
const prisma = require('../lib/prisma')
const { verifierToken } = require('../middleware/auth')

const router = express.Router()

// Fonction utilitaire pour créer une notification
const creerNotification = async (destinataire_id, type, message, souvenir_id = null) => {
  try {
    await prisma.notification.create({
      data: {
        type,
        message,
        destinataire_id,
        souvenir_id
      }
    })
    console.log(`📢 Notification créée pour ${destinataire_id}: ${message}`)
  } catch (err) {
    console.error('Erreur création notification:', err)
  }
}

// GET /api/notifications - Mes notifications
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
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// PUT /api/notifications/:id/lire
router.put('/:id/lire', verifierToken, async (req, res) => {
  try {
    await prisma.notification.update({
      where: { id: parseInt(req.params.id) },
      data: { lu: true }
    })
    res.json({ succes: true })
  } catch (err) {
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// PUT /api/notifications/lire-tout
router.put('/lire-tout', verifierToken, async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { destinataire_id: req.utilisateur.id, lu: false },
      data: { lu: true }
    })
    res.json({ succes: true })
  } catch (err) {
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

module.exports = { router, creerNotification }