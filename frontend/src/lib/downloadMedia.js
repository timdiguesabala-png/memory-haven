/** Télécharge un fichier média (photo, audio, vidéo) dans le navigateur. */
export async function downloadMedia(url, baseName = 'souvenir') {
  if (!url) return
  try {
    const response = await fetch(url, { mode: 'cors' })
    const blob = await response.blob()
    const ext = guessExtension(url, blob.type)
    const safeName = String(baseName).replace(/[^\w\-àâäéèêëïîôùûüç\s]/gi, '').trim() || 'souvenir'
    const link = document.createElement('a')
    const objectUrl = URL.createObjectURL(blob)
    link.href = objectUrl
    link.download = `${safeName}_${Date.now()}.${ext}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(objectUrl)
  } catch (err) {
    console.error('Téléchargement:', err)
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}

function guessExtension(url, mime) {
  if (mime?.includes('video')) return 'mp4'
  if (mime?.includes('audio')) return 'mp3'
  if (mime?.includes('png')) return 'png'
  if (mime?.includes('webp')) return 'webp'
  const m = String(url).match(/\.(\w{3,4})(?:\?|$)/i)
  return m ? m[1].toLowerCase() : 'jpg'
}
