const express = require('express')
const prisma = require('../lib/prisma')
const { verifierToken } = require('../middleware/auth')
const { creerNotification } = require('./notifications')
const { displayName } = require('../lib/jwtPayload')

const router = express.Router()

// POST /api/reactions/:souvenir_id
router.post('/:souvenir_id', verifierToken, async (req, res) => {
  try {
    const souvenir_id = parseInt(req.params.souvenir_id)
    const { type } = req.body
    const utilisateur_id = req.utilisateur.id

    const typesValides = ['LIKE', 'COEUR', 'LARME', 'RIRE']
    if (!typesValides.includes(type)) {
      return res.status(400).json({
        succes: false,
        message: 'Type invalide — utilise LIKE, COEUR, LARME ou RIRE'
      })
    }

    const reaction = await prisma.reaction.upsert({
      where: {
        souvenir_id_utilisateur_id: { souvenir_id, utilisateur_id }
      },
      update: { type },
      create: { souvenir_id, utilisateur_id, type }
    })

    // NOTIFICATION : Informer l'auteur du souvenir
    try {
      const souvenir = await prisma.souvenir.findUnique({
        where: { id: souvenir_id },
        select: { auteur_id: true, titre: true }
      })

      if (souvenir && souvenir.auteur_id !== req.utilisateur.id) {
        let emoji = ''
        switch(type) {
          case 'COEUR': emoji = '❤️'; break
          case 'LIKE': emoji = '👍'; break
          case 'LARME': emoji = '😢'; break
          case 'RIRE': emoji = '😄'; break
        }
        await creerNotification(
          souvenir.auteur_id,
          'REACTION',
          `${displayName(req.utilisateur)} a réagi ${emoji} à « ${souvenir.titre} »`,
          souvenir_id
        )
      }
    } catch (notifErr) {
      console.error('Erreur envoi notification reaction:', notifErr)
    }

    res.json({ succes: true, data: reaction })
  } catch (erreur) {
    console.error('Erreur reaction:', erreur)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

// DELETE /api/reactions/:souvenir_id
router.delete('/:souvenir_id', verifierToken, async (req, res) => {
  try {
    const souvenir_id = parseInt(req.params.souvenir_id)
    const utilisateur_id = req.utilisateur.id

    await prisma.reaction.deleteMany({
      where: { souvenir_id, utilisateur_id }
    })

    res.json({ succes: true, message: 'Réaction supprimée' })
  } catch (erreur) {
    console.error('Erreur DELETE reaction:', erreur)
    res.status(500).json({ succes: false, message: 'Erreur serveur' })
  }
})

module.exports = router