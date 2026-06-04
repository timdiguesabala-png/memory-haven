import api from './api'
import { isSupabaseMode } from '../lib/supabaseClient'
import {
  supabaseListNotifications,
  supabaseMarkNotificationRead,
  supabaseMarkAllNotificationsRead
} from './supabaseNotifications'
import { subscribeNotificationsRealtime } from './supabaseRealtime'

function wrapErr(err) {
  if (!err.userMessage) err.userMessage = err.message
  throw err
}

export async function listNotifications() {
  if (isSupabaseMode()) {
    try {
      return await supabaseListNotifications()
    } catch (err) {
      wrapErr(err)
    }
  }
  const rep = await api.get('/notifications')
  return rep.data
}

export async function markNotificationRead(id) {
  if (isSupabaseMode()) {
    try {
      return await supabaseMarkNotificationRead(id)
    } catch (err) {
      wrapErr(err)
    }
  }
  const rep = await api.put(`/notifications/${id}/lire`)
  return rep.data
}

export async function markAllNotificationsRead() {
  if (isSupabaseMode()) {
    try {
      return await supabaseMarkAllNotificationsRead()
    } catch (err) {
      wrapErr(err)
    }
  }
  const rep = await api.put('/notifications/lire-tout')
  return rep.data
}

export function subscribeNotifications(userId, onInsert) {
  if (!isSupabaseMode()) return null
  return subscribeNotificationsRealtime(userId, onInsert)
}
