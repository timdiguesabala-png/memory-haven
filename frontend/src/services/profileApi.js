import api from './api'
import { uploadFilesToCloudinary } from './cloudinaryClient'
import { updateStoredUser } from '../lib/userStorage'

export async function uploadProfilePhoto(file) {
  const [url] = await uploadFilesToCloudinary([file], 'PHOTO', 'memory_haven/avatars')
  const rep = await api.put('/membres/me/avatar', { avatar_url: url })
  const data = rep.data.data
  updateStoredUser({ avatar_url: data.avatar_url })
  return data
}

export async function removeProfilePhoto() {
  const rep = await api.delete('/membres/me/avatar')
  const data = rep.data.data
  updateStoredUser({ avatar_url: null })
  return data
}

export async function refreshCurrentUser() {
  const rep = await api.get('/auth/me')
  const u = rep.data.utilisateur
  updateStoredUser(u)
  return {
    utilisateur: u,
    famille_stats: rep.data.famille_stats || null
  }
}
