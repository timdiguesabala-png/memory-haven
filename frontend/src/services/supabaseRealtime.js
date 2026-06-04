import { getSupabase } from '../lib/supabaseClient'
import { supabaseFetchDiscussionMessage } from './supabaseDiscussion'

/**
 * Abonnement Realtime : messages discussion + curseurs de lecture.
 */
export function subscribeDiscussionRealtime(familleId, callbacks) {
  const sb = getSupabase()
  if (!sb || !familleId) return () => {}

  const channel = sb
    .channel(`discussion:${familleId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'MessageDiscussion',
        filter: `famille_id=eq.${familleId}`
      },
      async (payload) => {
        try {
          const full = await supabaseFetchDiscussionMessage(payload.new.id)
          if (full) callbacks.onNew?.(full)
        } catch (err) {
          console.error('Realtime message INSERT:', err)
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'MessageDiscussion',
        filter: `famille_id=eq.${familleId}`
      },
      async (payload) => {
        try {
          const full = await supabaseFetchDiscussionMessage(payload.new.id)
          if (full) callbacks.onUpdated?.(full)
        } catch (err) {
          console.error('Realtime message UPDATE:', err)
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'MessageDiscussion',
        filter: `famille_id=eq.${familleId}`
      },
      (payload) => {
        callbacks.onDeleted?.({ id: payload.old.id })
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'DiscussionReadState',
        filter: `famille_id=eq.${familleId}`
      },
      (payload) => {
        const row = payload.new || payload.old
        if (!row?.utilisateur_id) return
        callbacks.onRead?.({
          utilisateur_id: row.utilisateur_id,
          last_message_id: row.last_message_id ?? 0
        })
      }
    )
    .subscribe((status) => {
      callbacks.onStatus?.(status === 'SUBSCRIBED')
    })

  return () => {
    sb.removeChannel(channel)
  }
}

/** Indicateur « en train d’écrire » via broadcast (pas de Socket.io). */
export function createDiscussionTypingChannel(familleId, myUserId) {
  const sb = getSupabase()
  if (!sb || !familleId) return null

  const channel = sb.channel(`discussion-typing:${familleId}`, {
    config: { broadcast: { ack: false, self: false } }
  })

  channel.subscribe()

  return {
    channel,
    sendTyping(prenom, isTyping) {
      channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: myUserId, prenom, isTyping }
      })
    },
    onTyping(handler) {
      channel.on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (Number(payload?.userId) === Number(myUserId)) return
        handler(payload)
      })
    },
    close() {
      sb.removeChannel(channel)
    }
  }
}

/** Nouvelles notifications pour l’utilisateur connecté (cloche). */
export function subscribeNotificationsRealtime(userId, onInsert) {
  const sb = getSupabase()
  if (!sb || !userId) return () => {}

  const channel = sb
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'Notification',
        filter: `destinataire_id=eq.${userId}`
      },
      (payload) => {
        onInsert?.(payload.new)
      }
    )
    .subscribe()

  return () => {
    sb.removeChannel(channel)
  }
}
