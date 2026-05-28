import api from './api'
import { uploadFilesToCloudinary } from './cloudinaryClient'

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

function appendCommonFields(formData, fields) {
  formData.append('titre', fields.titre)
  formData.append('description', fields.description || '')
  formData.append('type', fields.type)
  formData.append('date_souvenir', fields.date_souvenir)
  formData.append('lieu', fields.lieu || '')
  if (fields.tags?.length > 0) {
    formData.append('tags', JSON.stringify(fields.tags))
  }
}

async function isNewApi() {
  try {
    const { data } = await api.get('/health')
    return data?.version === '2-upload-unified'
  } catch {
    return false
  }
}

async function postMultipart(fields, fichiers) {
  const formData = new FormData()
  appendCommonFields(formData, fields)

  if (fichiers.length === 1) {
    formData.append('file', fichiers[0])
  } else {
    fichiers.forEach((file) => formData.append('fichiers', file))
  }

  const { data } = await api.post('/souvenirs', formData)
  return data
}

/**
 * Création de souvenir — compatible ancienne API Railway (champ file)
 * et nouvelle API (fichiers + URLs Cloudinary).
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

  const newApi = await isNewApi()

  if (newApi && import.meta.env.VITE_CLOUDINARY_CLOUD_NAME) {
    try {
      const urls = await uploadFilesToCloudinary(fichiers, type)
      const { data } = await api.post(
        '/souvenirs',
        buildJsonPayload({ titre, description, type, date_souvenir, lieu, tags, fichiers_url: urls })
      )
      return data
    } catch (err) {
      console.warn('Cloudinary client:', err.message)
    }
  }

  if (!newApi && fichiers.length > 1) {
    throw new Error(
      'Plusieurs fichiers nécessitent la mise à jour de l’API Railway. Utilisez une seule photo ou lancez CONFIGURER-RAILWAY.bat.'
    )
  }

  try {
    return await postMultipart({ titre, description, type, date_souvenir, lieu, tags }, fichiers)
  } catch (err) {
    const msg = err.userMessage || err.response?.data?.message || err.message
    if (msg?.includes('upload') || err.response?.status === 500) {
      throw new Error(
        `${msg || 'Upload échoué'}. Sur Railway, ajoutez les variables CLOUDINARY_* (voir CONFIGURER-RAILWAY.bat).`
      )
    }
    throw err
  }
}

export async function fetchApiHealth() {
  const { data } = await api.get('/health')
  return data
}
