import api from './api'

/**
 * Création de souvenir — un seul endpoint (multipart ou JSON).
 * Ne jamais appeler /upload/photo (obsolète).
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
  if (fichiers.length > 0) {
    const formData = new FormData()
    formData.append('titre', titre)
    formData.append('description', description || '')
    formData.append('type', type)
    formData.append('date_souvenir', date_souvenir)
    formData.append('lieu', lieu || '')
    if (tags.length > 0) formData.append('tags', JSON.stringify(tags))
    fichiers.forEach((file) => formData.append('fichiers', file))
    const { data } = await api.post('/souvenirs', formData)
    return data
  }

  const { data } = await api.post('/souvenirs', {
    titre,
    description: description || null,
    type,
    date_souvenir,
    lieu: lieu || null,
    visibilite: 'FAMILLE',
    tags
  })
  return data
}

export async function fetchApiHealth() {
  const { data } = await api.get('/health')
  return data
}
