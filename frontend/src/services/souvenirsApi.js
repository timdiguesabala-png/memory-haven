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

function friendlyUploadError(err) {
  const msg =
    err?.response?.data?.message ||
    err?.userMessage ||
    err?.message ||
    ''
  if (msg.includes('Unsupported ZIP')) {
    return new Error(
      'Ce fichier Office n’est pas accepté par Cloudinary. Utilisez le type « Documents » ou un PDF exporté.'
    )
  }
  if (err?.response?.status === 413) {
    return new Error('Fichier trop volumineux (max 50 Mo par fichier).')
  }
  return err
}

/** Documents (PDF, Word…) : envoi multipart vers l’API Railway. */
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

/** Photos, vidéos, audios : Cloudinary dans le navigateur (fiable) puis JSON. */
async function createSouvenirWithCloudinary({
  titre,
  description,
  type,
  date_souvenir,
  lieu,
  tags,
  fichiers
}) {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  const preset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

  if (!cloudName || !preset) {
    throw new Error(
      'Upload indisponible : configurez VITE_CLOUDINARY_CLOUD_NAME et VITE_CLOUDINARY_UPLOAD_PRESET sur Vercel.'
    )
  }

  const urls = await uploadFilesToCloudinary(fichiers, type)
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

/**
 * Création de souvenir avec médias.
 * - PHOTO / VIDEO / AUDIO → Cloudinary (navigateur)
 * - DOCUMENT → API Railway (multipart)
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

  try {
    if (type === 'DOCUMENT') {
      return await createSouvenirWithMultipart({
        titre,
        description,
        type,
        date_souvenir,
        lieu,
        tags,
        fichiers
      })
    }

    return await createSouvenirWithCloudinary({
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

export async function fetchApiHealth() {
  const { data } = await api.get('/health')
  return data
}
