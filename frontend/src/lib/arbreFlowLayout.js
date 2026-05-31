export const PERSON_NODE_WIDTH = 200
export const PERSON_NODE_HEIGHT = 132
const UNION_NODE_SIZE = 28
const H_GAP = 40
const V_GAP = 96
const COUPLE_GAP = 32

const GENRE_LABEL = {
  HOMME: 'Homme',
  FEMME: 'Femme',
  NON_PRECISE: 'Non précisé'
}

export function genreLabel(genre) {
  return GENRE_LABEL[genre] || GENRE_LABEL.NON_PRECISE
}

function unionId(a, b) {
  const lo = Math.min(a, b)
  const hi = Math.max(a, b)
  return `union-${lo}-${hi}`
}

function buildCoupleMap(membres) {
  const byId = new Map(membres.map((m) => [m.id, m]))
  const partnerOf = new Map()
  const unionByMember = new Map()

  for (const m of membres) {
    if (m.type_arbre !== 'CONJOINT' || !m.parent_id) continue
    const partner = byId.get(m.parent_id)
    if (!partner) continue
    partnerOf.set(m.id, partner.id)
    partnerOf.set(partner.id, m.id)
    const uid = unionId(m.id, partner.id)
    unionByMember.set(m.id, uid)
    unionByMember.set(partner.id, uid)
  }

  return { byId, partnerOf, unionByMember }
}

function parseBirthTime(membre) {
  const raw = membre?.date_naissance
  if (!raw) return null
  const t = new Date(raw).getTime()
  return Number.isFinite(t) ? t : null
}

/** Enfants d'un même couple : plus âgé à gauche, plus jeune à droite ; sans date après ceux datés. */
function sortSiblings(list) {
  return [...list].sort((a, b) => {
    const ta = parseBirthTime(a)
    const tb = parseBirthTime(b)
    if (ta !== null && tb !== null && ta !== tb) return ta - tb
    if (ta !== null && tb === null) return -1
    if (ta === null && tb !== null) return 1
    return (
      (a.layout_ordre ?? 0) - (b.layout_ordre ?? 0) ||
      (a.nom || '').localeCompare(b.nom || '', 'fr')
    )
  })
}

/** Enfants directs d'un parent (ou d'un couple via nœud union). */
function enfantsDe(anchorId, membres, unionByMember, partnerOf) {
  const aid = Number(anchorId)
  const uid = unionByMember.get(aid)

  return sortSiblings(
    membres.filter((m) => {
      if (m.type_arbre === 'CONJOINT' && partnerOf.has(m.id)) return false
      if (!m.parent_id) return false
      if (uid && unionByMember.has(m.parent_id)) {
        return unionByMember.get(m.parent_id) === uid
      }
      return m.parent_id === aid
    })
  )
}

function racines(membres, partnerOf) {
  return sortSiblings(
    membres.filter((m) => {
      if (m.type_arbre === 'CONJOINT' && partnerOf.has(m.id)) return false
      return !m.parent_id
    })
  )
}

function personNode(membre, x, y) {
  return {
    id: String(membre.id),
    type: 'person',
    data: { membre },
    position: { x, y }
  }
}

function unionNode(uid, x, y) {
  return {
    id: uid,
    type: 'union',
    data: {},
    position: { x, y },
    draggable: false,
    selectable: false
  }
}

function familyEdge(source, target) {
  const id = `f-${source}-${target}`
  return {
    id,
    source,
    target,
    type: 'family',
    data: { kind: 'family' },
    sourceHandle: 'bottom',
    targetHandle: 'top'
  }
}

function spouseEdge(a, b) {
  return {
    id: `s-${a}-${b}`,
    source: a,
    target: b,
    type: 'spouse',
    data: { kind: 'spouse' },
    sourceHandle: 'right',
    targetHandle: 'left'
  }
}

/**
 * Disposition récursive : parents en haut, enfants centrés en dessous, traits parent → enfant.
 */
