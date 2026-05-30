/** Palettes par génération (niveau 0 = racines) */
export const ARBRE_NIVEAUX = [
  {
    label: 'Racines',
    card: 'linear-gradient(145deg, #f3e8ff 0%, #e4d0fc 100%)',
    cardDark: 'linear-gradient(145deg, #3d3258 0%, #2a2240 100%)',
    border: '#a78bdb',
    line: '#b894e8',
    avatar: '#d4c0f0',
    text: '#3d2d68'
  },
  {
    label: 'Génération 2',
    card: 'linear-gradient(145deg, #e0f2fe 0%, #bae6fd 100%)',
    cardDark: 'linear-gradient(145deg, #1e3a52 0%, #152a3d 100%)',
    border: '#5eb8e8',
    line: '#7ec8ef',
    avatar: '#a8d8f0',
    text: '#0f3d5c'
  },
  {
    label: 'Génération 3',
    card: 'linear-gradient(145deg, #dcfce7 0%, #bbf7d0 100%)',
    cardDark: 'linear-gradient(145deg, #1a3d28 0%, #122a1c 100%)',
    border: '#5cb87a',
    line: '#7dd498',
    avatar: '#b8e8c8',
    text: '#1a4a2a'
  },
  {
    label: 'Génération 4',
    card: 'linear-gradient(145deg, #ffe4e8 0%, #fecdd6 100%)',
    cardDark: 'linear-gradient(145deg, #4a2030 0%, #321820 100%)',
    border: '#e88aa8',
    line: '#f0a8bc',
    avatar: '#f0c0d0',
    text: '#601838'
  },
  {
    label: 'Génération 5',
    card: 'linear-gradient(145deg, #ffedd5 0%, #fed7aa 100%)',
    cardDark: 'linear-gradient(145deg, #4a3018 0%, #352210 100%)',
    border: '#e8a050',
    line: '#f0b870',
    avatar: '#f0d0a0',
    text: '#5c3810'
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

export function profondeurArbre(membres, racines) {
  const depth = (id) => {
    const kids = membres.filter((m) => m.parent_id === id)
    if (!kids.length) return 0
    return 1 + Math.max(...kids.map((k) => depth(k.id)))
  }
  if (!racines.length) return 0
  return Math.max(...racines.map((r) => depth(r.id)))
}
