const KEY_PREFIX = 'mh-arbre-positions-'

export function loadArbrePositions(familleId) {
  if (!familleId) return {}
  try {
    const raw = localStorage.getItem(`${KEY_PREFIX}${familleId}`)
    if (!raw) return {}
    const data = JSON.parse(raw)
    return data && typeof data === 'object' ? data : {}
  } catch {
    return {}
  }
}

export function saveArbrePositions(familleId, positions) {
  if (!familleId) return
  localStorage.setItem(`${KEY_PREFIX}${familleId}`, JSON.stringify(positions))
}

export function clearArbrePositions(familleId) {
  if (!familleId) return
  localStorage.removeItem(`${KEY_PREFIX}${familleId}`)
}

export function positionsFromNodes(nodes) {
  const out = {}
  for (const n of nodes) {
    if (!n?.id || !n.position) continue
    out[n.id] = { x: n.position.x, y: n.position.y }
  }
  return out
}

/** Applique les positions enregistrées par l'utilisateur (glisser-déposer). */
export function applySavedPositions(nodes, saved) {
  if (!saved || !Object.keys(saved).length) return nodes
  return nodes.map((n) => {
    const p = saved[n.id]
    if (p && Number.isFinite(p.x) && Number.isFinite(p.y)) {
      return { ...n, position: { x: p.x, y: p.y } }
    }
    return n
  })
}
