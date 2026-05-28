/**
 * Crée le preset unsigned sur Cloudinary si absent.
 * Usage: cd backend && node scripts/ensure-cloudinary-preset.js
 */
require('dotenv').config()
const cloudinary = require('cloudinary').v2

const PRESET = process.env.CLOUDINARY_UPLOAD_PRESET || 'memory_haven_unsigned'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

async function main() {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    console.error('CLOUDINARY_* manquant dans backend/.env')
    process.exit(1)
  }
  try {
    await cloudinary.api.upload_preset(PRESET)
    console.log(`✅ Preset « ${PRESET} » existe déjà`)
  } catch {
    await cloudinary.api.create_upload_preset({
      name: PRESET,
      unsigned: true,
      folder: 'memory_haven/souvenirs'
    })
    console.log(`✅ Preset « ${PRESET} » créé (unsigned)`)
  }
}

main().catch((e) => {
  console.error(e.message || e)
  process.exit(1)
})
