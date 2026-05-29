const MEDIA_RE = /<!--MH_MEDIA:(.+?)-->/s

function normalizeMediaEntry(entry) {
  if (!entry) return null
  if (typeof entry === 'string') return { url: entry, name: null }
  if (entry.url) return { url: entry.url, name: entry.name || null }
  return null
}

function stripMediaMarker(text) {
  return (text || '').replace(MEDIA_RE, '').trim()
}

function embedMediaInDescription(description, items) {
  const clean = stripMediaMarker(description || '')
  const list = (items || []).map(normalizeMediaEntry).filter(Boolean)
  if (!list.length) return clean || null
  const payload = list.map(({ url, name }) => (name ? { url, name } : url))
  return `${clean}\n<!--MH_MEDIA:${JSON.stringify(payload)}-->`.trim()
}

module.exports = { embedMediaInDescription, stripMediaMarker }
