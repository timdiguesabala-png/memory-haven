import { getSupabase } from '../lib/supabaseClient'
import { getStoredUser } from '../lib/userStorage'
import { supabaseErrorMessage } from '../lib/supabaseHelpers'
import { reactionsForClient, toggleReactionJson } from '../lib/discussionReactions'
import { enrichDiscussionMessage } from '../lib/discussionContent'

const MSG_SELECT =
  '*, utilisateur:Utilisateur(id, nom, prenom, avatar_url)'

function sb() {
  const client = getSupabase()
  if (!client) throw new Error('Client Supabase non configuré')
  return client
}

function me() {
  const u = getStoredUser()
  if (!u?.id || !u?.famille_id) throw new Error('Profil non chargé')
  return u
}

export function mapDiscussionRow(row, extra = {}) {
  if (!row) return row
  const base = enrichDiscussionMessage({
    id: row.id,
    contenu: row.contenu || '',
    image_url: row.image_url,
    audio_url: row.audio_url,
    audio_duration: row.audio_duration,
    auteur_id: row.utilisateur_id,
    auteur: row.utilisateur || null,
    created_at: row.createdAt
  })
  return {
    ...base,
    reactions: reactionsForClient(row.reactions_json),
    statut_lecture: extra.statut_lecture ?? null
  }
}

function readStatusForMessage(messageId, readStates, otherMemberIds) {
  if (!otherMemberIds.length) return 'lu'
  const stateByUser = new Map(
    readStates.map((s) => [Number(s.utilisateur_id), Number(s.last_message_id) || 0])
  )
  const allRead = otherMemberIds.every((uid) => (stateByUser.get(uid) || 0) >= Number(messageId))
  return allRead ? 'lu' : 'envoye'
}

async function buildReadContext(familleId, viewerId) {
  const client = sb()
  const [readRes, membersRes] = await Promise.all([
    client.from('DiscussionReadState').select('utilisateur_id, last_message_id').eq('famille_id', familleId),
    client
      .from('Utilisateur')
      .select('id')
      .eq('famille_id', familleId)
      .eq('is_active', true)
      .neq('id', viewerId)
  ])

  if (readRes.error) throw new Error(supabaseErrorMessage(readRes.error))
  if (membersRes.error) throw new Error(supabaseErrorMessage(membersRes.error))

  const readStates = readRes.data || []
  const otherMemberIds = (membersRes.data || []).map((m) => m.id)
  const cursors = readStates.map((s) => ({
    utilisateur_id: s.utilisateur_id,
    last_message_id: s.last_message_id
  }))
  return { readStates, otherMemberIds, cursors }
}

function mapWithRead(message, viewerId, readStates, otherMemberIds) {
  let statut = null
  if (message.utilisateur_id === viewerId) {
    statut = readStatusForMessage(message.id, readStates, otherMemberIds)
  }
  return mapDiscussionRow(message, { statut_lecture: statut })
}

export async function supabaseLoadDiscussion() {
  const u = me()
  const client = sb()
  const { readStates, otherMemberIds, cursors } = await buildReadContext(u.famille_id, u.id)

  const { data, error } = await client
    .from('MessageDiscussion')
    .select(MSG_SELECT)
    .eq('famille_id', u.famille_id)
    .order('createdAt', { ascending: true })
    .limit(100)

  if (error) throw new Error(supabaseErrorMessage(error))

  const rows = (data || []).map((m) => mapWithRead(m, u.id, readStates, otherMemberIds))
  return {
    succes: true,
    data: rows,
    read_cursors: cursors,
    other_member_ids: otherMemberIds
  }
}

export async function supabaseFetchDiscussionMessage(id) {
  const client = sb()
  const u = me()
  const { data, error } = await client
    .from('MessageDiscussion')
    .select(MSG_SELECT)
    .eq('id', id)
    .maybeSingle()

  if (error) throw new Error(supabaseErrorMessage(error))
  if (!data) return null

  const { readStates, otherMemberIds } = await buildReadContext(u.famille_id, u.id)
  return mapWithRead(data, u.id, readStates, otherMemberIds)
}

export async function supabaseMarkDiscussionRead(lastMessageId) {
  const u = me()
  const client = sb()
  const last = Math.max(0, parseInt(lastMessageId, 10) || 0)

  const { error } = await client.from('DiscussionReadState').upsert(
    {
      utilisateur_id: u.id,
      famille_id: u.famille_id,
      last_message_id: last,
      updated_at: new Date().toISOString()
    },
    { onConflict: 'utilisateur_id,famille_id' }
  )

  if (error) throw new Error(supabaseErrorMessage(error))
  return { succes: true, last_message_id: last }
}

