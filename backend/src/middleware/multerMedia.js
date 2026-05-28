const multer = require('multer')

const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }
})

const uploadMedia = upload.fields([
  { name: 'fichiers', maxCount: 20 },
  { name: 'fichier', maxCount: 1 },
  { name: 'file', maxCount: 1 }
])

function collectUploadedFiles(req) {
  const list = []
  if (req.files?.fichiers) list.push(...req.files.fichiers)
  if (req.files?.fichier) list.push(...req.files.fichier)
  if (req.files?.file) list.push(...req.files.file)
  if (req.file) list.push(req.file)
  return list
}

function parseMultipart(req, res, next) {
  const isMultipart = (req.headers['content-type'] || '').includes('multipart/form-data')
  if (!isMultipart) return next()
  uploadMedia(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        succes: false,
        message: err.message || 'Fichier invalide (max 50 Mo)'
      })
    }
    next()
  })
}

module.exports = { upload, uploadMedia, collectUploadedFiles, parseMultipart }
