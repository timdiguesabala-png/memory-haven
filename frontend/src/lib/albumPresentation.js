const COVER_GRADIENTS = [
  'linear-gradient(160deg, #e8dfd0 0%, #d4c4a8 100%)',
  'linear-gradient(160deg, #dce8df 0%, #b8d4c0 100%)',
  'linear-gradient(160deg, #f0e6c8 0%, #e0d0a8 100%)',
  'linear-gradient(160deg, #e8d4c4 0%, #d8b8a0 100%)',
  'linear-gradient(160deg, #dce8f0 0%, #b8cce0 100%)',
  'linear-gradient(160deg, #f5ebe0 0%, #e8d8c8 100%)'
]

const KEYWORD_EMOJI = [
  [/lomé|plage|vacances|mer|été/i, '🌊'],
  [/noël|noel|fête|fete/i, '🎄'],
  [/mariage|marié|mariee/i, '💒'],
  [/anniversaire|80 ans|fête des/i, '🎉'],
  [/maison|famille|foyer/i, '🏠'],
  [/photo|album/i, '📷'],
  [/audio|voix|conte/i, '🎙️'],
  [/vidéo|video/i, '🎬']
]

export function albumCoverGradient(index) {
  return COVER_GRADIENTS[index % COVER_GRADIENTS.length]
}

export function albumEmoji(nom, description = '') {
  const text = `${nom || ''} ${description || ''}`
  for (const [re, emoji] of KEYWORD_EMOJI) {
    if (re.test(text)) return emoji
  }
  return '📸'
}

export function formatAlbumDate(dateStr) {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      month: 'short',
      year: 'numeric'
    })
  } catch {
    return ''
  }
}

export function albumMetaLine(album) {
  const prenom = album.createur?.prenom || 'Famille'
  const date = formatAlbumDate(album.created_at)
  if (date) return `Par ${prenom} · ${date}`
  return `Par ${prenom}`
}
