const express = require('express')
const multer = require('multer')
const { verifierToken } = require('../middleware/auth')
const { uploadBuffer } = require('../services/cloudinary')

const router = express.Router()

const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
})

function runUpload(resourceType, folder) {
  return (req, res) => {
    memoryUpload.single('fichier')(req, res, async (multerErr) => {
      if (multerErr) {
        console.error('Erreur multer:', multerErr)
        return res.status(400).json({
          succes: false,
          message: multerErr.message || 'Fichier invalide'
        })
      }

      try {
        if (!req.file) {
          return res.status(400).json({
            succes: false,
            message: 'Aucun fichier reçu'
          })
        }

        const result = await uploadBuffer(req.file.buffer, {
          resource_type: resourceType,
          folder: `memory-haven/${folder}`,
          public_id: `${folder}_${Date.now()}`
        })

        res.json({
          succes: true,
          fichier_url: result.secure_url,
          message: 'Fichier uploadé avec succès'
        })
      } catch (erreur) {
        console.error(`Erreur upload ${folder}:`, erreur)
        res.status(500).json({
          succes: false,
          message: erreur.message || 'Erreur lors de l\'upload Cloudinary'
        })
      }
    })
  }
}

router.post('/photo', verifierToken, runUpload('image', 'photos'))
router.post('/audio', verifierToken, runUpload('video', 'audios'))
router.post('/video', verifierToken, runUpload('video', 'videos'))

module.exports = router
