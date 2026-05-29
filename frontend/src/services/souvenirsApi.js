import api from './api'

function buildJsonPayload({ titre, description, type, date_souvenir, lieu, tags }) {
  return {
    titre,
    description: description || null,
    type,
    date_souvenir,
    lieu: lieu || null,
    visibilite: 'FAMILLE',
    tags
  }
}

function friendlyUploadError(err) {
  const msg = err?.message || err?.userMessage || err?.response?.data?.message || ''
  if (msg.includes('Unsupported ZIP') || msg.includes('image/upload')) {
    return new Error(
      'Fichier refusé par Cloudinary. Rechargez la page (Ctrl+F5) et republiez : l’envoi passe maintenant par le serveur.'
    )
  }
  if (err?.response?.status === 413) {
    return new Error('Fichier trop volumineux (max 50 Mo par fichier).')
  }
  return err
}

/** Tous les médias passent par l’API (évite image/upload Cloudinary pour PDF, Word, etc.). */
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

/**
 * Création de souvenir avec médias via l’API Railway (upload Cloudinary côté serveur).
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

export async function fetchApiHealth() {
  const { data } = await api.get('/health')
  return data
}
