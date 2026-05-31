const KEY_PREFIX = 'mh-arbre-card-size-'

export const ARBRE_CARD_SIZES = {
  petit: { width: 148, height: 90, avatar: 40, hGap: 36, vGap: 88, coupleGap: 36, label: 'Petit' },
  moyen: { width: 200, height: 132, avatar: 56, hGap: 44, vGap: 110, coupleGap: 44, label: 'Moyen' },
  grand: { width: 268, height: 172, avatar: 72, hGap: 52, vGap: 128, coupleGap: 52, label: 'Grand' }
}

export const DEFAULT_ARBRE_CARD_SIZE = 'moyen'

export function getArbreLayoutDims(cardSize) {
  return ARBRE_CARD_SIZES[cardSize] || ARBRE_CARD_SIZES[DEFAULT_ARBRE_CARD_SIZE]
}

export function loadArbreCardSize(familleId) {
  if (!familleId) return DEFAULT_ARBRE_CARD_SIZE
  try {
    const raw = localStorage.getItem(`${KEY_PREFIX}${familleId}`)
    return raw && ARBRE_CARD_SIZES[raw] ? raw : DEFAULT_ARBRE_CARD_SIZE
  } catch {
    return DEFAULT_ARBRE_CARD_SIZE
  }
}

export function saveArbreCardSize(familleId, size) {
  if (!familleId || !ARBRE_CARD_SIZES[size]) return
  localStorage.setItem(`${KEY_PREFIX}${familleId}`, size)
}
