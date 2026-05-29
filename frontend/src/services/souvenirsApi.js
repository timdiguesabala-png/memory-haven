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
function friendlyUploadError(err) {
  const msg = err?.message || err?.userMessage || ''
  if (msg.includes('Unsupported ZIP')) {
    return new Error(
      'Ce fichier Office (Word, Excel…) n’a pas pu être envoyé via Cloudinary. Réessayez : le serveur va maintenant recevoir le fichier directement. Si l’erreur persiste, redéployez l’API Railway.'
    )
  }
  return err
}

/** Documents (PDF, Word, Excel…) : upload via l’API (raw Cloudinary côté serveur). */
async function createSouvenirWithMultipart({
  titre,
  description,
  type,
  date_souvenir,
  lieu,
  tags,
  fichiers
}) {
  const formData = new FormData()
  formData.append('titre', titre)
  formData.append('description', description || '')
  formData.append('type', type)
  formData.append('date_souvenir', date_souvenir)
  if (lieu) formData.append('lieu', lieu)
  formData.append('tags', JSON.stringify(tags))
  fichiers.forEach((file) => formData.append('fichiers', file))

  const { data } = await api.post('/souvenirs', formData)
  return data
}

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

  if (type === 'DOCUMENT') {
    try {
      return await createSouvenirWithMultipart({
        titre,
        description,
        type,
        date_souvenir,
        lieu,
        tags,
        fichiers
      })
    } catch (err) {
      throw friendlyUploadError(err)
    }
  }

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  const preset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

  if (!cloudName || !preset) {
    throw new Error(
      'Upload photo indisponible : variables Cloudinary manquantes sur Vercel (VITE_CLOUDINARY_CLOUD_NAME, VITE_CLOUDINARY_UPLOAD_PRESET).'
    )
  }

  let urls
  try {
    urls = await uploadFilesToCloudinary(fichiers, type)
  } catch (err) {
    throw friendlyUploadError(err)
  }
  const mediaItems = fichiers.map((file, i) => ({
    url: urls[i],
    name: file.name || null
  }))
  const descriptionWithMedia = embedMediaInDescription(description, mediaItems)

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
