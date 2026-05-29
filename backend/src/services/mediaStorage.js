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

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.bmp'])

function extname(originalname) {
  const m = String(originalname || '').match(/\.([a-z0-9]{2,5})$/i)
  return m ? `.${m[1].toLowerCase()}` : ''
}

function cloudinaryResourceType(mimetype, originalname) {
  const ext = extname(originalname)
  if (IMAGE_EXTS.has(ext) || mimetype?.startsWith('image/')) return 'image'
  if (mimetype?.startsWith('video/')) return 'video'
  if (mimetype?.startsWith('audio/')) return 'raw'
  return 'raw'
}

function publicIdForRaw(originalname) {
  const ext = extname(originalname) || ''
  const base = path
    .basename(originalname || 'document', ext)
    .replace(/[^\w\-àâäéèêëïîôùûüçÀ-ÖØ-öø-ÿ]/gi, '_')
    .slice(0, 72)
  return `${base || 'document'}_${Date.now()}${ext}`
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
    const resource_type = cloudinaryResourceType(file.mimetype, file.originalname)
    const options = {
      resource_type,
      folder: 'memory_haven/souvenirs'
    }
    if (resource_type === 'raw') {
      options.public_id = publicIdForRaw(file.originalname)
    }
    try {
      const result = await uploadBuffer(file.buffer, options)
      return result.secure_url
    } catch (cloudErr) {
      if (process.env.NODE_ENV === 'production') throw cloudErr
      console.warn('Cloudinary:', cloudErr.message, '→ stockage local')
    }
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
