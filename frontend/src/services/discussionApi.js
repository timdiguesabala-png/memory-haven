import api from './api'
import { isSupabaseMode } from '../lib/supabaseClient'
import {
  supabaseLoadDiscussion,
  supabaseMarkDiscussionRead,
  supabaseSendDiscussionMessage,
  supabaseReplyDiscussion,
  supabaseToggleDiscussionReaction,
  supabaseDeleteDiscussionMessage
} from './supabaseDiscussion'
import {
  subscribeDiscussionRealtime,
  createDiscussionTypingChannel
} from './supabaseRealtime'

function wrapErr(err) {
  if (!err.userMessage) err.userMessage = err.message
  throw err
}

export async function loadDiscussion() {
  if (isSupabaseMode()) {
    try {
      return await supabaseLoadDiscussion()
    } catch (err) {
      wrapErr(err)
    }
  }
  const rep = await api.get('/discussion')
  return rep.data
}

export async function markDiscussionRead(lastMessageId) {
  if (isSupabaseMode()) {
    try {
      return await supabaseMarkDiscussionRead(lastMessageId)
    } catch (err) {
      wrapErr(err)
    }
  }
  const rep = await api.post('/discussion/read', { last_message_id: lastMessageId })
  return rep.data
}

export async function sendDiscussionMessage(body) {
  if (isSupabaseMode()) {
    try {
      return await supabaseSendDiscussionMessage(body)
    } catch (err) {
      wrapErr(err)
    }
  }
  const rep = await api.post('/discussion/messages', body)
  return rep.data
}

export async function replyDiscussion(messageId, contenu) {
  if (isSupabaseMode()) {
    try {
      return await supabaseReplyDiscussion(messageId, contenu)
    } catch (err) {
      wrapErr(err)
    }
  }
  const rep = await api.post('/discussion/repondre', { message_id: messageId, contenu })
  return rep.data
}

export async function toggleDiscussionReaction(messageId, emoji) {
  if (isSupabaseMode()) {
    try {
      return await supabaseToggleDiscussionReaction(messageId, emoji)
    } catch (err) {
      wrapErr(err)
    }
  }
  const rep = await api.post(`/discussion/messages/${messageId}/reaction`, { emoji })
  return rep.data
}

export async function deleteDiscussionMessage(id) {
  if (isSupabaseMode()) {
    try {
      return await supabaseDeleteDiscussionMessage(id)
    } catch (err) {
      wrapErr(err)
    }
  }
  const rep = await api.delete(`/discussion/messages/${id}`)
  return rep.data
}

export function subscribeDiscussion(familleId, callbacks) {
  if (!isSupabaseMode()) return null
  return subscribeDiscussionRealtime(familleId, callbacks)
}

export function createTypingChannel(familleId, myUserId) {
  if (!isSupabaseMode()) return null
  return createDiscussionTypingChannel(familleId, myUserId)
}
