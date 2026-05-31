import { DEFAULT_ARBRE_CARD_SIZE, getArbreLayoutDims } from './arbreCardSize'

export const PERSON_NODE_WIDTH = 200
export const PERSON_NODE_HEIGHT = 132
const UNION_NODE_SIZE = 32
const LAYOUT_PAD_TOP = 48

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

/** Racines : premier membre créé en premier (ligne du haut, centré ensuite). */
function racines(membres, partnerOf) {
  return membres
    .filter((m) => {
      if (m.type_arbre === 'CONJOINT' && partnerOf.has(m.id)) return false
      return !m.parent_id
    })
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
}

function personNode(membre, x, y, dims) {
  const { width: NW, height: NH } = dims
  return {
    id: String(membre.id),
    type: 'person',
    data: { membre },
    position: { x, y },
    width: NW,
    height: NH
  }
}

function unionNode(uid, x, y) {
  return {
    id: uid,
    type: 'union',
    data: {},
    position: { x, y },
    width: UNION_NODE_SIZE,
    height: UNION_NODE_SIZE,
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
    type: 'smoothstep',
    data: { kind: 'family' },
    sourceHandle: 'bottom',
    targetHandle: 'top'
  }
}

function spouseEdgePersonUnion(personId, unionId) {
  return {
    id: `s-${personId}-${unionId}`,
    source: personId,
    target: unionId,
    type: 'smoothstep',
    data: { kind: 'spouse' },
    sourceHandle: 'right',
    targetHandle: 'left'
  }
}

function spouseEdgeUnionPerson(unionId, personId) {
  return {
    id: `s-${unionId}-${personId}`,
    source: unionId,
    target: personId,
    type: 'smoothstep',
    data: { kind: 'spouse' },
    sourceHandle: 'right',
    targetHandle: 'left'
  }
}

/**
 * Disposition récursive : parents en haut, enfants centrés en dessous, traits parent → enfant.
 */
function layoutFamille(membre, depth, startX, ctx, placedCouples) {
  const { byId, partnerOf, unionByMember, membres, dims } = ctx
  const { width: NW, height: NH, hGap: H_GAP, vGap: V_GAP, coupleGap: COUPLE_GAP } = dims
  const nodes = []
  const edges = []
  const y = LAYOUT_PAD_TOP + depth * (NH + V_GAP)
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
    const rowW = NW * 2 + COUPLE_GAP
    const leftX = x
    const rightX = x + NW + COUPLE_GAP
    const unionX = x + NW + (COUPLE_GAP - UNION_NODE_SIZE) / 2
    const unionY = y + (NH - UNION_NODE_SIZE) / 2

    nodes.push(personNode(left, leftX, y, dims))
    nodes.push(personNode(right, rightX, y, dims))
    nodes.push(unionNode(uid, unionX, unionY))
    edges.push(spouseEdgePersonUnion(String(lo), uid))
    edges.push(spouseEdgeUnionPerson(uid, String(hi)))

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
      centrerSousParent(nodes, childNodeStart(), x + rowW / 2, ctx)
      return { width: Math.max(rowW, totalChildW), nodes, edges }
    }

    return { width: rowW, nodes, edges }
  }

  nodes.push(personNode(membre, x, y, dims))
  const kids = enfantsDe(membre.id, membres, unionByMember, partnerOf)

  if (kids.length === 0) {
    return { width: NW, nodes, edges }
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
  centrerSousParent(nodes, childNodeStart(), x + NW / 2, ctx)

  return { width: Math.max(NW, totalW), nodes, edges }
}

/** Centre un groupe de nœuds descendants sous le parent. */
function centrerSousParent(nodes, fromIndex, parentCenterX, ctx) {
  if (fromIndex >= nodes.length) return
  const NW = ctx.dims.width
  let minX = Infinity
  let maxX = -Infinity
  for (let i = fromIndex; i < nodes.length; i++) {
    const nx = nodes[i].position.x
    const w = nodes[i].type === 'union' ? UNION_NODE_SIZE : NW
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

function nodeWidth(n, ctx) {
  return n.type === 'union' ? UNION_NODE_SIZE : ctx.dims.width
}

function centreCoupleRacine(nodes, primaryRoot, ctx) {
  if (!primaryRoot || !nodes.length) return
  const ids = new Set([String(primaryRoot.id)])
  const partnerId = ctx.partnerOf.get(primaryRoot.id)
  if (partnerId) ids.add(String(partnerId))

  const racineNodes = nodes.filter((n) => n.type === 'person' && ids.has(n.id))
  if (!racineNodes.length) return

  let rootMin = Infinity
  let rootMax = -Infinity
  for (const n of racineNodes) {
    rootMin = Math.min(rootMin, n.position.x)
    rootMax = Math.max(rootMax, n.position.x + ctx.dims.width)
  }
  const rootCenter = (rootMin + rootMax) / 2

  let treeMin = Infinity
  let treeMax = -Infinity
  for (const n of nodes) {
    const w = nodeWidth(n, ctx)
    treeMin = Math.min(treeMin, n.position.x)
    treeMax = Math.max(treeMax, n.position.x + w)
  }
  const shift = (treeMin + treeMax) / 2 - rootCenter
  if (Math.abs(shift) < 2) return
  for (const n of nodes) {
    n.position.x += shift
  }
}

export function buildArbreFlowLayout(membres, cardSize = DEFAULT_ARBRE_CARD_SIZE) {
  if (!membres?.length) {
    return { nodes: [], edges: [] }
  }

  const dims = getArbreLayoutDims(cardSize)
  const ctx = { ...buildCoupleMap(membres), membres, dims }
  const placedCouples = new Set()
  const rootsList = racines(membres, ctx.partnerOf)
  const primaryRoot = rootsList[0] ?? null

  let offsetX = 0
  const allNodes = []
  const allEdges = []
  const seenIds = new Set()
  const { width: NW, hGap: H_GAP } = dims

  const rootsOrdered = primaryRoot
    ? [primaryRoot, ...rootsList.filter((r) => r.id !== primaryRoot.id)]
    : rootsList

  for (const root of rootsOrdered) {
    const { width, nodes, edges } = layoutFamille(root, 0, offsetX, ctx, placedCouples)
    nodes.forEach((n) => {
      if (seenIds.has(n.id)) return
      seenIds.add(n.id)
      allNodes.push(n)
    })
    allEdges.push(...edges)
    offsetX += Math.max(width, NW) + H_GAP * 2
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
    offsetX += Math.max(width, NW) + H_GAP * 2
  })

  centreCoupleRacine(allNodes, primaryRoot, ctx)

  return { nodes: allNodes, edges: allEdges }
}

function extractYear(dateStr) {
  if (!dateStr) return null
  const y = new Date(dateStr).getFullYear()
  return Number.isFinite(y) ? String(y) : null
}

/** Années sur la carte (ex. 1945 – 2020). */
export function formatAnneesVie(membre) {
  if (!membre) return null
  const naissance = extractYear(membre.date_naissance)
  const deces = extractYear(membre.date_deces)
  if (naissance && deces) return `${naissance} – ${deces}`
  if (naissance) return naissance
  if (deces) return `† ${deces}`
  return null
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
