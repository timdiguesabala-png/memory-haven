const KEY_PREFIX = 'mh-arbre-card-size-'

/** Tailles agrandies par rapport à la v79 (défaut : Grand). */
export const ARBRE_CARD_SIZES = {
  petit: { width: 188, height: 128, avatar: 52, hGap: 48, vGap: 108, coupleGap: 48, label: 'Petit' },
  moyen: { width: 248, height: 168, avatar: 68, hGap: 56, vGap: 128, coupleGap: 56, label: 'Moyen' },
  grand: { width: 308, height: 208, avatar: 84, hGap: 64, vGap: 148, coupleGap: 64, label: 'Grand' }
}

export const DEFAULT_ARBRE_CARD_SIZE = 'grand'

export function getArbreLayoutDims(cardSize) {
  return ARBRE_CARD_SIZES[cardSize] || ARBRE_CARD_SIZES[DEFAULT_ARBRE_CARD_SIZE]
}

export function loadArbreCardSize(familleId) {
  if (!familleId) return DEFAULT_ARBRE_CARD_SIZE
  try {
    const raw = localStorage.getItem(`${KEY_PREFIX}${familleId}`)
    if (!raw || !ARBRE_CARD_SIZES[raw]) return DEFAULT_ARBRE_CARD_SIZE
    return raw
  } catch {
    return DEFAULT_ARBRE_CARD_SIZE
  }
}

export function saveArbreCardSize(familleId, size) {
  if (!familleId || !ARBRE_CARD_SIZES[size]) return
  localStorage.setItem(`${KEY_PREFIX}${familleId}`, size)
}

/** Si l’ancienne préférence « moyen » v79 est trop petite, passer en grand une fois. */
export function migrateArbreCardSize(familleId) {
  const key = `${KEY_PREFIX}${familleId}`
  const legacy = localStorage.getItem(key)
  if (legacy === 'moyen' || legacy === 'petit') {
    localStorage.setItem(key, 'grand')
    return 'grand'
  }
  return loadArbreCardSize(familleId)
}
