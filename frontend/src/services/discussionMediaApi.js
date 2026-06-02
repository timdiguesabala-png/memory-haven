import api from './api'
import { uploadFilesToCloudinary } from './cloudinaryClient'
import { compressImageIfNeeded } from '../lib/compressImage'

function buildEmbedTag(url, kind, audio_duration) {
  if (kind === 'audio') {
    return `[mh-audio]${url}|${audio_duration || 0}[/mh-audio]`
  }
  return `[mh-img]${url}[/mh-img]`
}

function mergeContenu(text, tag) {
  const base = (text || '').trim()
  return base ? `${base}\n${tag}` : tag
}

/** Envoi multipart via l’API (Cloudinary côté serveur). */
export async function postDiscussionMediaFile(file, { kind = 'photo', contenu = '', audio_duration } = {}) {
  const form = new FormData()
  form.append('media', file)
  form.append('kind', kind)
  if (contenu) form.append('contenu', contenu)
  if (audio_duration != null) form.append('audio_duration', String(audio_duration))

  const { data } = await api.post('/discussion/messages/media', form)
  return data
}

/** Cloudinary navigateur + enregistrement message (compatible ancienne API). */
export async function postDiscussionMediaViaCloudinary(file, { kind, contenu = '', audio_duration } = {}) {
  const isAudio = kind === 'audio'
  const prepared = isAudio ? file : await compressImageIfNeeded(file)
  const [url] = await uploadFilesToCloudinary(
    [prepared],
    isAudio ? 'AUDIO' : 'PHOTO',
    'memory_haven/discussion'
  )

  const body = { contenu }
  if (isAudio) {
    body.audio_url = url
    body.audio_duration = audio_duration
  } else {
    body.image_url = url
  }

  try {
    const { data } = await api.post('/discussion/messages', body)
    const saved = data?.data
    if (saved && (saved.image_url || saved.audio_url)) return data
    if (saved?.id) return data
  } catch {
    /* ancienne API */
  }

  const tag = buildEmbedTag(url, kind, audio_duration)
  const { data } = await api.post('/discussion/messages', {
    contenu: mergeContenu(contenu, tag)
  })
  return data
}

/**
 * Photo ou vocal : multipart API → sinon Cloudinary + JSON → sinon texte avec lien intégré.
 */
export async function sendDiscussionMedia(file, options = {}) {
  const kind = options.kind || (file.type?.startsWith('audio/') ? 'audio' : 'photo')

  try {
    return await postDiscussionMediaFile(file, { ...options, kind })
  } catch (apiErr) {
    const status = apiErr.response?.status
    if (status === 404 || status === 405 || status === 413 || status >= 500) {
      return postDiscussionMediaViaCloudinary(file, { ...options, kind })
    }
    throw apiErr
  }
}