function messagePayloadValid(contenu, image_url, audio_url) {
  const text = (contenu || '').trim()
  const img = (image_url || '').trim()
  const audio = (audio_url || '').trim()
  return text.length > 0 || img.length > 0 || audio.length > 0
}

export async function supabaseSendDiscussionMessage(body) {
  const u = me()
  const contenu = (body.contenu || '').trim()
  const image_url = (body.image_url || '').trim() || null
  const audio_url = (body.audio_url || '').trim() || null
  const audio_duration = body.audio_duration != null ? parseInt(body.audio_duration, 10) : null

  if (!messagePayloadValid(contenu, image_url, audio_url)) {
    throw new Error('Message, photo ou vocal requis')
  }

  const client = sb()
  const { data, error } = await client
    .from('MessageDiscussion')
    .insert({
      contenu,
      image_url,
      audio_url,
      audio_duration: Number.isFinite(audio_duration) ? audio_duration : null,
      utilisateur_id: u.id,
      famille_id: u.famille_id
    })
    .select(MSG_SELECT)
    .single()

  if (error) throw new Error(supabaseErrorMessage(error))
  return { succes: true, data: mapDiscussionRow(data, { statut_lecture: 'envoye' }) }
}

export async function supabaseReplyDiscussion(messageId, contenu) {
  const u = me()
  const text = (contenu || '').trim()
  if (!text) throw new Error('La réponse ne peut pas être vide')

  const client = sb()
  const { data: original, error: oErr } = await client
    .from('MessageDiscussion')
    .select('id, contenu, image_url, audio_url, utilisateur:Utilisateur(prenom)')
    .eq('id', messageId)
    .eq('famille_id', u.famille_id)
    .maybeSingle()

  if (oErr) throw new Error(supabaseErrorMessage(oErr))
  if (!original) throw new Error('Message original introuvable')

  let cite = original.contenu?.slice(0, 80) || ''
  if (!cite && original.image_url) cite = '📷 Photo'
  if (!cite && original.audio_url) cite = '🎤 Vocal'
  const prenom = original.utilisateur?.prenom || 'Membre'
  const prefix = `↩ ${prenom}: "${cite}${original.contenu?.length > 80 ? '…' : ''}"\n`

  const { data, error } = await client
    .from('MessageDiscussion')
    .insert({
      contenu: prefix + text,
      utilisateur_id: u.id,
      famille_id: u.famille_id
    })
    .select(MSG_SELECT)
    .single()

  if (error) throw new Error(supabaseErrorMessage(error))
  return { succes: true, data: mapDiscussionRow(data, { statut_lecture: 'envoye' }) }
}

export async function supabaseToggleDiscussionReaction(messageId, emoji) {
  const u = me()
  const client = sb()

  const { data: message, error: gErr } = await client
    .from('MessageDiscussion')
    .select('id, reactions_json, famille_id')
    .eq('id', messageId)
    .eq('famille_id', u.famille_id)
    .maybeSingle()

  if (gErr) throw new Error(supabaseErrorMessage(gErr))
  if (!message) throw new Error('Message introuvable')

  const reactions_json = toggleReactionJson(message.reactions_json, u.id, emoji)

  const { data: updated, error } = await client
    .from('MessageDiscussion')
    .update({ reactions_json })
    .eq('id', messageId)
    .select(MSG_SELECT)
    .single()

  if (error) throw new Error(supabaseErrorMessage(error))

  const { readStates, otherMemberIds } = await buildReadContext(u.famille_id, u.id)
  return {
    succes: true,
    data: mapWithRead(updated, u.id, readStates, otherMemberIds)
  }
}

export async function supabaseDeleteDiscussionMessage(id) {
  const u = me()
  const client = sb()

  const { data: message, error: gErr } = await client
    .from('MessageDiscussion')
    .select('id, utilisateur_id')
    .eq('id', id)
    .eq('famille_id', u.famille_id)
    .maybeSingle()

  if (gErr) throw new Error(supabaseErrorMessage(gErr))
  if (!message) throw new Error('Message introuvable')

  const { error } = await client.from('MessageDiscussion').delete().eq('id', id)
  if (error) throw new Error(supabaseErrorMessage(error))
  return { succes: true, message: 'Message supprimé' }
}
