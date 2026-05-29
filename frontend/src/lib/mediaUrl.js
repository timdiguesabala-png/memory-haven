const MEDIA_RE = /<!--MH_MEDIA:(.+?)-->/s

function normalizeMediaEntry(entry) {
  if (!entry) return null
  if (typeof entry === 'string') return { url: entry, name: null }
  if (entry.url) return { url: entry.url, name: entry.name || null }
  return null
}

/** Stocke URLs (+ noms de fichiers optionnels) dans la description. */
export function embedMediaInDescription(description, items) {
  const clean = stripMediaMarker(description || '')
  const list = (items || []).map(normalizeMediaEntry).filter(Boolean)
  if (!list.length) return clean || null
  const payload = list.map(({ url, name }) => (name ? { url, name } : url))
  return `${clean}\n<!--MH_MEDIA:${JSON.stringify(payload)}-->`.trim()
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

  const mediaItems = []
  const seen = new Set()

  const pushItem = (entry) => {
    const item = normalizeMediaEntry(entry)
    if (!item?.url || seen.has(item.url)) return
    seen.add(item.url)
    mediaItems.push(item)
  }

  if (souvenir?.fichier_url) pushItem(souvenir.fichier_url)
  if (Array.isArray(souvenir?.fichiers_multiple)) {
    souvenir.fichiers_multiple.forEach(pushItem)
  }
  for (const entry of embedded) pushItem(entry)

  return {
    urls: mediaItems.map((m) => m.url),
    mediaItems,
    cleanDescription: stripMediaMarker(raw) || null
  }
}

export function primaryMediaUrl(souvenir) {
  return parseSouvenirMedia(souvenir).urls[0] || null
}
