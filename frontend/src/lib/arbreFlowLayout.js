import dagre from '@dagrejs/dagre'

export const PERSON_NODE_WIDTH = 200
export const PERSON_NODE_HEIGHT = 132
const UNION_NODE_SIZE = 28

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

/** Paires conjoint·e (type CONJOINT → parent_id = partenaire) */
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

  return { partnerOf, unionByMember }
}

function sortSiblings(list) {
  return [...list].sort(
    (a, b) =>
      (a.layout_ordre ?? 0) - (b.layout_ordre ?? 0) ||
      (a.nom || '').localeCompare(b.nom || '', 'fr')
  )
}

/**
 * Construit nœuds / arêtes React Flow + layout Dagre (TB : parents au-dessus).
 */
export function buildArbreFlowLayout(membres) {
  if (!membres?.length) {
    return { nodes: [], edges: [] }
  }

  const { partnerOf, unionByMember } = buildCoupleMap(membres)
  const unionsUsed = new Set()

  const flowNodes = []
  const flowEdges = []
  const dagreNodes = []
  const dagreEdges = []

  for (const m of membres) {
    const id = String(m.id)
    flowNodes.push({
      id,
      type: 'person',
      data: { membre: m },
      position: { x: 0, y: 0 }
    })
    dagreNodes.push({ id, width: PERSON_NODE_WIDTH, height: PERSON_NODE_HEIGHT })
  }

  for (const m of membres) {
    if (!partnerOf.has(m.id) || m.id > partnerOf.get(m.id)) continue
    const uid = unionByMember.get(m.id)
    if (unionsUsed.has(uid)) continue
    unionsUsed.add(uid)

    flowNodes.push({
      id: uid,
      type: 'union',
      data: {},
      position: { x: 0, y: 0 },
      draggable: false,
      selectable: false
    })
    dagreNodes.push({ id: uid, width: UNION_NODE_SIZE, height: UNION_NODE_SIZE })

    const p1 = String(m.id)
    const p2 = String(partnerOf.get(m.id))
    for (const [src, tid] of [
      [p1, uid],
      [p2, uid]
    ]) {
      const eid = `sp-${src}-${tid}`
      flowEdges.push({
        id: eid,
        source: src,
        target: tid,
        type: 'spouse',
        data: { kind: 'spouse' }
      })
      dagreEdges.push({ source: src, target: tid })
    }
  }

  const childrenBySource = new Map()

  for (const m of membres) {
    if (m.type_arbre === 'CONJOINT' && partnerOf.has(m.id)) continue

    if (!m.parent_id) continue

    let source = String(m.parent_id)
    if (unionByMember.has(m.parent_id)) {
      source = unionByMember.get(m.parent_id)
    }

    const target = String(m.id)
    const eid = `f-${source}-${target}`
    if (flowEdges.some((e) => e.id === eid)) continue

    flowEdges.push({
      id: eid,
      source,
      target,
      type: 'family',
      data: { kind: 'family' }
    })
    dagreEdges.push({ source, target, minlen: 1 })

    if (!childrenBySource.has(source)) childrenBySource.set(source, [])
    childrenBySource.get(source).push(m)
  }

  for (const m of membres) {
    if (!partnerOf.has(m.id) || m.id > partnerOf.get(m.id)) continue
    const p1 = String(m.id)
    const p2 = String(partnerOf.get(m.id))
    dagreEdges.push({ source: p1, target: p2, minlen: 0 })
  }

  for (const [, kids] of childrenBySource) {
    const sorted = sortSiblings(kids)
    for (let i = 0; i < sorted.length - 1; i++) {
      const a = String(sorted[i].id)
      const b = String(sorted[i + 1].id)
      dagreEdges.push({ source: a, target: b, minlen: 0 })
    }
  }

  const count = membres.length
  const nodesep = Math.min(120, 48 + Math.floor(count / 8) * 8)
  const ranksep = Math.min(140, 80 + Math.floor(count / 10) * 6)

  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({
    rankdir: 'TB',
    align: 'C',
    nodesep,
    ranksep,
    edgesep: 24,
    marginx: 40,
    marginy: 40
  })

  for (const n of dagreNodes) {
    g.setNode(n.id, { width: n.width, height: n.height })
  }
  for (const e of dagreEdges) {
    try {
      g.setEdge(e.source, e.target, { minlen: e.minlen ?? 1 })
    } catch {
      /* arête invalide (cycle) — ignorée */
    }
  }

  try {
    dagre.layout(g)
  } catch {
    return {
      nodes: flowNodes.map((node, i) => ({
        ...node,
        position: { x: (i % 4) * (PERSON_NODE_WIDTH + 40), y: Math.floor(i / 4) * (PERSON_NODE_HEIGHT + 50) }
      })),
      edges: flowEdges
    }
  }

  const nodes = flowNodes.map((node) => {
    const pos = g.node(node.id)
    if (!pos) return node
    const w = node.type === 'union' ? UNION_NODE_SIZE : PERSON_NODE_WIDTH
    const h = node.type === 'union' ? UNION_NODE_SIZE : PERSON_NODE_HEIGHT
    return {
      ...node,
      position: {
        x: pos.x - w / 2,
        y: pos.y - h / 2
      }
    }
  })

  return { nodes, edges: flowEdges }
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
