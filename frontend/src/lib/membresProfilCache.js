const KEY = 'mh_famille_profils_v1'

export function cacheMembresList(list) {
  if (!Array.isArray(list) || !list.length) return
  try {
    const byId = {}
    for (const m of list) {
      if (m?.id != null) byId[String(m.id)] = m
    }
    localStorage.setItem(KEY, JSON.stringify({ at: Date.now(), byId }))
  } catch {
    /* quota */
  }
}

export function getCachedMembre(id) {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const { byId } = JSON.parse(raw)
    return byId?.[String(id)] ?? null
  } catch {
    return null
  }
}
