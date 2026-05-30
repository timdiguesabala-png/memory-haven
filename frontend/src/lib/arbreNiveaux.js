/** Palettes par génération (niveau 0 = racines) */
export const ARBRE_NIVEAUX = [
  {
    label: 'Racines',
    card: 'linear-gradient(145deg, #f3e8ff 0%, #e4d0fc 100%)',
    cardDark: 'linear-gradient(145deg, #3d3258 0%, #2a2240 100%)',
    border: '#a78bdb',
    line: '#b894e8',
    avatar: '#E8C9A0',
    text: '#3D2410'
  },
  {
    label: 'Génération 2',
    card: 'linear-gradient(145deg, #e8f0ff 0%, #c8d8e8 100%)',
    cardDark: 'linear-gradient(145deg, #1e3a52 0%, #152a3d 100%)',
    border: '#7eb0d8',
    line: '#C8D8E8',
    avatar: '#C8D8E8',
    text: '#203060'
  },
  {
    label: 'Génération 3',
    card: 'linear-gradient(145deg, #f0e8ff 0%, #d8c8e0 100%)',
    cardDark: 'linear-gradient(145deg, #3a2848 0%, #2a2040 100%)',
    border: '#b898d0',
    line: '#D8C8E0',
    avatar: '#D8C8E0',
    text: '#402060'
  },
  {
    label: 'Génération 4',
    card: 'linear-gradient(145deg, #e8f8ec 0%, #c8e0c8 100%)',
    cardDark: 'linear-gradient(145deg, #1a3d28 0%, #122a1c 100%)',
    border: '#7ab88a',
    line: '#C8E0C8',
    avatar: '#C8E0C8',
    text: '#2A6030'
  },
  {
    label: 'Génération 5',
    card: 'linear-gradient(145deg, #ffe8f0 0%, #e8c8d8 100%)',
    cardDark: 'linear-gradient(145deg, #4a2030 0%, #321820 100%)',
    border: '#d888a8',
    line: '#E8C8D8',
    avatar: '#E8C8D8',
    text: '#601840'
  },
  {
    label: 'Génération 6',
    card: 'linear-gradient(145deg, #ccfbf1 0%, #99f6e4 100%)',
    cardDark: 'linear-gradient(145deg, #1a4038 0%, #122c28 100%)',
    border: '#40b8a8',
    line: '#60d0c0',
    avatar: '#90e0d4',
    text: '#124038'
  },
  {
    label: 'Génération 7',
    card: 'linear-gradient(145deg, #fef9c3 0%, #fde68a 100%)',
    cardDark: 'linear-gradient(145deg, #454018 0%, #302c10 100%)',
    border: '#d4b830',
    line: '#e8d060',
    avatar: '#f0e0a0',
    text: '#4a4010'
  },
  {
    label: 'Génération 8+',
    card: 'linear-gradient(145deg, #e0e7ff 0%, #c7d2fe 100%)',
    cardDark: 'linear-gradient(145deg, #283050 0%, #1c2240 100%)',
    border: '#8090e8',
    line: '#98a8f0',
    avatar: '#b8c4f0',
    text: '#283060'
  }
]

export function getNiveauPalette(niveau) {
  return ARBRE_NIVEAUX[((niveau % ARBRE_NIVEAUX.length) + ARBRE_NIVEAUX.length) % ARBRE_NIVEAUX.length]
}

/** Générations de haut en bas (racines → descendants) */
export function buildGenerations(membres) {
  if (!membres?.length) return []

  const byParent = new Map()
  membres.forEach((m) => {
    const key = m.parent_id ?? null
    if (!byParent.has(key)) byParent.set(key, [])
    byParent.get(key).push(m)
  })

  const racines = membres.filter((m) => !m.parent_id)
  const gens = []
  let layer = racines.slice()
  const placed = new Set()

  while (layer.length) {
    gens.push(layer)
    layer.forEach((m) => placed.add(m.id))
    layer = layer.flatMap((m) => byParent.get(m.id) || [])
  }

  const rest = membres.filter((m) => !placed.has(m.id))
  if (rest.length) {
    if (gens.length) gens[gens.length - 1].push(...rest)
    else gens.push(rest)
  }

  return gens
}

export function profondeurArbre(membres, racines) {
  const depth = (id) => {
    const kids = membres.filter((m) => m.parent_id === id)
    if (!kids.length) return 0
    return 1 + Math.max(...kids.map((k) => depth(k.id)))
  }
  if (!racines.length) return 0
  return Math.max(...racines.map((r) => depth(r.id)))
}
