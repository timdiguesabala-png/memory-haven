const IMG_TAG = /\[mh-img\]([\s\S]*?)\[\/mh-img\]/i
const AUDIO_TAG = /\[mh-audio\]([\s\S]*?)\[\/mh-audio\]/i

export function enrichDiscussionMessage(msg) {
  if (!msg) return msg
  if (msg.image_url || msg.audio_url) return msg

  const text = msg.contenu || ''
  let image_url = null
  let audio_url = null
  let audio_duration = null
  let contenu = text

  const img = text.match(IMG_TAG)
  if (img) {
    image_url = img[1].trim()
    contenu = contenu.replace(IMG_TAG, '').trim()
  }

  const aud = text.match(AUDIO_TAG)
  if (aud) {
    const parts = aud[1].split('|')
    audio_url = parts[0].trim()
    audio_duration = parseInt(parts[1], 10) || null
    contenu = contenu.replace(AUDIO_TAG, '').trim()
  }

  return { ...msg, contenu, image_url, audio_url, audio_duration }
}

export function enrichDiscussionMessages(list) {
  return (list || []).map(enrichDiscussionMessage)
}
