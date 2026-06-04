import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL || ''
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

/** Mode 100 % Supabase activé (Auth + données progressivement). */
export function isSupabaseMode() {
  return import.meta.env.VITE_USE_SUPABASE === 'true' && !!url && !!anonKey
}

let client = null

export function getSupabase() {
  if (!isSupabaseMode()) return null
  if (!client) {
    client = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'mh-supabase-auth'
      }
    })
  }
  return client
}
