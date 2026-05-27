const express = require('express')
const { verifierToken } = require('../middleware/auth')
const { uploadPhoto, uploadAudio, uploadVideo } = require('../services/cloudinary')

const router = express.Router()

// POST /api/upload/photo
router.post('/photo', verifierToken, uploadPhoto.single('fichier'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        succes: false,
        message: 'Aucun fichier reçu'
      })
    }

    res.json({
      succes: true,
      fichier_url: req.file.path,
      message: 'Photo uploadée avec succès'
    })

  } catch (erreur) {
    console.error('Erreur upload photo:', erreur)
    res.status(500).json({ succes: false, message: 'Erreur upload' })
  }
})

// POST /api/upload/audio
router.post('/audio', verifierToken, uploadAudio.single('fichier'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        succes: false,
        message: 'Aucun fichier reçu'
      })
    }

    res.json({
      succes: true,
      fichier_url: req.file.path,
      message: 'Audio uploadé avec succès'
    })

  } catch (erreur) {
    console.error('Erreur upload audio:', erreur)
    res.status(500).json({ succes: false, message: 'Erreur upload' })
  }
})

// POST /api/upload/video
router.post('/video', verifierToken, uploadVideo.single('fichier'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        succes: false,
        message: 'Aucun fichier reçu'
      })
    }

    res.json({
      succes: true,
      fichier_url: req.file.path,
      message: 'Vidéo uploadée avec succès'
    })

  } catch (erreur) {
    console.error('Erreur upload video:', erreur)
    res.status(500).json({ succes: false, message: 'Erreur upload' })
  }
})

module.exports = router