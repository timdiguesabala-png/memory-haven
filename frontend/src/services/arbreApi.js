import api from './api'
import { uploadFilesToCloudinary } from './cloudinaryClient'

export function getArbreMemberPhoto(membre) {
  if (!membre) return null
  return membre.photo_url || membre.utilisateur?.avatar_url || null
}

export function getArbreMemberInitials(nom) {
  if (!nom) return '?'
  return nom
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export async function uploadArbreMemberPhoto(membreId, file) {
  const [url] = await uploadFilesToCloudinary([file], 'PHOTO', 'memory_haven/arbre')
  const rep = await api.put(`/arbre/${membreId}/photo`, { photo_url: url })
  return rep.data.data
}

export async function removeArbreMemberPhoto(membreId) {
  const rep = await api.delete(`/arbre/${membreId}/photo`)
  return rep.data.data
}

export async function fetchArbreComplet() {
  const rep = await api.get('/arbre')
  return rep.data.data
}

export async function createCoupleRacine({ ancetre1, ancetre2, date_debut }) {
  const rep = await api.post('/arbre/couple-racine', {
    ancetre1,
    ancetre2,
    date_debut: date_debut || null
  })
  return rep.data
}

export async function createUnion(payload) {
  const rep = await api.post('/arbre/unions', payload)
  return rep.data
}

export async function addEnfantToUnion(unionId, enfantId) {
  const rep = await api.post(`/arbre/unions/${unionId}/enfants`, { enfant_id: enfantId })
  return rep.data
}

export async function reorderUnions(items) {
  const rep = await api.put('/arbre/unions/reorder', { items })
  return rep.data
}

export async function reorderEnfantsUnion(unionId, items) {
  const rep = await api.put(`/arbre/unions/${unionId}/enfants/reorder`, { items })
  return rep.data
}

export async function checkArbreApiReady() {
  try {
    const rep = await api.get('/health')
    return {
      ready: rep.data?.version === '10-arbre-unions-postgresql',
      version: rep.data?.version,
      features: rep.data?.features
    }
  } catch {
    return { ready: false, version: null }
  }
}
