const express = require('express')
const prisma = require('../lib/prisma')
const { verifierToken } = require('../middleware/auth')
const { exigerEcriture } = require('../middleware/roles')
const { souvenirDansFamille } = require('../lib/souvenirAccess')
const { notifierFamilleSaufAuteur } = require('./notifications')
const { displayName } = require('../lib/jwtPayload')

const router = express.Router()

// POST /api/reactions/:souvenir_id
router.post('/:souvenir_id', verifierToken, exigerEcriture, async (req, res) => {
  try {
    const souvenir_id = parseInt(req.params.souvenir_id, 10)
    const { type } = req.body
    const utilisateur_id = req.utilisateur.id

    const typesValides = ['LIKE', 'COEUR', 'LARME', 'RIRE']
    if (!typesValides.includes(type)) {
      return res.status(400).json({
        succes: false,
        message: 'Type invalide — utilise LIKE, COEUR, LARME ou RIRE'
      })
    }

    const souvenir = await souvenirDansFamille(souvenir_id, req.utilisateur.famille_id)
    if (!souvenir) {
      return res.status(404).json({ succes: false, message: 'Souvenir introuvable' })
    }

    const reaction = await prisma.reaction.upsert({
      where: {
        souvenir_id_utilisateur_id: { souvenir_id, utilisateur_id }
      },
      update: { type },
      create: { souvenir_id, utilisateur_id, type }
    })

    try {
      let emoji = '👍'
      if (type === 'COEUR') emoji = '❤️'
      if (type === 'LARME') emoji = '😢'
      if (type === 'RIRE') emoji = '😄'
      await notifierFamilleSaufAuteur(
        req.utilisateur.famille_id,
        req.utilisateur.id,
        'REACTION',
        `${displayName(req.utilisateur)} a réagi ${emoji} à « ${souvenir.titre} »`,
        souvenir_id
      )
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
router.delete('/:souvenir_id', verifierToken, exigerEcriture, async (req, res) => {
  try {
    const souvenir_id = parseInt(req.params.souvenir_id, 10)
    const utilisateur_id = req.utilisateur.id

    const souvenir = await souvenirDansFamille(souvenir_id, req.utilisateur.famille_id)
    if (!souvenir) {
      return res.status(404).json({ succes: false, message: 'Souvenir introuvable' })
    }

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
