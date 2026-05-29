import api from './api'
import { uploadFilesToCloudinary } from './cloudinaryClient'
import { embedMediaInDescription } from '../lib/mediaUrl'

function buildJsonPayload({ titre, description, type, date_souvenir, lieu, tags, fichiers_url }) {
  return {
    titre,
    description: description || null,
    type,
    date_souvenir,
    lieu: lieu || null,
    visibilite: 'FAMILLE',
    tags,
    ...(fichiers_url?.length ? { fichiers_url } : {})
  }
}

/**
 * Création de souvenir avec médias.
 * Production : upload Cloudinary dans le navigateur + JSON (sans dépendre de Railway).
 */
export async function createSouvenir({
  titre,
  description,
  type,
  date_souvenir,
  lieu,
  tags = [],
  fichiers = []
}) {
  if (fichiers.length === 0) {
    const { data } = await api.post('/souvenirs', buildJsonPayload({
      titre, description, type, date_souvenir, lieu, tags
    }))
    return data
  }

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  const preset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

  if (!cloudName || !preset) {
    throw new Error(
      'Upload photo indisponible : variables Cloudinary manquantes sur Vercel (VITE_CLOUDINARY_CLOUD_NAME, VITE_CLOUDINARY_UPLOAD_PRESET).'
    )
  }

  const urls = await uploadFilesToCloudinary(fichiers, type)
  const descriptionWithMedia = embedMediaInDescription(description, urls)

  const { data } = await api.post('/souvenirs', buildJsonPayload({
    titre,
    description: descriptionWithMedia,
    type,
    date_souvenir,
    lieu,
    tags,
    fichiers_url: urls
  }))

  return data
}

export async function fetchApiHealth() {
  const { data } = await api.get('/health')
  return data
}
