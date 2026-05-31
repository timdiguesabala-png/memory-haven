const KEY_PREFIX = 'mh-arbre-card-size-'

export const ARBRE_CARD_SIZES = {
  petit: { width: 148, height: 100, avatar: 40, hGap: 40, vGap: 100, coupleGap: 40, label: 'Petit' },
  moyen: { width: 200, height: 140, avatar: 56, hGap: 48, vGap: 120, coupleGap: 48, label: 'Moyen' },
  grand: { width: 268, height: 180, avatar: 72, hGap: 56, vGap: 140, coupleGap: 56, label: 'Grand' }
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
