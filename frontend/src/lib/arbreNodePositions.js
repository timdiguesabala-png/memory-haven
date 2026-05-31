import api from '../services/api'

const KEY_PREFIX = 'mh-arbre-positions-'

export function loadArbrePositionsLocal(familleId) {
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

export function saveArbrePositionsLocal(familleId, positions) {
  if (!familleId) return
  localStorage.setItem(`${KEY_PREFIX}${familleId}`, JSON.stringify(positions))
}

export function clearArbrePositionsLocal(familleId) {
  if (!familleId) return
  localStorage.removeItem(`${KEY_PREFIX}${familleId}`)
}

/** Fusionne positions serveur + cache local (serveur prioritaire). */
export function mergeArbrePositions(serverPositions, familleId) {
  const local = loadArbrePositionsLocal(familleId)
  const server =
    serverPositions && typeof serverPositions === 'object' ? serverPositions : {}
  return { ...local, ...server }
}

export async function saveArbrePositionsServer(positions) {
  const rep = await api.put('/arbre/positions', { positions })
  return rep.data?.positions ?? positions
}

export async function clearArbrePositionsServer() {
  const rep = await api.delete('/arbre/positions')
  return rep.data?.positions ?? {}
}

export function positionsFromNodes(nodes) {
  const out = {}
  for (const n of nodes) {
    if (!n?.id || !n.position) continue
    out[n.id] = { x: n.position.x, y: n.position.y }
  }
  return out
}

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
