const IMG_TAG = /\[mh-img\]([\s\S]*?)\[\/mh-img\]/i
const AUDIO_TAG = /\[mh-audio\]([\s\S]*?)\[\/mh-audio\]/i

function embedImage(contenu, url) {
  const base = (contenu || '').trim()
  const tag = `[mh-img]${url}[/mh-img]`
  return base ? `${base}\n${tag}` : tag
}

function embedAudio(contenu, url, duration) {
  const base = (contenu || '').trim()
  const dur = Number.isFinite(duration) ? duration : 0
  const tag = `[mh-audio]${url}|${dur}[/mh-audio]`
  return base ? `${base}\n${tag}` : tag
}

function parseEmbeddedMedia(contenu) {
  const text = contenu || ''
  let image_url = null
  let audio_url = null
  let audio_duration = null
  let clean = text

  const img = text.match(IMG_TAG)
  if (img) {
    image_url = img[1].trim()
    clean = clean.replace(IMG_TAG, '').trim()
  }

  const aud = text.match(AUDIO_TAG)
  if (aud) {
    const parts = aud[1].split('|')
    audio_url = parts[0].trim()
    audio_duration = parseInt(parts[1], 10) || null
    clean = clean.replace(AUDIO_TAG, '').trim()
  }

  return { contenu: clean, image_url, audio_url, audio_duration }
}

function enrichMessageFields(message) {
  if (!message) return message
  if (message.image_url || message.audio_url) {
    return {
      ...message,
      contenu: message.contenu || '',
      image_url: message.image_url || null,
      audio_url: message.audio_url || null,
      audio_duration: message.audio_duration ?? null
    }
  }
  const parsed = parseEmbeddedMedia(message.contenu)
  return { ...message, ...parsed }
}

module.exports = {
  embedImage,
  embedAudio,
  parseEmbeddedMedia,
  enrichMessageFields
}
