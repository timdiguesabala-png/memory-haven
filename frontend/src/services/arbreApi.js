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
