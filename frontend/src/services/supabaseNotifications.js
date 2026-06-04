import { getSupabase } from '../lib/supabaseClient'
import { supabaseErrorMessage } from '../lib/supabaseHelpers'

function sb() {
  const client = getSupabase()
  if (!client) throw new Error('Client Supabase non configuré')
  return client
}

export async function supabaseListNotifications() {
  const client = sb()
  const { data, error } = await client
    .from('Notification')
    .select('*, souvenir:Souvenir(id, titre)')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw new Error(supabaseErrorMessage(error))
  return { succes: true, data: data || [] }
}

export async function supabaseMarkNotificationRead(id) {
  const client = sb()
  const { error } = await client.from('Notification').update({ lu: true }).eq('id', id)
  if (error) throw new Error(supabaseErrorMessage(error))
  return { succes: true }
}

export async function supabaseMarkAllNotificationsRead() {
  const client = sb()
  const { error } = await client.from('Notification').update({ lu: true }).eq('lu', false)
  if (error) throw new Error(supabaseErrorMessage(error))
  return { succes: true }
}
