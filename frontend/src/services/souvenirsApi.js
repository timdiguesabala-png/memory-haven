import api from './api'
import { isSupabaseMode } from '../lib/supabaseClient'
import { createSouvenirRecord } from './feedApi'
import { uploadFilesToCloudinary } from './cloudinaryClient'
import { embedMediaInDescription } from '../lib/mediaUrl'
import { compressImagesIfNeeded } from '../lib/compressImage'

function buildJsonPayload({
  titre,
  description,
  type,
  date_souvenir,
  lieu,
  tags,
  fichiers_url,
  visibilite,
  latitude,
  longitude,
  categorie,
  membre_arbre_id,
  couverture_url
}) {
  return {
    titre,
    description: description || null,
    type,
    date_souvenir,
    lieu: lieu || null,
    visibilite: visibilite || 'FAMILLE',
    tags,
    ...(latitude != null && latitude !== '' ? { latitude } : {}),
    ...(longitude != null && longitude !== '' ? { longitude } : {}),
    ...(categorie ? { categorie } : {}),
    ...(membre_arbre_id ? { membre_arbre_id } : {}),
    ...(couverture_url ? { couverture_url } : {}),
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
  fichiers,
  visibilite,
  latitude,
  longitude,
  categorie,
  membre_arbre_id,
  couverture_url
}) {
  const formData = new FormData()
  formData.append('titre', titre)
  formData.append('description', description || '')
  formData.append('type', type)
  formData.append('date_souvenir', date_souvenir)
  if (lieu) formData.append('lieu', lieu)
  if (visibilite) formData.append('visibilite', visibilite)
  if (latitude != null && latitude !== '') formData.append('latitude', latitude)
  if (longitude != null && longitude !== '') formData.append('longitude', longitude)
  if (categorie) formData.append('categorie', categorie)
  if (membre_arbre_id) formData.append('membre_arbre_id', membre_arbre_id)
  formData.append('tags', JSON.stringify(tags))
  fichiers.forEach((file) => formData.append('fichiers', file))

  if (isSupabaseMode()) {
    throw new Error(
      'Les documents Office doivent être exportés en PDF pour l’upload direct Supabase, ou utilisez le type Photo.'
    )
  }
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
  fichiers,
  visibilite,
  onUploadProgress,
  latitude,
  longitude,
  categorie,
  membre_arbre_id,
  couverture_url
}) {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  const preset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

  if (!cloudName || !preset) {
    throw new Error(
      'Upload indisponible : configurez VITE_CLOUDINARY_CLOUD_NAME et VITE_CLOUDINARY_UPLOAD_PRESET sur Vercel.'
    )
  }

  onUploadProgress?.({ phase: 'compression', current: 0, total: fichiers.length })
  const prepared =
    type === 'PHOTO' ? await compressImagesIfNeeded(fichiers) : fichiers
  onUploadProgress?.({ phase: 'upload', current: 0, total: prepared.length })
  const urls = await uploadFilesToCloudinary(prepared, type)
  onUploadProgress?.({ phase: 'upload', current: prepared.length, total: prepared.length })
  const mediaItems = fichiers.map((file, i) => ({
    url: urls[i],
    name: file.name || null
  }))
  const descriptionWithMedia = embedMediaInDescription(description, mediaItems)

  return createSouvenirRecord(buildJsonPayload({
    titre,
    description: descriptionWithMedia,
    type,
    date_souvenir,
    lieu,
    tags,
    fichiers_url: urls,
    visibilite,
    latitude,
    longitude,
    categorie,
    membre_arbre_id,
    couverture_url: couverture_url || urls[0]
  }))
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
  fichiers = [],
  visibilite = 'FAMILLE',
  latitude,
  longitude,
  categorie,
  membre_arbre_id,
  couverture_url,
  onUploadProgress
}) {
  const extra = { latitude, longitude, categorie, membre_arbre_id, couverture_url }
  if (fichiers.length === 0) {
    return createSouvenirRecord(buildJsonPayload({
      titre, description, type, date_souvenir, lieu, tags, visibilite, ...extra
    }))
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
        fichiers,
        visibilite,
        ...extra
      })
    }

    return await createSouvenirWithCloudinary({
      titre,
      description,
      type,
      date_souvenir,
      lieu,
      tags,
      fichiers,
      visibilite,
      onUploadProgress,
      ...extra
    })
  } catch (err) {
    throw friendlyUploadError(err)
  }
}

export async function fetchApiHealth() {
  const { data } = await api.get('/health')
  return data
}
