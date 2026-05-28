const fs = require('fs')
const path = require('path')
const { uploadBuffer, cloudinaryConfigured } = require('./cloudinary')

const UPLOAD_DIR = path.join(__dirname, '../../uploads')

function getPublicBaseUrl() {
  if (process.env.PUBLIC_API_URL) {
    return process.env.PUBLIC_API_URL.replace(/\/$/, '')
  }
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
  }
  const port = process.env.PORT || 3000
  return `http://localhost:${port}`
}

function cloudinaryResourceType(mimetype) {
  if (mimetype?.startsWith('image/')) return 'image'
  if (mimetype?.startsWith('video/')) return 'video'
  if (mimetype?.startsWith('audio/')) return 'raw'
  return 'auto'
}

function mediaUploadReady() {
  if (cloudinaryConfigured()) return true
  return process.env.NODE_ENV !== 'production'
}

function mediaProvider() {
  if (cloudinaryConfigured()) return 'cloudinary'
  if (process.env.NODE_ENV !== 'production') return 'local'
  return 'none'
}

async function uploadOneFile(file) {
  if (!file?.buffer?.length) {
    throw new Error('Fichier vide ou invalide')
  }

  if (cloudinaryConfigured()) {
    const result = await uploadBuffer(file.buffer, {
      resource_type: cloudinaryResourceType(file.mimetype),
      folder: 'memory_haven/souvenirs'
    })
    return result.secure_url
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'Cloudinary requis en production. Ajoutez CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY et CLOUDINARY_API_SECRET sur Railway.'
    )
  }

  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true })
  }
  const ext = path.extname(file.originalname || '') || ''
  const name = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}${ext}`
  fs.writeFileSync(path.join(UPLOAD_DIR, name), file.buffer)
  return `${getPublicBaseUrl()}/uploads/${name}`
}

async function uploadFiles(files) {
  const urls = []
  for (const file of files) {
    urls.push(await uploadOneFile(file))
  }
  return urls
}

module.exports = {
  UPLOAD_DIR,
  getPublicBaseUrl,
  mediaUploadReady,
  mediaProvider,
  uploadOneFile,
  uploadFiles
}
