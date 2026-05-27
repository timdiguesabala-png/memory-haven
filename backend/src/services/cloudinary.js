const cloudinary = require('cloudinary').v2

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

function cloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  )
}

function uploadBuffer(buffer, options = {}) {
  if (!cloudinaryConfigured()) {
    return Promise.reject(
      new Error('Cloudinary non configuré sur le serveur (variables CLOUDINARY_* manquantes)')
    )
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || 'memory_haven',
        resource_type: options.resource_type || 'auto',
        ...options
      },
      (error, result) => {
        if (error) reject(error)
        else resolve(result)
      }
    )
    stream.end(buffer)
  })
}

module.exports = { cloudinary, cloudinaryConfigured, uploadBuffer }
