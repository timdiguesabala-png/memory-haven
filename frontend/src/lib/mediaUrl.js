import { DEFAULT_MEDIA_LAYOUT, normalizeMediaLayout } from './mediaLayout'

const MEDIA_RE = /<!--MH_MEDIA:(.+?)-->/s

function encodeMediaPayload(urls, layout) {
  if (!urls?.length) return null
  if (urls.length === 1) return JSON.stringify(urls)
  const lay = normalizeMediaLayout(layout, urls.length)
  return JSON.stringify({ v: 1, urls, layout: lay })
}

function decodeMediaPayload(raw) {
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return { urls: parsed, layout: DEFAULT_MEDIA_LAYOUT }
    }
    if (parsed && Array.isArray(parsed.urls)) {
      return {
        urls: parsed.urls,
        layout: normalizeMediaLayout(parsed.layout, parsed.urls.length)
      }
    }
  } catch {
    /* ignore */
  }
  return { urls: [], layout: DEFAULT_MEDIA_LAYOUT }
}

/** Stocke les URLs Cloudinary + disposition dans la description. */
export function embedMediaInDescription(description, urls, layout = DEFAULT_MEDIA_LAYOUT) {
  const clean = stripMediaMarker(description || '')
  const payload = encodeMediaPayload(urls, layout)
  if (!payload) return clean || null
  return `${clean}\n<!--MH_MEDIA:${payload}-->`.trim()
}

export function stripMediaMarker(text) {
  return (text || '').replace(MEDIA_RE, '').trim()
}

/** URLs média, disposition et description sans marqueur interne. */
export function parseSouvenirMedia(souvenir) {
  const raw = souvenir?.description || ''
  let embedded = []
  let layout = DEFAULT_MEDIA_LAYOUT
  const match = raw.match(MEDIA_RE)
  if (match) {
    const decoded = decodeMediaPayload(match[1])
    embedded = decoded.urls
    layout = decoded.layout
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
    layout: normalizeMediaLayout(layout, urls.length),
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