function layoutFamille(membre, depth, startX, ctx, placedCouples) {
  const { byId, partnerOf, unionByMember, membres } = ctx
  const nodes = []
  const edges = []
  const y = depth * (PERSON_NODE_HEIGHT + V_GAP)
  let x = startX

  const partnerId = partnerOf.get(membre.id)
  const inCouple = partnerId && partnerOf.has(membre.id)

  if (inCouple) {
    const lo = Math.min(membre.id, partnerId)
    const hi = Math.max(membre.id, partnerId)
    const coupleKey = `${lo}-${hi}`
    if (placedCouples.has(coupleKey)) {
      return { width: 0, nodes, edges }
    }
    placedCouples.add(coupleKey)

    const left = byId.get(lo)
    const right = byId.get(hi)
    const uid = unionByMember.get(lo)
    const rowW = PERSON_NODE_WIDTH * 2 + COUPLE_GAP
    const leftX = x
    const rightX = x + PERSON_NODE_WIDTH + COUPLE_GAP
    const unionX = x + rowW / 2 - UNION_NODE_SIZE / 2
    const unionY = y + PERSON_NODE_HEIGHT + 20

    nodes.push(personNode(left, leftX, y))
    nodes.push(personNode(right, rightX, y))
    nodes.push(unionNode(uid, unionX, unionY))
    edges.push(spouseEdge(String(lo), String(hi)))
    edges.push(familyEdge(String(lo), uid))
    edges.push(familyEdge(String(hi), uid))

    const kids = enfantsDe(lo, membres, unionByMember, partnerOf)
    if (kids.length > 0) {
      const childDepth = depth + 2
      let cx = x
      let totalChildW = 0
      const childNodeStart = () => nodes.length
      kids.forEach((k, i) => {
        const layout = layoutFamille(k, childDepth, cx, ctx, placedCouples)
        layout.nodes.forEach((n) => nodes.push(n))
        edges.push(...layout.edges)
        edges.push(familyEdge(uid, String(k.id)))
        totalChildW += layout.width + (i < kids.length - 1 ? H_GAP : 0)
        cx += layout.width + H_GAP
      })
      centrerSousParent(nodes, childNodeStart(), x + rowW / 2)
      return { width: Math.max(rowW, totalChildW), nodes, edges }
    }

    return { width: rowW, nodes, edges }
  }

  nodes.push(personNode(membre, x, y))
  const kids = enfantsDe(membre.id, membres, unionByMember, partnerOf)

  if (kids.length === 0) {
    return { width: PERSON_NODE_WIDTH, nodes, edges }
  }

  const childDepth = depth + 1
  let cx = x
  let totalW = 0
  const childNodeStart = () => nodes.length
  kids.forEach((k, i) => {
    const layout = layoutFamille(k, childDepth, cx, ctx, placedCouples)
    layout.nodes.forEach((n) => nodes.push(n))
    edges.push(...layout.edges)
    edges.push(familyEdge(String(membre.id), String(k.id)))
    totalW += layout.width + (i < kids.length - 1 ? H_GAP : 0)
    cx += layout.width + H_GAP
  })
  centrerSousParent(nodes, childNodeStart(), x + PERSON_NODE_WIDTH / 2)

  return { width: Math.max(PERSON_NODE_WIDTH, totalW), nodes, edges }
}

/** Centre un groupe de nœuds descendants sous le parent. */
function centrerSousParent(nodes, fromIndex, parentCenterX) {
  if (fromIndex >= nodes.length) return
  let minX = Infinity
  let maxX = -Infinity
  for (let i = fromIndex; i < nodes.length; i++) {
    const nx = nodes[i].position.x
    const w = nodes[i].type === 'union' ? UNION_NODE_SIZE : PERSON_NODE_WIDTH
    minX = Math.min(minX, nx)
    maxX = Math.max(maxX, nx + w)
  }
  const center = (minX + maxX) / 2
  const shift = parentCenterX - center
  if (Math.abs(shift) < 2) return
  for (let i = fromIndex; i < nodes.length; i++) {
    nodes[i].position.x += shift
  }
}

export function buildArbreFlowLayout(membres) {
  if (!membres?.length) {
    return { nodes: [], edges: [] }
  }

  const ctx = { ...buildCoupleMap(membres), membres }
  const placedCouples = new Set()
  const rootsList = racines(membres, ctx.partnerOf)

  let offsetX = 40
  const allNodes = []
  const allEdges = []
  const seenIds = new Set()

  for (const root of rootsList) {
    const { width, nodes, edges } = layoutFamille(root, 0, offsetX, ctx, placedCouples)
    nodes.forEach((n) => {
      if (seenIds.has(n.id)) return
      seenIds.add(n.id)
      allNodes.push(n)
    })
    allEdges.push(...edges)
    offsetX += Math.max(width, PERSON_NODE_WIDTH) + H_GAP * 2
  }

  membres.forEach((m) => {
    const id = String(m.id)
    if (seenIds.has(id)) return
    if (m.type_arbre === 'CONJOINT' && ctx.partnerOf.has(m.id)) return
    const { width, nodes, edges } = layoutFamille(m, 0, offsetX, ctx, placedCouples)
    nodes.forEach((n) => {
      if (seenIds.has(n.id)) return
      seenIds.add(n.id)
      allNodes.push(n)
    })
    allEdges.push(...edges)
    offsetX += Math.max(width, PERSON_NODE_WIDTH) + H_GAP * 2
  })

  return { nodes: allNodes, edges: allEdges }
}

export function formatNaissance(membre) {
  if (!membre?.date_naissance) return null
  try {
    return new Date(membre.date_naissance).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return null
  }
}

export { sortSiblings }
