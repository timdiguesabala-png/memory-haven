/** Types de fichiers pour souvenirs (photos, vidéos, documents). */

export const DOCUMENT_ACCEPT =
  '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf,.csv,.jpg,.jpeg,.png,.gif,.webp,.heic,' +
  'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,' +
  'application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,' +
  'application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,' +
  'text/plain,text/csv,image/jpeg,image/png,image/gif,image/webp,image/heic'

const EXT_KIND = {
  pdf: 'pdf',
  doc: 'word',
  docx: 'word',
  xls: 'excel',
  xlsx: 'excel',
  ppt: 'powerpoint',
  pptx: 'powerpoint',
  txt: 'text',
  rtf: 'text',
  csv: 'csv',
  jpg: 'image',
  jpeg: 'image',
  png: 'image',
  gif: 'image',
  webp: 'image',
  heic: 'image'
}

export function extensionFromName(nameOrUrl) {
  const s = String(nameOrUrl || '')
  const base = s.split('?')[0].split('#')[0]
  const m = base.match(/\.([a-z0-9]{2,5})$/i)
  return m ? m[1].toLowerCase() : ''
}

export function detectMediaKind(url, name) {
  const ext = extensionFromName(name) || extensionFromName(url)
  if (ext && EXT_KIND[ext]) return EXT_KIND[ext]
  const u = String(url || '').toLowerCase()
  if (/\.(jpe?g|png|gif|webp|heic)(\?|$)/i.test(u)) return 'image'
  if (/\.pdf(\?|$)/i.test(u)) return 'pdf'
  if (/\.(docx?|rtf)(\?|$)/i.test(u)) return 'word'
  if (/\.(xlsx?|csv)(\?|$)/i.test(u)) return 'excel'
  if (/\.pptx?(\?|$)/i.test(u)) return 'powerpoint'
  if (/\.(mp3|wav|ogg|m4a)(\?|$)/i.test(u)) return 'audio'
  if (/\.(mp4|mov|webm|avi)(\?|$)/i.test(u)) return 'video'
  return 'file'
}

export function iconForMediaKind(kind) {
  const icons = {
    image: '🖼️',
    pdf: '📄',
    word: '📝',
    excel: '📊',
    powerpoint: '📽️',
    text: '📃',
    csv: '📊',
    audio: '🎵',
    video: '🎬',
    file: '📎'
  }
  return icons[kind] || icons.file
}

export function labelForMediaKind(kind) {
  const labels = {
    image: 'Image',
    pdf: 'PDF',
    word: 'Word',
    excel: 'Excel',
    powerpoint: 'PowerPoint',
    text: 'Texte',
    csv: 'CSV',
    audio: 'Audio',
    video: 'Vidéo',
    file: 'Document'
  }
  return labels[kind] || labels.file
}

export function displayFileName(item) {
  if (item?.name) return item.name
  const ext = extensionFromName(item?.url)
  return ext ? `fichier.${ext}` : 'fichier'
}

export function cloudinaryResourceTypeForSouvenir(type, file) {
  if (file?.type?.startsWith('image/')) return 'image'
  if (type === 'VIDEO' || file?.type?.startsWith('video/')) return 'video'
  if (type === 'AUDIO' || file?.type?.startsWith('audio/')) return 'raw'
  if (type === 'DOCUMENT') return 'raw'
  return 'image'
}
