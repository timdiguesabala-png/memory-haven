const MAX_EDGE = 1920
const JPEG_QUALITY = 0.82
const COMPRESS_ABOVE_BYTES = 400 * 1024

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Image illisible'))
    }
    img.src = url
  })
}

/**
 * Réduit les photos lourdes avant envoi Cloudinary (plus rapide sur mobile).
 */
export async function compressImageIfNeeded(file) {
  if (!file?.type?.startsWith('image/') || file.size < COMPRESS_ABOVE_BYTES) {
    return file
  }
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') {
    return file
  }

  try {
    const img = await loadImage(file)
    let { width, height } = img
    const scale = Math.min(1, MAX_EDGE / Math.max(width, height))
    width = Math.round(width * scale)
    height = Math.round(height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, width, height)

    const blob = await new Promise((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY)
    })
    if (!blob || blob.size >= file.size) return file

    const base = (file.name || 'photo').replace(/\.[^.]+$/, '')
    return new File([blob], `${base}.jpg`, { type: 'image/jpeg', lastModified: Date.now() })
  } catch {
    return file
  }
}

export async function compressImagesIfNeeded(files) {
  return Promise.all(files.map((f) => compressImageIfNeeded(f)))
}
