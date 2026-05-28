/**
 * Routes legacy /api/upload/* — conservées pour les anciens builds Vercel.
 * Même moteur que POST /api/souvenirs (mediaStorage).
 */
const express = require('express')
const { verifierToken } = require('../middleware/auth')
const { upload, collectUploadedFiles } = require('../middleware/multerMedia')
const { uploadOneFile } = require('../services/mediaStorage')

const router = express.Router()

function handleLegacyUpload(req, res) {
  upload.single('fichier')(req, res, async (multerErr) => {
    if (multerErr) {
      return res.status(400).json({ succes: false, message: multerErr.message || 'Fichier invalide' })
    }

    const files = collectUploadedFiles(req)
    if (files.length === 0) {
      return res.status(400).json({ succes: false, message: 'Aucun fichier reçu (champ: fichier)' })
    }

    try {
      const fichier_url = await uploadOneFile(files[0])
      res.json({
        succes: true,
        fichier_url,
        message: 'Fichier uploadé. Préférez POST /api/souvenirs pour les nouveaux clients.'
      })
    } catch (erreur) {
      console.error('Erreur upload legacy:', erreur.message)
      res.status(erreur.message?.includes('Cloudinary') ? 503 : 500).json({
        succes: false,
        message: erreur.message || 'Erreur upload'
      })
    }
  })
}

router.post('/photo', verifierToken, handleLegacyUpload)
router.post('/audio', verifierToken, handleLegacyUpload)
router.post('/video', verifierToken, handleLegacyUpload)

module.exports = router
