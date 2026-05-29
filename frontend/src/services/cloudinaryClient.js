import {
  cloudinaryResourceTypeForSouvenir,
  extensionFromName
} from '../lib/mediaKinds'

/**
 * Upload direct vers Cloudinary (navigateur) — fonctionne même si Railway
 * n’a pas encore le dernier backend, tant que le preset unsigned existe.
 */
export async function uploadFilesToCloudinary(
  files,
  type = 'PHOTO',
  folder = 'memory_haven/souvenirs'
) {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary frontend non configuré (VITE_CLOUDINARY_*)')
  }

  const urls = []
  for (const file of files) {
    const resourceType = cloudinaryResourceTypeForSouvenir(type, file)
    const body = new FormData()
    body.append('file', file)
    body.append('upload_preset', uploadPreset)
    body.append('folder', folder)

    if (resourceType === 'raw') {
      const ext = extensionFromName(file.name)
      const base = (file.name || 'fichier')
        .replace(/\.[^.]+$/, '')
        .replace(/[^\w\-àâäéèêëïîôùûüç]/gi, '_')
        .slice(0, 72)
      body.append('public_id', `${base || 'fichier'}_${Date.now()}${ext ? `.${ext}` : ''}`)
    }

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
      { method: 'POST', body }
    )
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(
        data.error?.message ||
          'Upload Cloudinary refusé. Créez un preset unsigned « memory_haven_unsigned » sur cloudinary.com.'
      )
    }
    urls.push(data.secure_url)
  }
  return urls
}
