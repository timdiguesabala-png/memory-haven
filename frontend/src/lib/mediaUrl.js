const MEDIA_RE = /<!--MH_MEDIA:(.+?)-->/s

/** Stocke les URLs Cloudinary dans la description (API Railway ancienne). */
export function embedMediaInDescription(description, urls) {
  const clean = stripMediaMarker(description || '')
  if (!urls?.length) return clean || null
  return `${clean}\n<!--MH_MEDIA:${JSON.stringify(urls)}-->`.trim()
}

export function stripMediaMarker(text) {
  return (text || '').replace(MEDIA_RE, '').trim()
}

/** URLs média + description sans marqueur interne. */
export function parseSouvenirMedia(souvenir) {
  const raw = souvenir?.description || ''
  let embedded = []
  const match = raw.match(MEDIA_RE)
  if (match) {
    try {
      embedded = JSON.parse(match[1])
    } catch {
      embedded = []
    }
  }

  const urls = []
  if (souvenir?.fichier_url) urls.push(souvenir.fichier_url)
  if (Array.isArray(souvenir?.fichiers_multiple)) {
    urls.push(...souvenir.fichiers_multiple)
  }
  for (const u of embedded) {
    if (u && !urls.includes(u)) urls.push(u)
  }

  return {
    urls,
    cleanDescription: stripMediaMarker(raw) || null
  }
}

export function primaryMediaUrl(souvenir) {
  return parseSouvenirMedia(souvenir).urls[0] || null
}

/** image | video | audio */
export function getMediaKind(url) {
  if (!url) return 'image'
  const u = String(url).toLowerCase()
  const path = u.split('?')[0]
  if (u.includes('/video/upload') || /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i.test(path)) {
    return 'video'
  }
  if (/\.(mp3|wav|m4a|aac|ogg|flac)(\?|#|$)/i.test(path)) {
    return 'audio'
  }
  return 'image'
}

export function buildMediaItems(urls, { titre = '', id = '' } = {}) {
  return (urls || []).filter(Boolean).map((url, index) => ({
    url,
    kind: getMediaKind(url),
    titre,
    id,
    index
  }))
}
