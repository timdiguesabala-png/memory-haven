const cloudinary = require('cloudinary').v2
const { CloudinaryStorage } = require('multer-storage-cloudinary')
const multer = require('multer')

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const storagePhoto = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'memory-haven/photos',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 1200, crop: 'limit' }]
  }
})

const storageAudio = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'memory-haven/audios',
    allowed_formats: ['mp3', 'wav', 'ogg', 'm4a'],
    resource_type: 'video'
  }
})

const storageVideo = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'memory-haven/videos',
    allowed_formats: ['mp4', 'mov', 'avi'],
    resource_type: 'video'
  }
})

const uploadPhoto = multer({ storage: storagePhoto })
const uploadAudio = multer({ storage: storageAudio })
const uploadVideo = multer({ storage: storageVideo })

module.exports = { cloudinary, uploadPhoto, uploadAudio, uploadVideo }