export function getTypeLabel(type) {
  if (type === 'PHOTO') return '📷 Photo'
  if (type === 'AUDIO') return '🎙️ Audio'
  if (type === 'VIDEO') return '🎬 Vidéo'
  if (type === 'DOCUMENT') return '📎 Document'
  return '📝 Texte'
}

export function getTypeClass(type) {
  if (type === 'PHOTO') return 'mh-memory-type--photo'
  if (type === 'AUDIO') return 'mh-memory-type--audio'
  if (type === 'VIDEO') return 'mh-memory-type--video'
  if (type === 'DOCUMENT') return 'mh-memory-type--document'
  return 'mh-memory-type--texte'
}

export function getPostClass(type) {
  if (type === 'PHOTO') return 'mh-post--photo'
  if (type === 'AUDIO') return 'mh-post--audio'
  if (type === 'VIDEO') return 'mh-post--video'
  if (type === 'DOCUMENT') return 'mh-post--document'
  return 'mh-post--texte'
}
