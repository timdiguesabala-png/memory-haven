const fs = require('fs')
const path = require('path')
const { uploadBuffer, cloudinaryConfigured } = require('./cloudinary')

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads')

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

function fileExt(originalname) {
  const m = String(originalname || '').match(/\.([a-z0-9]{2,5})$/i)
  return m ? `.${m[1].toLowerCase()}` : ''
}

function fileExtNoDot(originalname) {
  const ext = fileExt(originalname)
  return ext ? ext.slice(1) : ''
}

function cloudinaryResourceType(mimetype, originalname) {
  const ext = fileExt(originalname)
  if (IMAGE_EXTS.has(ext) || mimetype?.startsWith('image/')) return 'image'
  if (mimetype?.startsWith('video/')) return 'video'
  if (mimetype?.startsWith('audio/')) return 'raw'
  return 'raw'
}

function safeBaseName(originalname) {
  const ext = fileExt(originalname)
  const base = path.basename(originalname || 'fichier', ext)
  return base.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 48) || 'fichier'
}

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true })
  }
}

function saveLocalFile(file) {
  ensureUploadDir()
  const ext = fileExt(file.originalname) || ''
  const name = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}${ext}`
  fs.writeFileSync(path.join(UPLOAD_DIR, name), file.buffer)
  return `${getPublicBaseUrl()}/uploads/${name}`
}

function mediaUploadReady() {
  if (cloudinaryConfigured()) return true
  return true
}

function mediaProvider() {
  if (cloudinaryConfigured()) return 'cloudinary'
  return 'local'
}

async function uploadToCloudinary(file) {
  const resource_type = cloudinaryResourceType(file.mimetype, file.originalname)
  const options = {
    resource_type,
    folder: 'memory_haven/souvenirs'
  }

  if (resource_type === 'raw') {
    const format = fileExtNoDot(file.originalname)
    options.public_id = `${safeBaseName(file.originalname)}_${Date.now()}`
    if (format) options.format = format
  }

  const result = await uploadBuffer(file.buffer, options)
  return result.secure_url
}

async function uploadOneFile(file) {
  if (!file?.buffer?.length) {
    throw new Error('Fichier vide ou invalide')
  }

  if (cloudinaryConfigured()) {
    try {
      return await uploadToCloudinary(file)
    } catch (cloudErr) {
      const msg = cloudErr.message || String(cloudErr)
      console.error('Cloudinary:', msg, '—', file.originalname, '→ stockage API')

      const resourceType = cloudinaryResourceType(file.mimetype, file.originalname)
      const isDoc =
        resourceType === 'raw' ||
        msg.includes('ZIP') ||
        msg.includes('pdf')

      if (resourceType === 'image' || isDoc || process.env.ALLOW_LOCAL_UPLOAD_FALLBACK === 'true') {
        return saveLocalFile(file)
      }

      if (process.env.NODE_ENV === 'production') {
        const err = new Error(`Upload Cloudinary : ${msg}`)
        err.status = 503
        throw err
      }

      return saveLocalFile(file)
    }
  }

  if (process.env.NODE_ENV === 'production') {
    const err = new Error(
      'Stockage média indisponible : ajoutez CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY et CLOUDINARY_API_SECRET sur Railway.'
    )
    err.status = 503
    throw err
  }

  return saveLocalFile(file)
}

async function uploadFiles(files) {
  const urls = []
  for (const file of files) {
    urls.push(await uploadOneFile(file))
  }
  return urls
}

ensureUploadDir()

module.exports = {
  UPLOAD_DIR,
  getPublicBaseUrl,
  mediaUploadReady,
  mediaProvider,
  uploadOneFile,
  uploadFiles,
  ensureUploadDir
}
