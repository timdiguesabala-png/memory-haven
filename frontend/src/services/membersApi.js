/**
 * Membres famille : Supabase si activé, sinon Express.
 */
import api from './api'
import { isSupabaseMode } from '../lib/supabaseClient'
import { listMembres as feedListMembres } from './feedApi'
import {
  supabaseGetMembre,
  supabaseGetInviteCode
} from './supabaseMembers'

function wrapErr(err) {
  if (!err.userMessage) err.userMessage = err.message
  throw err
}

export async function listMembresFamille() {
  if (isSupabaseMode()) {
    try {
      return await feedListMembres()
    } catch (err) {
      wrapErr(err)
    }
  }
  const rep = await api.get('/membres')
  return rep.data
}

export async function getMembreById(id) {
  if (isSupabaseMode()) {
    try {
      return await supabaseGetMembre(id)
    } catch (err) {
      wrapErr(err)
    }
  }
  const rep = await api.get(`/membres/${id}`)
  return rep.data
}

export async function fetchInviteCode() {
  if (isSupabaseMode()) {
    try {
      return await supabaseGetInviteCode()
    } catch (err) {
      wrapErr(err)
    }
  }
  try {
    const rep = await api.get('/membres/code-invitation')
    return { succes: true, data: rep.data?.data ?? rep.data }
  } catch {
    const rep = await api.get('/auth/mon-code')
    return { succes: true, data: { code: rep.data?.code } }
  }
}

/** Actions admin : encore via API Express */
export async function inviterMembre(payload) {
  const rep = await api.post('/membres/inviter', payload)
  return rep.data
}

export async function changerRoleMembre(id, role) {
  const rep = await api.put(`/membres/${id}/role`, { role })
  return rep.data
}

export async function desactiverMembre(id) {
  const rep = await api.put(`/membres/${id}/desactiver`)
  return rep.data
}
