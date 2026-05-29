/** Dispositions des médias quand il y a plusieurs fichiers */
export const MEDIA_LAYOUTS = {
  grille: {
    id: 'grille',
    label: 'Grille',
    icon: '▦',
    hint: '2×2, style album'
  },
  horizontal: {
    id: 'horizontal',
    label: 'Côte à côte',
    icon: '▤',
    hint: 'Fichiers alignés en ligne'
  },
  vertical: {
    id: 'vertical',
    label: 'Empilé',
    icon: '▥',
    hint: 'Un fichier sous l’autre'
  },
  mosaique: {
    id: 'mosaique',
    label: 'Mosaïque',
    icon: '◧',
    hint: 'Grande image à gauche',
    minFiles: 3
  }
}

export const DEFAULT_MEDIA_LAYOUT = 'grille'

export function getLayoutOptions(fileCount) {
  return Object.values(MEDIA_LAYOUTS).filter(
    (opt) => !opt.minFiles || fileCount >= opt.minFiles
  )
}

/** Mosaïque peu adaptée à 2 fichiers → grille */
export function normalizeMediaLayout(layout, fileCount) {
  if (!layout || fileCount <= 1) return DEFAULT_MEDIA_LAYOUT
  if (layout === 'mosaique' && fileCount < 3) return 'grille'
  if (MEDIA_LAYOUTS[layout]) return layout
  return DEFAULT_MEDIA_LAYOUT
}
