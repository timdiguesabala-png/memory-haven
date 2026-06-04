/**
 * Façade fil de souvenirs : Supabase si VITE_USE_SUPABASE=true, sinon Express.
 */
import api from './api'
import { isSupabaseMode } from '../lib/supabaseClient'
import {
  supabaseListSouvenirs,
  supabaseGetSouvenir,
  supabaseCreateSouvenir,
  supabaseUpdateSouvenir,
  supabaseDeleteSouvenir,
  supabaseListMembres,
  supabaseListFavoris,
  supabaseAddFavori,
  supabaseRemoveFavori,
  supabaseSetReaction,
  supabaseRemoveReaction,
  supabaseGetCommentaires,
  supabasePostCommentaire,
  supabaseReplyCommentaire,
  supabaseUpdateCommentaire,
  supabaseDeleteCommentaire,
  supabaseFamilyFeedStats
} from './supabaseData'

function wrapErr(err) {
  const e = err
  if (!e.userMessage) e.userMessage = e.message
  throw e
}

export async function listSouvenirs(params = {}) {
  if (isSupabaseMode()) {
    try {
      return await supabaseListSouvenirs(params)
    } catch (err) {
      wrapErr(err)
    }
  }
  const rep = await api.get('/souvenirs', { params })
  return rep.data
}

export async function getSouvenir(id) {
  if (isSupabaseMode()) {
    try {
      return await supabaseGetSouvenir(id)
    } catch (err) {
      wrapErr(err)
    }
  }
  const rep = await api.get(`/souvenirs/${id}`)
  return rep.data
}

export async function createSouvenirRecord(payload) {
  if (isSupabaseMode()) {
    try {
      const data = await supabaseCreateSouvenir(payload)
      return data
    } catch (err) {
      wrapErr(err)
    }
  }
  const rep = await api.post('/souvenirs', payload)
  return rep.data?.data ?? rep.data
}

export async function updateSouvenir(id, fields) {
  if (isSupabaseMode()) {
    try {
      return await supabaseUpdateSouvenir(id, fields)
    } catch (err) {
      wrapErr(err)
    }
  }
  const rep = await api.put(`/souvenirs/${id}`, fields)
  return rep.data
}

export async function deleteSouvenir(id) {
  if (isSupabaseMode()) {
    try {
      return await supabaseDeleteSouvenir(id)
    } catch (err) {
      wrapErr(err)
    }
  }
  const rep = await api.delete(`/souvenirs/${id}`)
  return rep.data
}

export async function listMembres() {
  if (isSupabaseMode()) {
    try {
      return await supabaseListMembres()
    } catch (err) {
      wrapErr(err)
    }
  }
  const rep = await api.get('/membres')
  return rep.data
}

export async function listFavoris() {
  if (isSupabaseMode()) {
    try {
      return await supabaseListFavoris()
    } catch (err) {
      wrapErr(err)
    }
  }
  const rep = await api.get('/favoris')
  return rep.data
}

export async function toggleFavoriApi(souvenirId, isFavori) {
  if (isSupabaseMode()) {
    try {
      return isFavori
        ? await supabaseRemoveFavori(souvenirId)
        : await supabaseAddFavori(souvenirId)
    } catch (err) {
      wrapErr(err)
    }
  }
  if (isFavori) {
    const rep = await api.delete(`/favoris/${souvenirId}`)
    return rep.data
  }
  const rep = await api.post(`/favoris/${souvenirId}`)
  return rep.data
}

export async function postReaction(souvenirId, type, { removeIfSame } = {}) {
  if (isSupabaseMode()) {
    try {
      if (removeIfSame) return await supabaseRemoveReaction(souvenirId)
      return await supabaseSetReaction(souvenirId, type)
    } catch (err) {
      wrapErr(err)
    }
  }
  const rep = await api.post(`/reactions/${souvenirId}`, { type })
  return rep.data
}

export async function fetchCommentaires(souvenirId) {
  if (isSupabaseMode()) {
    try {
      return await supabaseGetCommentaires(souvenirId)
    } catch (err) {
      wrapErr(err)
    }
  }
  const rep = await api.get(`/commentaires/${souvenirId}`)
  return rep.data
}

export async function postCommentaire(souvenirId, contenu) {
  if (isSupabaseMode()) {
    try {
      return await supabasePostCommentaire(souvenirId, contenu)
    } catch (err) {
      wrapErr(err)
    }
  }
  const rep = await api.post(`/commentaires/${souvenirId}`, { contenu })
  return rep.data
}

export async function replyCommentaire(parentId, contenu) {
  if (isSupabaseMode()) {
    try {
      return await supabaseReplyCommentaire(parentId, contenu)
    } catch (err) {
      wrapErr(err)
    }
  }
  const rep = await api.post(`/commentaires/${parentId}/repondre`, { contenu })
  return rep.data
}

export async function updateCommentaire(id, contenu) {
  if (isSupabaseMode()) {
    try {
      return await supabaseUpdateCommentaire(id, contenu)
    } catch (err) {
      wrapErr(err)
    }
  }
  const rep = await api.put(`/commentaires/${id}`, { contenu })
  return rep.data
}

export async function deleteCommentaire(id) {
  if (isSupabaseMode()) {
    try {
      return await supabaseDeleteCommentaire(id)
    } catch (err) {
      wrapErr(err)
    }
  }
  const rep = await api.delete(`/commentaires/${id}`)
  return rep.data
}

export async function fetchFamilyFeedStats() {
  if (isSupabaseMode()) {
    try {
      return await supabaseFamilyFeedStats()
    } catch {
      return null
    }
  }
  return null
}
