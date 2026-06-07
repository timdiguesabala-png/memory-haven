const { createClient } = require('@supabase/supabase-js')

function normalizeSupabaseUrl(raw) {
  let base = String(raw || '').trim()
  if (/\/rest\/v1/i.test(base)) {
    base = base.split(/\/rest\/v1/i)[0]
  }
  return base.replace(/\/+$/, '')
}

function supabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
}

let client = null

function getSupabase() {
  if (!supabaseConfigured()) return null
  if (!client) {
    const url = normalizeSupabaseUrl(process.env.SUPABASE_URL)
    client = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    })
  }
  return client
}

function bucketName() {
  return process.env.SUPABASE_STORAGE_BUCKET || 'memory-haven'
}

function safePathPart(name) {
  return String(name || 'fichier')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 80)
}

/**
 * Upload buffer vers Supabase Storage (bucket public ou URL signée).
 */
async function uploadToSupabase(file, folder = 'souvenirs') {
  const sb = getSupabase()
  if (!sb) throw new Error('Supabase Storage non configuré')

  const ext = (file.originalname || '').match(/\.[a-z0-9]{2,5}$/i)?.[0] || ''
  const objectPath = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 10)}_${safePathPart(file.originalname)}${ext}`

  const { error } = await sb.storage.from(bucketName()).upload(objectPath, file.buffer, {
    contentType: file.mimetype || 'application/octet-stream',
    upsert: false
  })

  if (error) throw new Error(error.message)

  const { data } = sb.storage.from(bucketName()).getPublicUrl(objectPath)
  return data.publicUrl
}

module.exports = { supabaseConfigured, getSupabase, uploadToSupabase, bucketName }
