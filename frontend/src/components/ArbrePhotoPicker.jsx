import { useRef, useState } from 'react'
import UserAvatar from './UserAvatar'
import {
  getArbreMemberInitials,
  getArbreMemberPhoto,
  removeArbreMemberPhoto,
  uploadArbreMemberPhoto
} from '../services/arbreApi'

export default function ArbrePhotoPicker({ membre, size = 64, onUpdated }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const photoUrl = getArbreMemberPhoto(membre)
  const initials = getArbreMemberInitials(membre?.nom)

  const pickFile = () => {
    if (uploading) return
    inputRef.current?.click()
  }

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('Choisissez une image (JPG, PNG, etc.)')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image trop lourde (max 5 Mo)')
      return
    }

    setUploading(true)
    try {
      const data = await uploadArbreMemberPhoto(membre.id, file)
      onUpdated?.(data)
    } catch (err) {
      alert(err.message || err.userMessage || 'Impossible d’envoyer la photo')
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = async (e) => {
    e.stopPropagation()
    if (!membre.photo_url) return
    if (!window.confirm('Supprimer la photo de ce membre ?')) return
    setUploading(true)
    try {
      const data = await removeArbreMemberPhoto(membre.id)
      onUpdated?.(data)
    } catch (err) {
      alert(err.userMessage || 'Erreur lors de la suppression')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="mh-profile-picker mh-arbre-photo-picker">
      <div className="mh-profile-picker-wrap" onClick={pickFile}>
        <UserAvatar
          initials={initials}
          avatarUrl={photoUrl}
          size={size}
          onClick={pickFile}
        />
        <span className="mh-profile-picker-badge" title="Photo de l’arbre">
          {uploading ? '⏳' : '📷'}
        </span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        style={{ display: 'none' }}
        onChange={handleFile}
      />
      <div className="mh-profile-picker-actions">
        <button
          type="button"
          className="mh-profile-picker-btn"
          onClick={pickFile}
          disabled={uploading}
        >
          {uploading ? 'Envoi…' : photoUrl ? 'Changer la photo' : 'Ajouter une photo'}
        </button>
        {membre.photo_url && (
          <button
            type="button"
            className="mh-profile-picker-btn mh-profile-picker-btn--muted"
            onClick={handleRemove}
            disabled={uploading}
          >
            Supprimer
          </button>
        )}
      </div>
      {membre.utilisateur?.avatar_url && !membre.photo_url && (
        <p className="mh-arbre-photo-hint">
          Photo du compte utilisateur affichée — ajoutez une photo dédiée pour l’arbre.
        </p>
      )}
    </div>
  )
}
